import React, { useState, useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SafeDropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export const SafeDropdownMenu: React.FC<SafeDropdownMenuProps> = ({
  children,
  trigger,
  className,
  align = 'end'
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Ensure component is still mounted
    if (!mountedRef.current) return;
    
    // Extended delay to ensure React context is fully initialized
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsReady(true);
      }
    }, 200);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Don't render dropdown until ready
  if (!isReady || hasError) {
    return <>{trigger}</>;
  }

  try {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className={className}>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } catch (error) {
    console.error('SafeDropdownMenu error:', error);
    setHasError(true);
    return <>{trigger}</>;
  }
};

// Export the individual components for convenience
export {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};