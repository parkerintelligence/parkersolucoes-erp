import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';

// Simplified App without QueryClient and AuthProvider to test React
export default function App() {
  const [isReactWorking, setIsReactWorking] = React.useState(false);
  
  React.useEffect(() => {
    console.log('App mounted successfully with React hooks');
    setIsReactWorking(true);
  }, []);
  
  if (!isReactWorking) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Initializing React...</p>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>React is working!</h1>
        <p>App component loaded successfully.</p>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}