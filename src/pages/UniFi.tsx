import React from 'react';
import { Wifi } from 'lucide-react';
import UniFiMonitoringDashboard from '@/components/UniFiMonitoringDashboard';

const UniFi = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wifi className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">UniFi Network Manager</h1>
          <p className="text-muted-foreground">Gerenciamento e monitoramento da rede UniFi via Site Manager API</p>
        </div>
      </div>

      <UniFiMonitoringDashboard />
    </div>
  );
};

export default UniFi;