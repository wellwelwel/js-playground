import type { LogEntry } from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isSandboxMessage } from '../sandbox/message';
import { buildSandboxDocument } from '../sandbox/runtime';

export const usePlaygroundConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sandboxDocument, setSandboxDocument] = useState('');
  const [runId, setRunId] = useState(0);
  const activeTokenRef = useRef('');
  const nextEntryIdRef = useRef(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        !isSandboxMessage(event.data) ||
        event.data.token !== activeTokenRef.current
      )
        return;

      const { method, tokens } = event.data;

      setLogs((current) => [
        ...current,
        { id: nextEntryIdRef.current++, method, tokens },
      ]);
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const run = useCallback((code: string, persistLogs = false) => {
    const token = `${Date.now()}-${Math.random()}`;

    activeTokenRef.current = token;

    setLogs((current) => {
      if (!persistLogs) return [];
      if (current.length === 0) return current;

      return [...current, { id: nextEntryIdRef.current++, divider: true }];
    });
    setRunId((current) => current + 1);
    setSandboxDocument(buildSandboxDocument(code, token));
  }, []);

  const clear = useCallback(() => setLogs([]), []);

  return { logs, sandboxDocument, runId, run, clear };
};
