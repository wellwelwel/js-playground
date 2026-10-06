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

  const postToParent = (method: string, tokens: ConsoleToken[]) => {
    window.parent.postMessage({ marker, token, method, tokens }, '*');
  };

  const serialize = (
    value: unknown,
    isTopLevel: boolean,
    visited: WeakSet<object>
  ): ConsoleToken[] => {
    const serializeNested = (item: unknown) => serialize(item, false, visited);

    const serializeList = <Item>(
      open: string,
      close: string,
      items: Item[],
      serializeItem: (item: Item) => ConsoleToken[]
    ): ConsoleToken[] => [
      ...plainTokens(open),
      ...items.flatMap((item, index) =>
        index > 0
          ? [...plainTokens(', '), ...serializeItem(item)]
          : serializeItem(item)
      ),
      ...plainTokens(close),
    ];

    const serializeBraced = <Item>(
      label: string,
      items: Item[],
      serializeItem: (item: Item) => ConsoleToken[]
    ) => {
      const space = padding(items.length);

      return serializeList(
        `${label}{${space}`,
        `${space}}`,
        items,
        serializeItem
      );
    };

    const serializeEntry = ([key, entryValue]: [unknown, unknown]) => [
      ...serializeNested(key),
      ...plainTokens(' => '),
      ...serializeNested(entryValue),
    ];

    const serializeProperty = ([key, item]: [string, unknown]) => [
      ...plainTokens(`${key}: `),
      ...serializeNested(item),
    ];

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
      return toTokens(`ƒ ${value.name || 'anonymous'}()`, 'function');
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
        Array.from(value),
        serializeNested
      );
    }
    if (value instanceof ArrayBuffer)
      return plainTokens(`ArrayBuffer { byteLength: ${value.byteLength} }`);

    visited.add(value);
    try {
      if (Array.isArray(value))
        return serializeList<unknown>('[', ']', value, serializeNested);
      if (value instanceof Set)
        return serializeBraced<unknown>(
          `Set(${value.size}) `,
          [...value],
          serializeNested
        );
      if (value instanceof Map)
        return serializeBraced<[unknown, unknown]>(
          `Map(${value.size}) `,
          [...value],
          serializeEntry
        );

      const prototype = Object.getPrototypeOf(value);
      const constructorName = value.constructor?.name || '';
      const isPlainObject =
        prototype === null ||
        prototype === Object.prototype ||
        constructorName === '' ||
        constructorName === 'Object';
      const prefix = isPlainObject ? '' : `${constructorName} `;

      return serializeBraced<[string, unknown]>(
        prefix,
        Object.entries(value),
        serializeProperty
      );
    } finally {
      visited.delete(value);
    }
  };

  const serializeTopLevel = (value: unknown) =>
    serialize(value, true, new WeakSet());

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
