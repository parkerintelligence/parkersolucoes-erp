import React from 'react';

function App() {
  console.log('App: React object:', React);
  
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Teste Simples: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Clique aqui
      </button>
    </div>
  );
}

export default App;