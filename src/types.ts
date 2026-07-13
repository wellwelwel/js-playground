export type ConsoleMethod =
  'log' | 'info' | 'warn' | 'error' | 'debug' | 'result';

export type ConsoleTokenKind =
  'plain' | 'string' | 'number' | 'boolean' | 'nullish' | 'symbol' | 'function';

export type ConsoleToken = {
  text: string;
  kind: ConsoleTokenKind;
};

export type LogEntry =
  | {
      id: number;
      method: ConsoleMethod;
      tokens: ConsoleToken[];
    }
  | {
      id: number;
      divider: true;
    };

export type SandboxMessage = {
  marker: string;
  token: string;
  method: ConsoleMethod;
  tokens: ConsoleToken[];
};
