import React, { useState } from 'react';

export const TestComponent = () => {
  const [test, setTest] = useState('working');
  
  return (
    <div className="p-4">
      <h1>Test Component: {test}</h1>
      <button onClick={() => setTest('clicked')}>Test Button</button>
    </div>
  );
};