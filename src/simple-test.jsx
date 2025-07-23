// Simple test without any complex imports
function SimpleTest() {
  console.log('SimpleTest component loaded');
  
  return React.createElement('div', { 
    style: { padding: '20px', fontFamily: 'Arial' } 
  }, [
    React.createElement('h1', { key: 'title' }, 'Simple React Test'),
    React.createElement('p', { key: 'text' }, 'This tests if React loads without hooks'),
    React.createElement('button', { 
      key: 'button',
      onClick: () => alert('React is working!'),
      style: { padding: '10px', fontSize: '16px' }
    }, 'Click me')
  ]);
}

export default SimpleTest;