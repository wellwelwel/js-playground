import type { KeyboardEvent } from 'react';
import type { CodeEditorProps } from '../types';
import EditorImport from 'react-simple-code-editor';
import { SHORTCUTS } from '../constants';
import { highlightCode } from '../utils/highlightCode';
import { toggleLineComment } from '../utils/toggleLineComment';

const unwrapDefault = <T,>(value: T | { default: T }): T =>
  value !== null && typeof value === 'object' && 'default' in value
    ? value.default
    : value;

const Editor = unwrapDefault(EditorImport);

export const CodeEditor = ({
  code,
  onCodeChange,
  onRun,
  onClear,
}: CodeEditorProps) => {
  const toggleComment = (target: Element) => {
    if (!(target instanceof HTMLTextAreaElement)) return;

    const edit = toggleLineComment(
      target.value,
      target.selectionStart,
      target.selectionEnd
    );

    onCodeChange(edit.value);
    requestAnimationFrame(() =>
      target.setSelectionRange(edit.selectionStart, edit.selectionEnd)
    );
  };

  const shortcutActions = new Map<string, (target: Element) => void>([
    [SHORTCUTS.run.key, onRun],
    [SHORTCUTS.clear.key, onClear],
    [SHORTCUTS.toggleComment.key, toggleComment],
  ]);

  const handleKeyDown = (event: KeyboardEvent<Element>) => {
    if (!(event.metaKey || event.ctrlKey)) return;

    const action = shortcutActions.get(event.key);
    if (!action) return;

    event.preventDefault();
    action(event.currentTarget);
  };

  return (
    <div className='min-h-0 overflow-auto bg-bg'>
      <Editor
        className='min-h-full font-mono text-sm leading-[1.6] [tab-size:2]'
        textareaClassName='outline-none caret-text'
        value={code}
        onValueChange={onCodeChange}
        onKeyDown={handleKeyDown}
        highlight={highlightCode}
        padding={16}
        spellCheck={false}
        aria-label='JavaScript editor'
      />
    </div>
  );
};
