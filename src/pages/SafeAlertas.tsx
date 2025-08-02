import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Alertas from './Alertas';

export default function SafeAlertas() {
  // Check if query client is available before rendering Alertas
  try {
    useQueryClient();
    return <Alertas />;
  } catch (error) {
    console.log('SafeAlertas: QueryClient not available yet, showing loading...');
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
            <p className="text-muted-foreground">Carregando sistema...</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border-slate-700 p-4 rounded-lg">
            <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="bg-slate-800 border-slate-700 p-4 rounded-lg">
            <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="bg-slate-800 border-slate-700 p-4 rounded-lg">
            <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
}