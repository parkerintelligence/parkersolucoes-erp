import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HostingerDashboard } from '@/components/HostingerDashboard';
import { Server } from 'lucide-react';

const VPS = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Hostinger VPS</h1>
            <p className="text-slate-400 mt-2">Monitoramento e gestão dos servidores virtuais privados</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-600 bg-green-900/20">
            Sistema Online
          </Badge>
        </div>

        {/* Main Content */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Server className="h-5 w-5 text-blue-400" />
              Infraestrutura Principal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Monitoramento em tempo real dos servidores virtuais privados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HostingerDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VPS;