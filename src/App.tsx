
import React from 'react';

function App() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('React is working!');
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>React Test</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <p style={{ marginTop: '20px', color: 'green' }}>
        If you can see this and the button works, React is functioning properly.
      </p>
    </div>
  );
}

export default App;
