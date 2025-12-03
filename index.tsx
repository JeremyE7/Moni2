import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
const errorDisplay = document.getElementById('error-display');

try {
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Failed to mount application:", e);
  if (errorDisplay) {
    errorDisplay.style.display = 'block';
    errorDisplay.innerText = "Error cargando la aplicación: " + (e instanceof Error ? e.message : String(e));
  }
}