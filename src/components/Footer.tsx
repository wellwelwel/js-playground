const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iP(hone|ad|od)/.test(navigator.platform);

const modifier = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { label: 'Run', keys: [modifier, 'Enter'] },
  { label: 'Toggle comment', keys: [modifier, '/'] },
  { label: 'Clear', keys: [modifier, 'L'] },
];

const GitHubIcon = () => (
  <svg
    viewBox='0 0 16 16'
    width='14'
    height='14'
    fill='currentColor'
    aria-hidden
  >
    <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z' />
  </svg>
);

export const Footer = () => (
  <footer className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 border-t border-border bg-panel text-muted text-xs'>
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
      {shortcuts.map((shortcut) => (
        <span key={shortcut.label} className='flex items-center gap-1.5'>
          <span>{shortcut.label}</span>
          <span className='flex items-center gap-1'>
            {shortcut.keys.map((key) => (
              <kbd
                key={key}
                className='rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[11px] text-text'
              >
                {key}
              </kbd>
            ))}
          </span>
        </span>
      ))}
    </div>

    <div className='flex items-center gap-1.5'>
      <span>
        Feito por{' '}
        <a
          href='https://github.com/wellwelwel'
          target='_blank'
          rel='noreferrer'
          className='text-text underline-offset-2 hover:underline'
        >
          Weslley Araújo
        </a>
      </span>
      <span aria-hidden>·</span>
      <a
        href='https://github.com/wellwelwel/js-playground'
        target='_blank'
        rel='noreferrer'
        className='flex items-center gap-1 text-text underline-offset-2 hover:underline'
      >
        <GitHubIcon />
      </a>
    </div>
  </footer>
);
