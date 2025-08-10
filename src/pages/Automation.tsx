
import React, { Suspense } from 'react';
import { ReactSafeWrapper } from '@/components/ReactSafeWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const ScheduledReportsPanelLazy = React.lazy(() => 
  import('@/components/ScheduledReportsPanel').then(module => ({
    default: module.ScheduledReportsPanel
  }))
);

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-gray-300">Carregando Automação...</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const Automation = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        <ReactSafeWrapper fallback={<LoadingFallback />}>
          <Suspense fallback={<LoadingFallback />}>
            <ScheduledReportsPanelLazy />
          </Suspense>
        </ReactSafeWrapper>
      </div>
    </div>
  );
};

export default Automation;
