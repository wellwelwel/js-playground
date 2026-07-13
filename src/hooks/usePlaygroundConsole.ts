import type { LogEntry, SandboxMessage } from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SANDBOX_MARKER } from '../constants';
import { buildSandboxDocument } from '../sandbox/runtime';

const isSandboxMessage = (value: unknown): value is SandboxMessage => {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'marker' in value &&
    value.marker === SANDBOX_MARKER &&
    'token' in value &&
    'method' in value &&
    'tokens' in value &&
    Array.isArray(value.tokens)
  );
};

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

  const run = useCallback((code: string, keepLogs = false) => {
    const token = `${Date.now()}-${Math.random()}`;

    activeTokenRef.current = token;

    setLogs((current) => {
      if (!keepLogs) return [];
      if (current.length === 0) return current;

      return [...current, { id: nextEntryIdRef.current++, divider: true }];
    });
    setRunId((current) => current + 1);
    setSandboxDocument(buildSandboxDocument(code, token));
  }, []);

  const clear = useCallback(() => setLogs([]), []);

  return { logs, sandboxDocument, runId, run, clear };
};
