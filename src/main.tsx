import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Simple Login component for testing
const SimpleLogin = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1e293b', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui'
    }}>
      <div style={{
        backgroundColor: '#374151',
        padding: '40px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
          Sistema Parker
        </h1>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #6b7280',
                backgroundColor: '#4b5563',
                color: 'white',
                fontSize: '16px'
              }}
              placeholder="Digite seu email"
            />
          </div>
          <div>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #6b7280',
                backgroundColor: '#4b5563',
                color: 'white',
                fontSize: '16px'
              }}
              placeholder="Digite sua senha"
            />
          </div>
          <button
            type="button"
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
            onClick={() => alert('React hooks funcionando! Email: ' + email)}
          >
            Entrar
          </button>
        </form>
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '14px', 
          textAlign: 'center', 
          marginTop: '20px' 
        }}>
          Sistema testando React hooks - {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// Simple App with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<SimpleLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found!');
}