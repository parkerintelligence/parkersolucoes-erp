import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TestComponent } from '@/components/TestComponent';

function App() {
  console.log('App: Starting render');
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="*" element={<TestComponent />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;