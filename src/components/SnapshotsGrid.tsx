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
            Gerencie os snapshots dos seus servidores VPS
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar snapshots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Data de Criação</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="size">Tamanho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Snapshots Grid */}
      {snapshotsLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-400">Carregando snapshots...</span>
        </div>
      ) : !filteredSnapshots || filteredSnapshots.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Camera className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm ? 'Nenhum snapshot encontrado' : 'Nenhum snapshot disponível'}
            </h3>
            <p className="text-slate-400">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Crie snapshots dos seus VPS para visualizá-los aqui.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnapshots.map((snapshot: any) => (
            <Card key={snapshot.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <Camera className="h-5 w-5 text-blue-400" />
                  {snapshot.name || snapshot.id}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  VPS: {getVPSName(snapshot.vps_id)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(snapshot.status)}>
                    {snapshot.status || 'Unknown'}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    {formatSize(snapshot.size)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="h-4 w-4" />
                  {snapshot.created_at ? (
                    format(new Date(snapshot.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                  ) : (
                    'Data não disponível'
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <HardDrive className="h-4 w-4" />
                  ID: {snapshot.id}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    disabled
                  >
                    Ver Detalhes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    disabled
                  >
                    Restaurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      {filteredSnapshots && filteredSnapshots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{filteredSnapshots.length}</div>
                <div className="text-sm text-slate-400">Total de Snapshots</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {filteredSnapshots.filter((s: any) => s.status?.toLowerCase() === 'completed').length}
                </div>
                <div className="text-sm text-slate-400">Disponíveis</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatSize(filteredSnapshots.reduce((total: number, s: any) => total + (s.size || 0), 0))}
                </div>
                <div className="text-sm text-slate-400">Tamanho Total</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { SnapshotsGrid };