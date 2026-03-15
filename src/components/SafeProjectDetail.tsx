import React from 'react';
import { ReactSafeWrapper } from './ReactSafeWrapper';
import { QuerySafeWrapper } from './QuerySafeWrapper';
import ProjectDetail from '@/pages/ProjectDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando projeto...</p>
    </div>
  </div>
);

export const SafeProjectDetail = () => {
  return (
    <ReactSafeWrapper fallback={<LoadingFallback />}>
      <QuerySafeWrapper fallback={<LoadingFallback />}>
        <ProjectDetail />
      </QuerySafeWrapper>
    </ReactSafeWrapper>
  );
};
