function Login() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h1>Parker Soluções ERP</h1>
        <p>Sistema funcionando!</p>
        <button 
          onClick={() => alert('Clique funcionou!')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Teste
        </button>
      </div>
    </div>
  );
}

export default Login;