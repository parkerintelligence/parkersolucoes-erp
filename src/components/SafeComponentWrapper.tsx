import React from 'react';

interface SafeComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Universal safe wrapper that ensures React is fully initialized before rendering children
export const SafeComponentWrapper: React.FC<SafeComponentWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Ensure React context is properly set up
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return fallback || (
      <div className="min-h-32 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded-lg mb-2 w-32"></div>
          <div className="h-4 bg-slate-800 rounded-lg w-24"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};