import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ReactSafeWrapper } from './components/ReactSafeWrapper';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ReactSafeWrapper>
      <App />
    </ReactSafeWrapper>
  </React.StrictMode>
);