import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TestComponent } from '@/components/TestComponent';

function App() {
  console.log('=== APP.TSX INICIANDO ===');
  console.log('React funcionando:', !!React);
  console.log('React.useState funcionando:', !!React.useState);
  
  const [appState] = React.useState('funcionando');
  console.log('useState do App funcionou:', appState);
  
  return (
    <BrowserRouter>
      <div className="min-h-screen p-4">
        <Routes>
          <Route path="*" element={<TestComponent />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;