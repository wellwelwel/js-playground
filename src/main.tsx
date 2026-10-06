import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { DEFAULT_CODE } from './constants.ts';
import { readDraft } from './utils/codeDraft.ts';
import { consumeSharedCode } from './utils/shareLink.ts';
import './assets/index.css';

const initialCode = (await consumeSharedCode()) ?? readDraft() ?? DEFAULT_CODE;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialCode={initialCode} />
  </StrictMode>
);
