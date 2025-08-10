import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { QuerySafeWrapper } from './QuerySafeWrapper';

const AutomationStatsLazy = React.lazy(() => 
  import('./automation/AutomationStats').then(module => ({
    default: module.AutomationStats
  }))
);

const LoadingFallback = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const LazyAutomationStats = () => {
  return (
    <QuerySafeWrapper fallback={<LoadingFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <AutomationStatsLazy />
      </Suspense>
    </QuerySafeWrapper>
  );
};