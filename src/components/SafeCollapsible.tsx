import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Small delay to ensure React context is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
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