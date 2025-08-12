import * as React from 'react';
import { TestComponent } from '@/components/TestComponent';

console.log('React available in App.tsx:', !!React);

function App() {
  console.log('App component rendering');
  
  return React.createElement('div', { className: "min-h-screen bg-background p-8" },
    React.createElement('h1', null, 'App Test'),
    React.createElement(TestComponent)
  );
}
export default App;