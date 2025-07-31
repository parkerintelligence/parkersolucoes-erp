import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const { StrictMode } = React;
console.log('main.tsx - React:', React, 'StrictMode:', StrictMode);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
