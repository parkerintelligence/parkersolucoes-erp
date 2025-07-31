import React from 'react';

export const TestComponent = () => {
  console.log('TestComponent: Starting render');
  console.log('React object:', React);
  console.log('React.useState:', React.useState);
  console.log('React.useEffect:', React.useEffect);
  
  const [test, setTest] = React.useState('working');
  
  React.useEffect(() => {
    console.log('TestComponent: useEffect executed');
  }, []);
  
  console.log('TestComponent: Rendering with test value:', test);
  
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Teste do React: {test}</h1>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => {
          console.log('Button clicked');
          setTest('clicked');
        }}
      >
        Testar Botão
      </button>
      <div className="mt-4 text-sm text-gray-600">
        <p>React disponível: {React ? 'Sim' : 'Não'}</p>
        <p>useState disponível: {React.useState ? 'Sim' : 'Não'}</p>
        <p>useEffect disponível: {React.useEffect ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  );
};