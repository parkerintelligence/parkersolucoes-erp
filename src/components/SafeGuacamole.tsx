import React from 'react';
import { ReactSafeWrapper } from './ReactSafeWrapper';
import { QuerySafeWrapper } from './QuerySafeWrapper';
import Guacamole from '@/pages/Guacamole';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <Card className="bg-card border-border">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-muted-foreground">Carregando Guacamole...</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const SafeGuacamole = () => {
  return (
    <ReactSafeWrapper fallback={<LoadingFallback />}>
      <QuerySafeWrapper fallback={<LoadingFallback />}>
        <Guacamole />
      </QuerySafeWrapper>
    </ReactSafeWrapper>
  );
};
