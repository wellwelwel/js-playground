import type { ConsoleMethod, ConsoleTokenKind, LogEntry } from '../types';

const entryStyles: Record<ConsoleMethod, string> = {
  log: 'text-text',
  info: 'text-text',
  debug: 'text-muted',
  result: 'text-text',
  warn: 'text-warn bg-warn/[0.08]',
  error: 'text-error bg-error/[0.08]',
};

const tokenStyles: Record<ConsoleTokenKind, string> = {
  plain: '',
  string: 'text-string',
  number: 'text-accent',
  boolean: 'text-accent',
  nullish: 'text-muted',
  symbol: 'text-accent',
  function: 'text-muted italic',
};

const monochromeMethods: ReadonlySet<ConsoleMethod> = new Set([
  'warn',
  'error',
]);

type ConsolePanelProps = {
  logs: LogEntry[];
};

export const ConsolePanel = ({ logs }: ConsolePanelProps) => (
  <section
    className='bg-panel overflow-y-auto py-2 border-t border-border md:border-t-0 md:border-l'
    aria-label='Console output'
  >
    {logs.length === 0 ? (
      <p className='px-4 py-2 text-muted text-sm'></p>
    ) : (
      logs.map((log) =>
        'divider' in log ? (
          <div
            key={log.id}
            className='h-5 bg-black/20 border-b border-white/[0.04]'
            aria-hidden='true'
          />
        ) : (
          <pre
            key={log.id}
            className={`px-4 py-1.5 border-b border-white/[0.04] font-mono text-[13px] leading-normal whitespace-pre-wrap break-words ${entryStyles[log.method]}`}
          >
            {monochromeMethods.has(log.method)
              ? log.tokens.map((token) => token.text).join('')
              : log.tokens.map((token, index) => (
                  <span key={index} className={tokenStyles[token.kind]}>
                    {token.text}
                  </span>
                ))}
          </pre>
        )
      )
    )}
  </section>
);
