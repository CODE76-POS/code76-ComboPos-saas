// Ensure window.fetch has both getter and setter or is writable to prevent extension errors
try {
  if (typeof window !== 'undefined') {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    let _activeFetch = origFetch;

    const protoDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
    if (protoDesc && !protoDesc.set) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', {
          configurable: true,
          enumerable: true,
          get() {
            return _activeFetch;
          },
          set(fn) {
            _activeFetch = fn;
          },
        });
      } catch {
        // Fallback
      }
    }

    const winDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (winDesc && !winDesc.set && !winDesc.writable) {
      try {
        Object.defineProperty(window, 'fetch', {
          configurable: true,
          enumerable: true,
          get() {
            return _activeFetch;
          },
          set(fn) {
            _activeFetch = fn;
          },
        });
      } catch {
        // Ignore
      }
    }
  }
} catch {
  // Ignore polyfill error
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
