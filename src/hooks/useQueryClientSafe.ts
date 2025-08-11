import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useQueryClientSafe = () => {
  let queryClient;
  let error = null;
  
  try {
    queryClient = useQueryClient();
  } catch (err) {
    error = err as Error;
  }

  return {
    queryClient,
    isReady: !error,
    error
  };
};