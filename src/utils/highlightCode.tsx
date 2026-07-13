import type { PrismTheme } from 'prism-react-renderer';
import { Highlight, themes } from 'prism-react-renderer';

export const editorTheme: PrismTheme = {
  ...themes.dracula,
  styles: [
    ...themes.dracula.styles,
    { types: ['number', 'boolean'], style: { color: 'rgb(189, 147, 249)' } },
  ],
};

export const highlightCode = (code: string) => (
  <Highlight code={code} language='jsx' theme={editorTheme}>
    {({ tokens, getLineProps, getTokenProps }) => (
      <>
        {tokens.map((line, lineIndex) => (
          <div key={lineIndex} {...getLineProps({ line })}>
            {line.map((token, tokenIndex) => (
              <span key={tokenIndex} {...getTokenProps({ token })} />
            ))}
          </div>
        ))}
      </>
    )}
  </Highlight>
);
