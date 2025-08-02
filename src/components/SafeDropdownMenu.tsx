import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Small delay to ensure React context is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
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
    return <>{trigger}</>;
  }
};

// Export the individual components for convenience
export {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};