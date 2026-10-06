import { SHORTCUTS } from '../constants';
import { GitHubIcon } from './icons';

const isMac = /Mac|iP(hone|ad|od)/.test(navigator.platform);
const modifier = isMac ? '⌘' : 'Ctrl';

const displayKey = (key: string) =>
  key.length === 1 ? key.toUpperCase() : key;

export const Footer = () => (
  <footer className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 border-t border-border bg-panel text-muted text-xs'>
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
      {Object.values(SHORTCUTS).map((shortcut) => (
        <span key={shortcut.label} className='flex items-center gap-1.5'>
          <span>{shortcut.label}</span>
          <span className='flex items-center gap-1'>
            {[modifier, displayKey(shortcut.key)].map((key) => (
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
