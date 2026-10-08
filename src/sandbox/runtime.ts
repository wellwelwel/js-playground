import type {
  ConsoleToken,
  ConsoleTokenKind,
  InterceptedConsoleMethod,
  TypedArray,
} from '../types';
import { SANDBOX_MARKER } from '../constants';

// `sandbox` reaches the iframe as source text through `toString()` and must stay self-contained.
const sandbox = (marker: string, token: string, encodedCode: string) => {
  const interceptedMethods: InterceptedConsoleMethod[] = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
  ];
  let consoleWasUsed = false;

  const toTokens = (text: string, kind: ConsoleTokenKind): ConsoleToken[] => [
    { text, kind },
  ];

  const plainTokens = (text: string) => toTokens(text, 'plain');

  const padding = (count: number) => (count > 0 ? ' ' : '');

  const isTypedArray = (value: object): value is TypedArray =>
    ArrayBuffer.isView(value) && !(value instanceof DataView);

  const isArrayIndex = (key: string | symbol) =>
    typeof key === 'string' && /^(?:0|[1-9]\d*)$/.test(key);

  const classNameOf = (value: object): string => {
    const tag = Object.prototype.toString.call(value).slice(8, -1);
    if (tag !== 'Object') return tag;

    const prototype: object | null = Object.getPrototypeOf(value);
    const constructorName = prototype?.constructor?.name || '';

    return constructorName === 'Object' ? '' : constructorName;
  };

  const joinTokens = (items: ConsoleToken[][]): ConsoleToken[] =>
    items.flatMap((item, index) =>
      index > 0 ? [...plainTokens(', '), ...item] : item
    );

  const serializeList = (
    open: string,
    close: string,
    items: ConsoleToken[][]
  ): ConsoleToken[] => [
    ...plainTokens(open),
    ...joinTokens(items),
    ...plainTokens(close),
  ];

  const serializeBraced = (name: string, items: ConsoleToken[][]) => {
    const space = padding(items.length);
    const open = name === '' ? '{' : `${name} {`;

    return serializeList(`${open}${space}`, `${space}}`, items);
  };

  const safely = (describe: () => ConsoleToken[]): ConsoleToken[] => {
    try {
      return describe();
    } catch {
      return plainTokens('[Unserializable]');
    }
  };

  const postToParent = (method: string, tokens: ConsoleToken[]) => {
    window.parent.postMessage({ marker, token, method, tokens }, '*');
  };

  const serialize = (
    value: unknown,
    isTopLevel: boolean,
    visited: WeakSet<object>
  ): ConsoleToken[] => {
    const serializeNested = (item: unknown) =>
      safely(() => serialize(item, false, visited));

    const serializeElements = (items: unknown[]) =>
      Array.from(items, (item, index) =>
        index in items ? serializeNested(item) : toTokens('empty', 'nullish')
      );

    const serializeEntry = ([key, entryValue]: [unknown, unknown]) => [
      ...serializeNested(key),
      ...plainTokens(' => '),
      ...serializeNested(entryValue),
    ];

    const serializeDescriptor = (
      descriptor: PropertyDescriptor | undefined
    ): ConsoleToken[] => {
      if (descriptor?.get)
        return toTokens(
          descriptor.set ? '[Getter/Setter]' : '[Getter]',
          'accessor'
        );
      if (descriptor?.set) return toTokens('[Setter]', 'accessor');

      return serializeNested(descriptor?.value);
    };

    const serializeProperty = (owner: object, key: string | symbol) => {
      const descriptor = Object.getOwnPropertyDescriptor(owner, key);

      return [
        ...toTokens(
          `${String(key)}: `,
          descriptor?.enumerable ? 'plain' : 'hidden'
        ),
        ...serializeDescriptor(descriptor),
      ];
    };

    const serializeProperties = (
      owner: object,
      isListed: (key: string | symbol) => boolean = () => true
    ) =>
      Reflect.ownKeys(owner)
        .filter(isListed)
        .map((key) => serializeProperty(owner, key));

    if (value === null) return toTokens('null', 'nullish');
    if (typeof value === 'string')
      return isTopLevel
        ? plainTokens(value)
        : toTokens(JSON.stringify(value), 'string');
    if (typeof value === 'number') return toTokens(String(value), 'number');
    if (typeof value === 'boolean') return toTokens(String(value), 'boolean');
    if (typeof value === 'bigint') return toTokens(`${value}n`, 'number');
    if (typeof value === 'undefined') return toTokens('undefined', 'nullish');
    if (typeof value === 'symbol') return toTokens(value.toString(), 'symbol');
    if (typeof value === 'function')
      return [
        ...toTokens('ƒ ', 'function'),
        ...toTokens(`${value.name || 'anonymous'}()`, 'functionName'),
      ];
    if (visited.has(value)) return plainTokens('[Circular]');

    if (value instanceof Error)
      return plainTokens(value.stack || `${value.name}: ${value.message}`);
    if (value instanceof RegExp) return plainTokens(value.toString());
    if (value instanceof Date) return plainTokens(value.toISOString());
    if (value instanceof Promise) return plainTokens('Promise {}');
    if (value instanceof WeakMap) return plainTokens('WeakMap {}');
    if (value instanceof WeakSet) return plainTokens('WeakSet {}');
    if (typeof URL !== 'undefined' && value instanceof URL)
      return plainTokens(`URL "${value.href}"`);
    if (
      typeof URLSearchParams !== 'undefined' &&
      value instanceof URLSearchParams
    ) {
      const entries = [...value].map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)} => ${JSON.stringify(entryValue)}`
      );
      const space = padding(entries.length);

      return plainTokens(
        `URLSearchParams {${space}${entries.join(', ')}${space}}`
      );
    }
    if (value instanceof DataView)
      return plainTokens(
        `DataView { byteLength: ${value.byteLength}, byteOffset: ${value.byteOffset} }`
      );
    if (isTypedArray(value)) {
      const typeName = value.constructor?.name || 'TypedArray';

      return serializeList(
        `${typeName}(${value.length}) [`,
        ']',
        Array.from(value, serializeNested)
      );
    }
    if (value instanceof ArrayBuffer)
      return plainTokens(`ArrayBuffer { byteLength: ${value.byteLength} }`);

    visited.add(value);
    try {
      if (Array.isArray(value))
        return serializeList('[', ']', [
          ...serializeElements(value),
          ...serializeProperties(
            value,
            (key) => key !== 'length' && !isArrayIndex(key)
          ),
        ]);
      if (value instanceof Set)
        return serializeBraced(
          `Set(${value.size})`,
          [...value].map(serializeNested)
        );
      if (value instanceof Map)
        return serializeBraced(
          `Map(${value.size})`,
          [...value].map(serializeEntry)
        );

      return serializeBraced(classNameOf(value), serializeProperties(value));
    } finally {
      visited.delete(value);
    }
  };

  const serializeTopLevel = (value: unknown) =>
    safely(() => serialize(value, true, new WeakSet()));

  const formatArguments = (values: unknown[]): ConsoleToken[] =>
    values.flatMap((value, index) =>
      index > 0
        ? [...plainTokens(' '), ...serializeTopLevel(value)]
        : serializeTopLevel(value)
    );

  const interceptConsole = (method: InterceptedConsoleMethod) => {
    const original = console[method].bind(console);

    return (...values: unknown[]) => {
      consoleWasUsed = true;
      postToParent(method, formatArguments(values));
      original(...values);
    };
  };

  Object.assign(
    console,
    Object.fromEntries(
      interceptedMethods.map((method) => [method, interceptConsole(method)])
    )
  );

  window.addEventListener('error', (event) => {
    postToParent(
      'error',
      plainTokens(
        event.error instanceof Error
          ? event.error.stack || event.error.message
          : event.message
      )
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    postToParent('error', [
      ...plainTokens('Uncaught (in promise) '),
      ...serializeTopLevel(event.reason),
    ]);
  });

  try {
    const result = (0, eval)(decodeURIComponent(encodedCode));
    if (!consoleWasUsed && typeof result !== 'undefined')
      postToParent('result', serializeTopLevel(result));
  } catch (error) {
    postToParent(
      'error',
      error instanceof Error
        ? plainTokens(error.stack || error.message)
        : serializeTopLevel(error)
    );
  }
};

export const buildSandboxDocument = (code: string, token: string): string => {
  const invocation = `(${sandbox.toString()})(${JSON.stringify(SANDBOX_MARKER)}, ${JSON.stringify(token)}, ${JSON.stringify(encodeURIComponent(code))})`;
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><script>${invocation}</script></body></html>`;
};
