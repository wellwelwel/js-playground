import type { ConsoleToken, ConsoleTokenKind } from '../types';
import { SANDBOX_MARKER } from '../constants';

// This function is serialized with `sandbox.toString()` and injected into the
// sandboxed iframe, so it must stay self-contained: every dependency it uses
// has to be declared inside it or passed as an argument.
const sandbox = (marker: string, token: string, encodedCode: string) => {
  const postToParent = (method: string, tokens: ConsoleToken[]) => {
    window.parent.postMessage({ marker, token, method, tokens }, '*');
  };

  const serialize = (
    value: unknown,
    isTopLevel: boolean,
    visited: WeakSet<object>,
    out: ConsoleToken[]
  ): void => {
    const push = (text: string, kind: ConsoleTokenKind): void => {
      out.push({ text, kind });
    };

    if (value === null) return push('null', 'nullish');
    if (typeof value === 'string')
      return isTopLevel
        ? push(value, 'plain')
        : push(JSON.stringify(value), 'string');
    if (typeof value === 'number') return push(String(value), 'number');
    if (typeof value === 'boolean') return push(String(value), 'boolean');
    if (typeof value === 'bigint') return push(`${value}n`, 'number');
    if (typeof value === 'undefined') return push('undefined', 'nullish');
    if (typeof value === 'symbol') return push(value.toString(), 'symbol');
    if (typeof value === 'function')
      return push(`ƒ ${value.name || 'anonymous'}()`, 'function');
    if (visited.has(value)) return push('[Circular]', 'plain');

    if (value instanceof Error)
      return push(value.stack || `${value.name}: ${value.message}`, 'plain');
    if (value instanceof RegExp) return push(value.toString(), 'plain');
    if (value instanceof Date) return push(value.toISOString(), 'plain');
    if (value instanceof Promise) return push('Promise {}', 'plain');
    if (value instanceof WeakMap) return push('WeakMap {}', 'plain');
    if (value instanceof WeakSet) return push('WeakSet {}', 'plain');
    if (typeof URL !== 'undefined' && value instanceof URL)
      return push(`URL "${value.href}"`, 'plain');
    if (
      typeof URLSearchParams !== 'undefined' &&
      value instanceof URLSearchParams
    ) {
      const entries = [...value].map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)} => ${JSON.stringify(entryValue)}`
      );
      return push(
        `URLSearchParams {${entries.length ? ` ${entries.join(', ')} ` : ''}}`,
        'plain'
      );
    }
    if (value instanceof DataView)
      return push(
        `DataView { byteLength: ${value.byteLength}, byteOffset: ${value.byteOffset} }`,
        'plain'
      );

    const serializeList = (
      open: string,
      close: string,
      items: unknown[],
      each: (item: unknown) => void
    ) => {
      push(open, 'plain');
      items.forEach((item, index) => {
        if (index > 0) push(', ', 'plain');
        each(item);
      });
      push(close, 'plain');
    };

    if (ArrayBuffer.isView(value)) {
      const typedArray = value as unknown as ArrayLike<number | bigint>;
      const typeName =
        (value.constructor && value.constructor.name) || 'TypedArray';
      return serializeList(
        `${typeName}(${typedArray.length}) [`,
        ']',
        Array.from(typedArray),
        (item) => serialize(item, false, visited, out)
      );
    }
    if (value instanceof ArrayBuffer)
      return push(`ArrayBuffer { byteLength: ${value.byteLength} }`, 'plain');

    visited.add(value);
    try {
      if (Array.isArray(value))
        return serializeList('[', ']', value, (item) =>
          serialize(item, false, visited, out)
        );
      if (value instanceof Set)
        return serializeList(
          `Set(${value.size}) {${value.size ? ' ' : ''}`,
          value.size ? ' }' : '}',
          [...value],
          (item) => serialize(item, false, visited, out)
        );
      if (value instanceof Map)
        return serializeList(
          `Map(${value.size}) {${value.size ? ' ' : ''}`,
          value.size ? ' }' : '}',
          [...value],
          (entry) => {
            const [key, entryValue] = entry as [unknown, unknown];
            serialize(key, false, visited, out);
            push(' => ', 'plain');
            serialize(entryValue, false, visited, out);
          }
        );

      const prototype = Object.getPrototypeOf(value);
      const constructorName =
        (value.constructor && value.constructor.name) || '';
      const isPlainObject =
        prototype === null ||
        prototype === Object.prototype ||
        constructorName === '' ||
        constructorName === 'Object';
      const prefix = isPlainObject ? '' : `${constructorName} `;
      const entries = Object.entries(value);
      return serializeList(
        `${prefix}{${entries.length ? ' ' : ''}`,
        entries.length ? ' }' : '}',
        entries,
        (entry) => {
          const [key, item] = entry as [string, unknown];
          push(`${key}: `, 'plain');
          serialize(item, false, visited, out);
        }
      );
    } finally {
      visited.delete(value);
    }
  };

  const formatArguments = (args: unknown[]): ConsoleToken[] => {
    const out: ConsoleToken[] = [];
    args.forEach((argument, index) => {
      if (index > 0) out.push({ text: ' ', kind: 'plain' });
      serialize(argument, true, new WeakSet(), out);
    });
    return out;
  };

  const plain = (text: string): ConsoleToken[] => [{ text, kind: 'plain' }];

  const patchedMethods: Array<'log' | 'info' | 'warn' | 'error' | 'debug'> = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
  ];
  let consoleWasUsed = false;
  for (const method of patchedMethods) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      consoleWasUsed = true;
      postToParent(method, formatArguments(args));
      original(...args);
    };
  }

  window.addEventListener('error', (event) => {
    postToParent(
      'error',
      plain(
        event.error instanceof Error
          ? event.error.stack || event.error.message
          : event.message
      )
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const tokens: ConsoleToken[] = [
      { text: 'Uncaught (in promise) ', kind: 'plain' },
    ];
    serialize(event.reason, true, new WeakSet(), tokens);
    postToParent('error', tokens);
  });

  try {
    const result = (0, eval)(decodeURIComponent(encodedCode));
    if (!consoleWasUsed && typeof result !== 'undefined') {
      const tokens: ConsoleToken[] = [];
      serialize(result, true, new WeakSet(), tokens);
      postToParent('result', tokens);
    }
  } catch (error) {
    if (error instanceof Error) {
      postToParent('error', plain(error.stack || error.message));
    } else {
      const tokens: ConsoleToken[] = [];
      serialize(error, true, new WeakSet(), tokens);
      postToParent('error', tokens);
    }
  }
};

export const buildSandboxDocument = (code: string, token: string): string => {
  const invocation = `(${sandbox.toString()})(${JSON.stringify(SANDBOX_MARKER)}, ${JSON.stringify(token)}, ${JSON.stringify(encodeURIComponent(code))})`;
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><script>${invocation}</script></body></html>`;
};
