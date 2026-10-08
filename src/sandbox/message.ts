import type {
  ConsoleMethod,
  ConsoleToken,
  ConsoleTokenKind,
  SandboxMessage,
} from '../types';
import { SANDBOX_MARKER } from '../constants';

const consoleMethods: Record<ConsoleMethod, true> = {
  log: true,
  info: true,
  warn: true,
  error: true,
  debug: true,
  result: true,
};

const tokenKinds: Record<ConsoleTokenKind, true> = {
  plain: true,
  string: true,
  number: true,
  boolean: true,
  nullish: true,
  symbol: true,
  function: true,
  functionName: true,
  accessor: true,
  hidden: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isConsoleToken = (value: unknown): value is ConsoleToken =>
  isRecord(value) &&
  typeof value.text === 'string' &&
  typeof value.kind === 'string' &&
  Object.hasOwn(tokenKinds, value.kind);

export const isSandboxMessage = (value: unknown): value is SandboxMessage =>
  isRecord(value) &&
  value.marker === SANDBOX_MARKER &&
  typeof value.token === 'string' &&
  typeof value.method === 'string' &&
  Object.hasOwn(consoleMethods, value.method) &&
  Array.isArray(value.tokens) &&
  value.tokens.every(isConsoleToken);
