import React from 'react';
import { ReactSafeWrapper } from './ReactSafeWrapper';
import { QuerySafeWrapper } from './QuerySafeWrapper';
import { ScheduledReportsPanel } from './ScheduledReportsPanel';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Carregando Automação...</p>
    </div>
  </div>
);

export const SafeScheduledReportsPanel = () => {
  return (
    <ReactSafeWrapper fallback={<LoadingFallback />}>
      <QuerySafeWrapper fallback={<LoadingFallback />}>
        <ScheduledReportsPanel />
      </QuerySafeWrapper>
    </ReactSafeWrapper>
  );
};
