import { useEffect, useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ConsolePanel } from './components/ConsolePanel';
import { Footer } from './components/Footer';
import { Toolbar } from './components/Toolbar';
import { DEFAULT_CODE } from './constants';
import { usePlaygroundConsole } from './hooks/usePlaygroundConsole';

export const App = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [persistLogs, setPersistLogs] = useState(false);
  const { logs, sandboxDocument, runId, run, clear } = usePlaygroundConsole();

  const runCurrentCode = () => run(code, persistLogs);

  useEffect(() => {
    run(DEFAULT_CODE);
  }, [run]);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    if (!persistLogs) clear();
  };

  return (
    <div className='flex flex-col h-full'>
      <Toolbar
        onRun={runCurrentCode}
        onClear={clear}
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
