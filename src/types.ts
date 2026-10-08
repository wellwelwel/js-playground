export type ConsoleMethod =
  'log' | 'info' | 'warn' | 'error' | 'debug' | 'result';

export type InterceptedConsoleMethod = Exclude<ConsoleMethod, 'result'>;

export type ConsoleTokenKind =
  | 'plain'
  | 'string'
  | 'number'
  | 'boolean'
  | 'nullish'
  | 'symbol'
  | 'function'
  | 'functionName'
  | 'accessor'
  | 'hidden';

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

export type TypedArray = ArrayBufferView & ArrayLike<number | bigint>;

export type Shortcut = {
  label: string;
  key: string;
};

export type TextEdit = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export type AppProps = {
  initialCode: string;
};

export type ToolbarProps = {
  onRun: () => void;
  onClear: () => void;
  onShare: () => void;
  linkCopied: boolean;
  persistLogs: boolean;
  onPersistLogsChange: (persist: boolean) => void;
};

export type CodeEditorProps = {
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onClear: () => void;
};

export type ConsolePanelProps = {
  logs: LogEntry[];
};
