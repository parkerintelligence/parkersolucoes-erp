import * as React from 'react';

// Hook to validate React is properly loaded before using other hooks
export const useReactValidation = () => {
  const [isReactReady, setIsReactReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      // Validate React is available
      if (!React || typeof React.useState !== 'function') {
        throw new Error('React hooks not available');
      }
      
      // Validate React DOM is available
      if (typeof window !== 'undefined') {
        const ReactDOM = (window as any).ReactDOM;
        if (!ReactDOM) {
          console.warn('ReactDOM not found on window');
        }
      }

      setIsReactReady(true);
      console.log('React validation passed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown React error';
      setError(errorMsg);
      console.error('React validation failed:', errorMsg);
    }
  }, []);

  return { isReactReady, error };
};