import * as React from 'react';

function App() {
  console.log('React object:', React);
  console.log('useState:', React.useState);
  
  return React.createElement('div', { 
    className: 'min-h-screen bg-gray-100 flex items-center justify-center' 
  }, 'Hello World - React Test');
}

export default App;