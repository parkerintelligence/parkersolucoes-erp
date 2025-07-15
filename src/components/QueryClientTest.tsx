import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const QueryClientTest = () => {
  try {
    const queryClient = useQueryClient();
    console.log('✅ QueryClient available:', !!queryClient);
    return <div style={{ position: 'fixed', top: 0, right: 0, background: 'green', color: 'white', padding: '4px' }}>QC OK</div>;
  } catch (error) {
    console.error('❌ QueryClient not available:', error);
    return <div style={{ position: 'fixed', top: 0, right: 0, background: 'red', color: 'white', padding: '4px' }}>QC FAIL</div>;
  }
};