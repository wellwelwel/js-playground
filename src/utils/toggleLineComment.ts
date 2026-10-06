import type { TextEdit } from '../types';

const LINE_COMMENT = '//';

const indentationOf = (line: string) =>
  line.slice(0, line.length - line.trimStart().length);

const isBlank = (line: string) => line.trim().length === 0;

const isCommented = (line: string) => line.trimStart().startsWith(LINE_COMMENT);

const commentLine = (line: string) => {
  const indentation = indentationOf(line);

  return `${indentation}${LINE_COMMENT} ${line.slice(indentation.length)}`;
};

const uncommentLine = (line: string) => {
  const indentation = indentationOf(line);
  const content = line.slice(indentation.length);
  const marker = content.startsWith(`${LINE_COMMENT} `)
    ? `${LINE_COMMENT} `
    : LINE_COMMENT;

  return indentation + content.slice(marker.length);
};

export const toggleLineComment = (
  value: string,
  selectionStart: number,
  selectionEnd: number
): TextEdit => {
  const blockStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineBreakAfterSelection = value.indexOf('\n', selectionEnd);
  const blockEnd =
    lineBreakAfterSelection === -1 ? value.length : lineBreakAfterSelection;
  const lines = value.slice(blockStart, blockEnd).split('\n');
  const contentLines = lines.filter((line) => !isBlank(line));
  const allCommented =
    contentLines.length > 0 && contentLines.every(isCommented);
  const toggle = allCommented ? uncommentLine : commentLine;
  const nextLines = lines.map((line) => (isBlank(line) ? line : toggle(line)));
  const nextBlock = nextLines.join('\n');

  return {
    value: value.slice(0, blockStart) + nextBlock + value.slice(blockEnd),
    selectionStart: selectionStart + nextLines[0].length - lines[0].length,
    selectionEnd: selectionEnd + nextBlock.length - (blockEnd - blockStart),
  };
};
