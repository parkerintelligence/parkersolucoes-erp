import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

// Root wrapper that ensures React is fully initialized
const Root = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Double-check React is loaded
    if (typeof useState === 'function' && typeof useEffect === 'function') {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#666'
      }}>
        Carregando...
      </div>
    );
  }

  return <App />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);