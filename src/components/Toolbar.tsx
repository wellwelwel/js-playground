type ToolbarProps = {
  onRun: () => void;
  onClear: () => void;
  persistLogs: boolean;
  onPersistLogsChange: (persist: boolean) => void;
};

export const Toolbar = ({
  onRun,
  onClear,
  persistLogs,
  onPersistLogsChange,
}: ToolbarProps) => (
  <header className='flex items-center justify-between px-4 py-2.5 border-b border-border bg-panel'>
    <span className='font-semibold tracking-[0.2px]'>JS Playground</span>
    <div className='flex items-center gap-2'>
      <label className='flex items-center gap-1.5 mr-2 text-sm text-muted cursor-pointer select-none'>
        <input
          type='checkbox'
          className='cursor-pointer accent-accent'
          checked={persistLogs}
          onChange={(event) => onPersistLogsChange(event.target.checked)}
        />
        Persist logs
      </label>
      <button
        type='button'
        className='px-4 py-1.5 rounded-md border border-accent bg-accent text-bg text-sm font-semibold cursor-pointer transition hover:brightness-110'
        onClick={onRun}
      >
        Run
      </button>
      <button
        type='button'
        className='px-4 py-1.5 rounded-md border border-border bg-transparent text-text text-sm font-semibold cursor-pointer transition hover:brightness-110'
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  </header>
);
