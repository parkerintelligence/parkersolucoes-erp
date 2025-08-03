import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SafeTabsWrapperProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
}

interface SafeTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface SafeTabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface SafeTabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

// Safe wrapper that ensures React context is available
export const SafeTabs: React.FC<SafeTabsWrapperProps> = ({ children, defaultValue, className }) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Ensure React context is properly set up
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-10 bg-slate-700 rounded-lg mb-4"></div>
          <div className="h-32 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue={defaultValue} className={className}>
      {children}
    </Tabs>
  );
};

export const SafeTabsList: React.FC<SafeTabsListProps> = ({ children, className }) => {
  return <TabsList className={className}>{children}</TabsList>;
};

export const SafeTabsTrigger: React.FC<SafeTabsTriggerProps> = ({ children, value, className }) => {
  return <TabsTrigger value={value} className={className}>{children}</TabsTrigger>;
};

export const SafeTabsContent: React.FC<SafeTabsContentProps> = ({ children, value, className }) => {
  return <TabsContent value={value} className={className}>{children}</TabsContent>;
};