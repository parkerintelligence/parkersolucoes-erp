import React, { ReactNode } from 'react';

interface ReactSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ReactSafeWrapper: React.FC<ReactSafeWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  // Simply render children directly - React is already loaded if this component is running
  return <>{children}</>;
};