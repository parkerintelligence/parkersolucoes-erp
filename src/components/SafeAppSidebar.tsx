import React, { useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';

export function SafeAppSidebar() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay to ensure React and all providers are fully initialized
    const timer = setTimeout(() => {
      try {
        // Test if React hooks are working
        if (typeof React !== 'undefined' && React.useState) {
          setIsReady(true);
        }
      } catch (err) {
        console.log('SafeAppSidebar: Initialization failed, using fallback');
      }
    }, 150); // Slightly longer delay for sidebar

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="border-r border-primary-foreground/20 bg-slate-900 w-14">
        <div className="p-2 sm:p-4 border-b border-primary-foreground/20 bg-slate-900">
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="p-2 space-y-2">
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return <AppSidebar />;
}