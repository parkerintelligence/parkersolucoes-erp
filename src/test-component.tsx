import { useState } from 'react';

export const TestComponent = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>React Test: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default TestComponent;