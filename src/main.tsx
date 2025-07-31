import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// App básico temporário para testar React
function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-8">Sistema Funcionando!</h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
          <p className="text-xl mb-4">React está carregado corretamente</p>
          <p className="text-lg mb-4">Contador de teste: {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Incrementar
          </button>
        </div>
        <p className="mt-4 text-sm opacity-75">
          React hooks funcionando normalmente ✅
        </p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);