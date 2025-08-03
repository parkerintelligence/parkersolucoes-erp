import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHostingerIntegrations, useHostingerSnapshots, useHostingerVPS } from '@/hooks/useHostingerAPI';
import { Camera, Calendar, HardDrive, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SnapshotsGrid = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'size'>('created_at');
  
  const { 
    data: integrations, 
    isLoading: integrationsLoading 
  } = useHostingerIntegrations();
  
  const { 
    data: vpsList 
  } = useHostingerVPS(selectedIntegration);
  
  const { 
    data: snapshots, 
    isLoading: snapshotsLoading,
    refetch: refetchSnapshots 
  } = useHostingerSnapshots(selectedIntegration);

  // Auto-select first integration
  React.useEffect(() => {
    if (integrations && integrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(integrations[0].id);
    }
  }, [integrations, selectedIntegration]);

  const handleRefresh = () => {
    refetchSnapshots();
  };

  const filteredSnapshots = React.useMemo(() => {
    if (!snapshots) return [];
    
    let filtered = snapshots.filter((snapshot: any) =>
      snapshot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snapshot.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort snapshots
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'created_at':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return filtered;
  }, [snapshots, searchTerm, sortBy]);

  const getVPSName = (vpsId: string) => {
    const vps = vpsList?.find((v: any) => v.id === vpsId);
    return vps?.name || vps?.hostname || vpsId;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'available':
        return 'bg-green-900/20 text-green-400 border-green-600';
      case 'creating':
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-600';
      case 'error':
      case 'failed':
        return 'bg-red-900/20 text-red-400 border-red-600';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  if (integrationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Carregando integrações...</span>
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma Integração Hostinger</h3>
          <p className="text-slate-400">
            Configure uma integração Hostinger para visualizar snapshots.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Snapshots</h2>
          <p className="text-slate-400">
            Snapshots devem ser gerenciados diretamente no painel do Hostinger
          </p>
        </div>
        <Button 
          onClick={() => window.open('https://hpanel.hostinger.com.br/hosting/vps-list', '_blank')} 
          variant="outline" 
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Abrir Painel Hostinger
        </Button>
      </div>

      {/* Integration Selector */}
      {integrations.length > 1 && (
        <div className="flex gap-2">
          {integrations.map((integration: any) => (
            <Button
              key={integration.id}
              variant={selectedIntegration === integration.id ? "default" : "outline"}
              onClick={() => setSelectedIntegration(integration.id)}
              size="sm"
            >
              {integration.name}
            </Button>
          ))}
        </div>
      )}


      {/* Limitation Notice */}
      <Card className="bg-yellow-900/20 border-yellow-600">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-400">Funcionalidade Limitada</h3>
          </div>
          <div className="space-y-3 text-slate-300">
            <p>
              A API do Hostinger não suporta criação ou listagem de snapshots via API. 
              Para gerenciar snapshots dos seus VPS, utilize o painel web oficial do Hostinger.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => window.open('https://hpanel.hostinger.com.br/hosting/vps-list', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <HardDrive className="h-4 w-4" />
                Painel VPS Hostinger
              </Button>
              <Button 
                onClick={() => window.open('https://support.hostinger.com/en/articles/6567227-how-to-create-and-restore-vps-snapshots', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Como Criar Snapshots
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SnapshotsGrid };