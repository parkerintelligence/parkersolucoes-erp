import React from 'react'
import { createRoot } from 'react-dom/client'

// Minimal test component to verify React is working
const MinimalApp = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1e293b', color: 'white', minHeight: '100vh' }}>
      <h1>Sistema Teste</h1>
      <p>Se você está vendo isso, React está funcionando!</p>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MinimalApp />);
} else {
  console.error('Root element not found!');
}