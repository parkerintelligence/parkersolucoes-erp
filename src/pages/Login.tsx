import React from 'react';

const Login = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - redirect to links page
    window.location.href = '/links';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            margin: '0 0 0.5rem 0' 
          }}>
            Parker Soluções ERP
          </h1>
          <p style={{ 
            color: '#94a3b8', 
            margin: 0 
          }}>
            Sistema de Gestão Empresarial
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#e2e8f0', 
              fontSize: '0.875rem', 
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#e2e8f0', 
              fontSize: '0.875rem', 
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Entrar
          </button>
        </form>

        {/* Features */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.5rem'
            }}>
              🛡️
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
              Seguro
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.5rem'
            }}>
              ⚡
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
              Rápido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;