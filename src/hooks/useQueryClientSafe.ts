import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export const useQueryClientSafe = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkContext = async () => {
      try {
        // Small delay to ensure context is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mounted) {
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    checkContext();

    return () => {
      mounted = false;
    };
  }, []);

  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (err) {
    setError(err as Error);
  }

  return {
    queryClient,
    isReady: isReady && !error,
    error
  };
};