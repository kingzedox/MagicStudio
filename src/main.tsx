import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {SolanaProvider} from './components/SolanaProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Buffer } from 'buffer';

window.Buffer = window.Buffer || Buffer;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SolanaProvider>
        <App />
      </SolanaProvider>
    </ErrorBoundary>
  </StrictMode>,
);
