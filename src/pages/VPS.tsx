import React from 'react';
import { HostingerDashboard } from '@/components/HostingerDashboard';

const VPS = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Hostinger VPS
        </h1>
        <p className="text-muted-foreground">
          Monitoramento e gestão dos servidores virtuais privados
        </p>
      </div>
      
      <HostingerDashboard />
    </div>
  );
};

export default VPS;