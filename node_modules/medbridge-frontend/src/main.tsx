import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@/store/themeStore';
import App from './App.tsx';
import { MOCK_MODE } from '@/lib/constants';

async function enableMocking() {
  if (!MOCK_MODE) return;
  const { worker } = await import('./mocks/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
