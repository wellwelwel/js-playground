import type { AppProps } from './types';
import { useCallback, useEffect, useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ConsolePanel } from './components/ConsolePanel';
import { Footer } from './components/Footer';
import { Toolbar } from './components/Toolbar';
import { DEFAULT_CODE } from './constants';
import { usePlaygroundConsole } from './hooks/usePlaygroundConsole';
import { useSharedCodeNavigation } from './hooks/useSharedCodeNavigation';
import { useShareLink } from './hooks/useShareLink';
import { writeDraft } from './utils/codeDraft';

export const App = ({ initialCode }: AppProps) => {
  const [code, setCode] = useState(initialCode);
  const [persistLogs, setPersistLogs] = useState(false);
  const { logs, sandboxDocument, runId, run, clear } = usePlaygroundConsole();
  const { share, linkCopied } = useShareLink(code);

  const runCurrentCode = () => run(code, persistLogs);

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      if (!persistLogs) clear();
    },
    [persistLogs, clear]
  );

  useSharedCodeNavigation(handleCodeChange);

  useEffect(() => {
    if (initialCode === DEFAULT_CODE) run(DEFAULT_CODE);
  }, [run, initialCode]);

  useEffect(() => {
    writeDraft(code);
  }, [code]);

  return (
    <div className='flex flex-col h-full'>
      <Toolbar
        onRun={runCurrentCode}
        onClear={clear}
        onShare={share}
        linkCopied={linkCopied}
        persistLogs={persistLogs}
        onPersistLogsChange={setPersistLogs}
      />

      <main className='grid flex-1 min-h-0 grid-rows-2 grid-cols-1 md:grid-rows-1 md:grid-cols-2'>
        <CodeEditor
          code={code}
          onCodeChange={handleCodeChange}
          onRun={runCurrentCode}
          onClear={clear}
        />
        <ConsolePanel logs={logs} />
      </main>

      <Footer />

      {sandboxDocument !== '' && (
        <iframe
          key={runId}
          title='sandbox'
          className='hidden'
          sandbox='allow-scripts'
          srcDoc={sandboxDocument}
        />
      )}
    </div>
  );
};
