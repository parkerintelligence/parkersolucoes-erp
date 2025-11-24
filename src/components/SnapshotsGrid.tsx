import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHostingerIntegrations, useHostingerVPS, useHostingerActions } from '@/hooks/useHostingerAPI';
import { useSnapshotSchedules, useUpdateSnapshotSchedule, useDeleteSnapshotSchedule } from '@/hooks/useHostingerSnapshots';
import { HostingerSnapshotScheduleDialog } from '@/components/HostingerSnapshotScheduleDialog';
import { Camera, Calendar, HardDrive, Search, Filter, RefreshCw, AlertCircle, Clock, Plus, Power, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
const SnapshotsGrid = () => {
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedVpsId, setSelectedVpsId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'size'>('created_at');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  const { data: integrations, isLoading: integrationsLoading } = useHostingerIntegrations();
  const { data: vpsList } = useHostingerVPS(selectedIntegration);
  // API Hostinger não suporta listagem de snapshots - removido para evitar erros 404
  const snapshots = [];
  const snapshotsLoading = false;
  const { data: schedules } = useSnapshotSchedules(selectedIntegration);
  const { createSnapshot } = useHostingerActions();
  const updateSchedule = useUpdateSnapshotSchedule();
  const deleteSchedule = useDeleteSnapshotSchedule();

  // Limpar TODOS os caches relacionados a Hostinger ao montar
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['hostinger-snapshots'] });
    queryClient.removeQueries({ queryKey: ['hostinger'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-schedules'] });
  }, [queryClient]);

  // Auto-select first integration and VPS
  useEffect(() => {
    if (integrations && integrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(integrations[0].id);
    }
  }, [integrations, selectedIntegration]);

  useEffect(() => {
    if (vpsList && vpsList.length > 0 && !selectedVpsId) {
      setSelectedVpsId(vpsList[0].id);
    }
  }, [vpsList, selectedVpsId]);

  const handleRefresh = () => {
    // Snapshots não podem ser listados via API - apenas agendamentos
    window.location.reload();
  };

  const handleCreateSnapshot = () => {
    if (!selectedVpsId) return;
    
    const vps = vpsList?.find((v: any) => v.id === selectedVpsId);
    if (!vps) return;

    createSnapshot.mutate({
      integrationId: selectedIntegration,
      vpsId: selectedVpsId,
      name: `snapshot-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`,
    }, {
      onSuccess: () => {
        toast({
          title: "Snapshot criado com sucesso!",
          description: `O snapshot do VPS ${vps.name || vps.hostname} foi criado.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao criar snapshot",
          description: error?.message || "Não foi possível criar o snapshot. Tente novamente.",
          variant: "destructive",
        });
      },
    });
  };

  const handleToggleSchedule = (scheduleId: string, isActive: boolean) => {
    updateSchedule.mutate({
      id: scheduleId,
      updates: { is_active: !isActive },
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteSchedule.mutate(scheduleId);
    }
  };

  // API Hostinger não retorna snapshots - lista sempre vazia
  const filteredSnapshots: any[] = [];

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

  const selectedVps = vpsList?.find((v: any) => v.id === selectedVpsId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciamento de Snapshots</h2>
          <p className="text-slate-400">
            Crie snapshots manualmente ou configure agendamentos automáticos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Integration and VPS Selector */}
      <div className="flex gap-4">
        {integrations && integrations.length > 1 && (
          <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Integração" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {integrations.map((integration: any) => (
                <SelectItem key={integration.id} value={integration.id} className="text-white">
                  {integration.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {vpsList && vpsList.length > 0 && (
          <Select value={selectedVpsId} onValueChange={setSelectedVpsId}>
            <SelectTrigger className="w-[250px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Selecione um VPS" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {vpsList.map((vps: any) => (
                <SelectItem key={vps.id} value={vps.id} className="text-white">
                  {vps.name || vps.hostname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="manual" className="data-[state=active]:bg-slate-700">
            <Camera className="h-4 w-4 mr-2" />
            Snapshots Manuais
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-slate-700">
            <Clock className="h-4 w-4 mr-2" />
            Agendamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Criar Snapshot Manual</span>
                <Button
                  onClick={handleCreateSnapshot}
                  disabled={!selectedVpsId || createSnapshot.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Criar Snapshot Agora
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Crie um snapshot imediato do VPS selecionado
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Info sobre limitações da API */}
          <Card className="bg-blue-900/20 border-blue-600/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-slate-300">
                  <p className="font-medium text-blue-400">Importante sobre Snapshots Manuais</p>
                  <p>
                    A API do Hostinger não permite listar snapshots existentes. Os snapshots criados aqui
                    ou via agendamento ficam disponíveis apenas no painel web do Hostinger.
                  </p>
                  <p>
                    <strong>Recomendação:</strong> Use a aba "Agendamentos" para criar snapshots automáticos programados.
                    Para gerenciar snapshots existentes, acesse o painel Hostinger.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://hpanel.hostinger.com.br/hosting/vps-list', '_blank')}
                    className="mt-2 border-blue-600/30 text-blue-400 hover:bg-blue-900/30"
                  >
                    <HardDrive className="h-4 w-4 mr-2" />
                    Abrir Painel Hostinger
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Agendamentos Ativos</span>
                <Button
                  onClick={() => setShowScheduleDialog(true)}
                  disabled={!selectedVpsId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure snapshots automáticos programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!schedules || schedules.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum agendamento configurado</p>
                  <p className="text-sm mt-1">Clique em "Novo Agendamento" para criar o primeiro</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules
                    .filter((s) => !selectedVpsId || s.vps_id === selectedVpsId)
                    .map((schedule) => (
                      <Card key={schedule.id} className="bg-slate-900 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{schedule.name}</h4>
                                <Badge
                                  variant={schedule.is_active ? "default" : "secondary"}
                                  className={schedule.is_active ? "bg-green-600" : "bg-slate-700"}
                                >
                                  {schedule.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400">{schedule.vps_name}</p>
                              {schedule.description && (
                                <p className="text-sm text-slate-500">{schedule.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {schedule.cron_expression}
                                </span>
                                {schedule.next_execution && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Próximo: {format(new Date(schedule.next_execution), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </span>
                                )}
                                <span>Retenção: {schedule.retention_days} dias</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleSchedule(schedule.id, schedule.is_active)}
                                className="text-slate-400 hover:text-white"
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedVps && (
        <HostingerSnapshotScheduleDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          integrationId={selectedIntegration}
          vpsId={selectedVpsId}
          vpsName={selectedVps.name || selectedVps.hostname}
        />
      )}
    </div>
  );
};

export { SnapshotsGrid };