import React, { useState, useEffect, useRef } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SafeCollapsibleProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const SafeCollapsible: React.FC<SafeCollapsibleProps> = ({
  children,
  trigger,
  open,
  onOpenChange,
  className
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
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Don't render collapsible until ready
  if (!isReady || hasError) {
    return (
      <div className={className}>
        {trigger}
        {open && <div className="ml-6 mt-0.5">{children}</div>}
      </div>
    );
  }

  try {
    return (
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          {trigger}
        </CollapsibleTrigger>
        <CollapsibleContent className={className}>
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  } catch (error) {
    console.error('SafeCollapsible error:', error);
    setHasError(true);
    return (
      <div className={className}>
        {trigger}
        {open && <div className="ml-6 mt-0.5">{children}</div>}
      </div>
    );
  }
};

// Export the individual components for convenience
export {
  CollapsibleContent,
  CollapsibleTrigger,
};