import React from 'react';
import { AppSidebar } from './AppSidebar';
import { useQueryClient } from '@tanstack/react-query';

export function SafeAppSidebar() {
  // Check if query client is available before rendering AppSidebar
  try {
    useQueryClient();
    return <AppSidebar />;
  } catch (error) {
    console.log('SafeAppSidebar: QueryClient not available yet, rendering without hooks');
    return (
      <div className="border-r border-primary-foreground/20 bg-slate-900 w-14">
        <div className="p-2 sm:p-4 border-b border-primary-foreground/20 bg-slate-900">
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }
}