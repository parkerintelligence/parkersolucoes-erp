import { useState } from 'react';

export const TestComponent = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>React Test: {count}</h1>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ padding: '10px', fontSize: '16px' }}
      >
        Increment
      </button>
      <p>If you can see this and the button works, React is functioning properly!</p>
    </div>
  );
};

export default TestComponent;