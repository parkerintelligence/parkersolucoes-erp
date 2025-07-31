import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Cache buster to force reload
console.log('Loading main.tsx at:', new Date().toISOString());

// Completely independent React app with no external dependencies
const CleanApp = () => {
  const [status, setStatus] = React.useState('Initializing...');
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    setStatus('React hooks working!');
  }, []);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      padding: '20px',
      fontFamily: 'system-ui',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '40px', fontSize: '3rem', color: '#3b82f6' }}>
          🚀 Sistema Parker - Clean
        </h1>
        
        <div style={{
          backgroundColor: '#1e293b',
          padding: '40px',
          borderRadius: '12px',
          marginBottom: '40px'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Status do React</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            {status}
          </p>
          
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            useState Test: {count}
          </button>
          
          <button 
            onClick={() => setStatus('Manual status update: ' + new Date().toLocaleTimeString())}
            style={{
              padding: '15px 30px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            Update Status
          </button>
        </div>

        <div style={{
          backgroundColor: '#374151',
          padding: '30px',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Sistema de Login Simples</h3>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Email"
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #6b7280',
                backgroundColor: '#4b5563',
                color: 'white',
                fontSize: '16px'
              }}
            />
            <input
              type="password"
              placeholder="Senha"
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #6b7280',
                backgroundColor: '#4b5563',
                color: 'white',
                fontSize: '16px'
              }}
            />
            <button
              type="button"
              onClick={() => alert('Login simulado funcionando!')}
              style={{
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Entrar no Sistema
            </button>
          </form>
        </div>
        
        <p style={{ 
          marginTop: '40px', 
          fontSize: '14px', 
          opacity: 0.7 
        }}>
          Timestamp: {new Date().toISOString()} | Build: {Math.random().toString(36).substr(2, 9)}
        </p>
      </div>
    </div>
  );
};

// Clear any potential React context issues
const container = document.getElementById('root');
if (container) {
  // Clear container first
  container.innerHTML = '';
  
  try {
    const root = createRoot(container);
    root.render(<CleanApp />);
    console.log('✅ React app mounted successfully!');
  } catch (error) {
    console.error('❌ Failed to mount React app:', error);
    container.innerHTML = `
      <div style="padding: 20px; background: #1e293b; color: white; min-height: 100vh;">
        <h1>Erro Fatal</h1>
        <p>React falhou ao inicializar: ${error}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Recarregar Página
        </button>
      </div>
    `;
  }
} else {
  console.error('❌ Root element not found!');
}