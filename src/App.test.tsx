import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Minimal test component to check if React is working
export default function TestApp() {
  const [isWorking, setIsWorking] = React.useState(false);
  
  React.useEffect(() => {
    console.log('React is working!');
    setIsWorking(true);
  }, []);

  return (
    <BrowserRouter>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>React Test</h1>
        <p>Status: {isWorking ? 'Working' : 'Loading...'}</p>
      </div>
    </BrowserRouter>
  );
}