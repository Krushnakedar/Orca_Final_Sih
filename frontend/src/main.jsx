import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';

// Register the service worker.
// In dev this is a no-op because devOptions.enabled = false in vite.config.js.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // VitePWA generates 'sw.js' in the root directory
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ORCA Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('ORCA Service Worker registration failed:', error);
      });
  });
}