import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server } from 'lucide-react';
import { HostingerDashboard } from '@/components/HostingerDashboard';
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Server className="h-10 w-10 text-blue-400" />
              Monitoramento VPS
            </h1>
            <p className="text-slate-400 mt-2">Status e métricas dos servidores Hostinger</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-600 bg-green-900/20">
            Sistema Online
          </Badge>
        </div>

        {/* VPS Dashboard */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Server className="h-5 w-5 text-blue-400" />
              Hostinger VPS
            </CardTitle>
            <CardDescription className="text-slate-400">
              Monitoramento em tempo real dos servidores virtuais privados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryErrorBoundary>
              <Suspense fallback={<Skeleton className="h-64 w-full bg-slate-700" />}>
                <HostingerDashboard />
              </Suspense>
            </QueryErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;