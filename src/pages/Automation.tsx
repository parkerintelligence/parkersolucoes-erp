
import React, { Suspense } from 'react';
import { ReactSafeWrapper } from '@/components/ReactSafeWrapper';

const SafeScheduledReportsPanelLazy = React.lazy(() => 
  import('@/components/SafeScheduledReportsPanel').then(module => ({
    default: module.SafeScheduledReportsPanel
  }))
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Carregando Automação...</p>
    </div>
  </div>
);

const Automation = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SafeScheduledReportsPanelLazy />
    </Suspense>
  );
};

export default Automation;
