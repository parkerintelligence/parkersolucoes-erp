import * as React from 'react';

export function TestComponent() {
  console.log('TestComponent: React available:', !!React);
  console.log('TestComponent: useState available:', !!React.useState);
  
  const [count, setCount] = React.useState(0);
  
  return React.createElement('div', {
    style: { padding: '20px', background: '#f0f0f0', margin: '20px' }
  }, 
    React.createElement('h2', null, 'React Test Component'),
    React.createElement('p', null, `Count: ${count}`),
    React.createElement('button', {
      onClick: () => setCount(count + 1)
    }, 'Increment')
  );
}