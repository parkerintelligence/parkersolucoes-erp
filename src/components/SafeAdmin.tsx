import React from 'react';
import { ReactSafeWrapper } from './ReactSafeWrapper';
import { QuerySafeWrapper } from './QuerySafeWrapper';
import Admin from '@/pages/Admin';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-gray-300">Carregando Administração...</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const SafeAdmin = () => {
  return (
    <ReactSafeWrapper fallback={<LoadingFallback />}>
      <QuerySafeWrapper fallback={<LoadingFallback />}>
        <Admin />
      </QuerySafeWrapper>
    </ReactSafeWrapper>
  );
};
