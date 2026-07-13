import { type KeyboardEvent } from 'react';
import EditorImport from 'react-simple-code-editor';
import { highlightCode } from '../utils/highlightCode';

const unwrapDefault = <T,>(value: T | { default: T }): T =>
  value !== null && typeof value === 'object' && 'default' in value
    ? value.default
    : value;

const Editor = unwrapDefault(EditorImport);

const COMMENT = '//';

const toggleLineComment = (
  value: string,
  selectionStart: number,
  selectionEnd: number
) => {
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineEndIndex = value.indexOf('\n', selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split('\n');
  const contentLines = lines.filter((line) => line.trim().length > 0);
  const allCommented =
    contentLines.length > 0 &&
    contentLines.every((line) => line.trim().startsWith(COMMENT));

  const indent = (line: string) =>
    line.slice(0, line.length - line.trimStart().length);

  let startDelta = 0;
  let totalDelta = 0;
  const nextLines = lines.map((line, index) => {
    if (line.trim().length === 0) return line;
    let next: string;
    if (allCommented) {
      const pad = indent(line);
      const rest = line.slice(pad.length);
      const stripped = rest.startsWith(`${COMMENT} `)
        ? rest.slice(COMMENT.length + 1)
        : rest.slice(COMMENT.length);
      next = pad + stripped;
    } else {
      const pad = indent(line);
      next = `${pad}${COMMENT} ${line.slice(pad.length)}`;
    }
    const delta = next.length - line.length;
    if (index === 0) startDelta = delta;
    totalDelta += delta;
    return next;
  });

  const nextBlock = nextLines.join('\n');
  const nextValue =
    value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  return {
    value: nextValue,
    selectionStart: selectionStart + startDelta,
    selectionEnd: selectionEnd + totalDelta,
  };
};

type CodeEditorProps = {
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onClear: () => void;
};

export const CodeEditor = ({
  code,
  onCodeChange,
  onRun,
  onClear,
}: CodeEditorProps) => {
  const handleKeyDown = (event: KeyboardEvent<Element>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      onRun();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
      event.preventDefault();
      onClear();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
      const textarea = event.currentTarget;
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      event.preventDefault();
      const result = toggleLineComment(
        textarea.value,
        textarea.selectionStart,
        textarea.selectionEnd
      );
      onCodeChange(result.value);
      requestAnimationFrame(() => {
        textarea.selectionStart = result.selectionStart;
        textarea.selectionEnd = result.selectionEnd;
      });
    }
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
