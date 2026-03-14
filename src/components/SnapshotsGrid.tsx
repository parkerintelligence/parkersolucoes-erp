import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHostingerIntegrations, useHostingerVPS, useHostingerActions } from '@/hooks/useHostingerAPI';
import { useSnapshotSchedules, useUpdateSnapshotSchedule, useDeleteSnapshotSchedule } from '@/hooks/useHostingerSnapshots';
import { HostingerSnapshotScheduleDialog } from '@/components/HostingerSnapshotScheduleDialog';
import { Camera, Calendar, Clock, Plus, Power, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TABS = [
  { id: 'manual', label: 'Snapshots Manuais', icon: Camera },
  { id: 'scheduled', label: 'Agendamentos', icon: Clock },
] as const;

type TabId = typeof TABS[number]['id'];

const SnapshotsGrid = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('manual');
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedVpsId, setSelectedVpsId] = useState<string>('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const { data: integrations, isLoading: integrationsLoading } = useHostingerIntegrations();
  const { data: vpsList } = useHostingerVPS(selectedIntegration);
  const { data: schedules, isLoading: schedulesLoading } = useSnapshotSchedules(selectedIntegration);
  const { createSnapshot } = useHostingerActions();
  const updateSchedule = useUpdateSnapshotSchedule();
  const deleteSchedule = useDeleteSnapshotSchedule();

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['hostinger-snapshots'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-schedules'] });
  }, [queryClient]);

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

  const handleCreateSnapshot = () => {
    if (!selectedVpsId) return;
    const vps = vpsList?.find((v: any) => v.id === selectedVpsId);
    if (!vps) return;
    createSnapshot.mutate({
      integrationId: selectedIntegration,
      vpsId: selectedVpsId,
      name: `snapshot-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
    }, {
      onSuccess: () => { toast({ title: "Snapshot criado!", description: `Snapshot do VPS ${vps.name || vps.hostname} criado.` }); },
      onError: (error: any) => { toast({ title: "Erro ao criar snapshot", description: error?.message || "Tente novamente.", variant: "destructive" }); }
    });
  };

  const handleToggleSchedule = (scheduleId: string, isActive: boolean) => {
    updateSchedule.mutate({ id: scheduleId, updates: { is_active: !isActive } });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Excluir este agendamento?')) deleteSchedule.mutate(scheduleId);
  };

  if (integrationsLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Nenhuma Integração</h3>
        <p className="text-xs text-muted-foreground">Configure uma integração Hostinger.</p>
      </div>
    );
  }

  const filteredSchedules = schedules?.filter((s: any) => !selectedVpsId || s.vps_id === selectedVpsId) || [];
  const selectedVps = vpsList?.find((v: any) => v.id === selectedVpsId);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Selectors */}
        <div className="flex items-center gap-2">
          {integrations && integrations.length > 1 && (
            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
              <SelectTrigger className="h-7 text-xs w-[160px]">
                <SelectValue placeholder="Integração" />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((i: any) => (
                  <SelectItem key={i.id} value={i.id} className="text-xs">{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {vpsList && vpsList.length > 0 && (
            <Select value={selectedVpsId} onValueChange={setSelectedVpsId}>
              <SelectTrigger className="h-7 text-xs w-[180px]">
                <SelectValue placeholder="VPS" />
              </SelectTrigger>
              <SelectContent>
                {vpsList.map((v: any) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">{v.name || v.hostname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/30">
            <Calendar className="h-2.5 w-2.5 mr-1" />
            {filteredSchedules.length} agendamentos
          </Badge>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-0.5 p-1 bg-muted/50 border border-border rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Manual Tab */}
      {activeTab === 'manual' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-foreground">Criar Snapshot Manual</h3>
              <p className="text-[10px] text-muted-foreground">Crie um snapshot imediato do VPS selecionado</p>
            </div>
            <Button onClick={handleCreateSnapshot} disabled={!selectedVpsId || createSnapshot.isPending} size="sm" className="h-7 text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Criar Snapshot
            </Button>
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-xs font-semibold text-foreground">Agendamentos</h3>
            <Button onClick={() => setShowScheduleDialog(true)} disabled={!selectedVpsId} size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Novo
            </Button>
          </div>

          {schedulesLoading ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Nenhum agendamento configurado</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Clique em "Novo" para criar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-[10px] h-8">Nome</TableHead>
                  <TableHead className="text-[10px] h-8">VPS</TableHead>
                  <TableHead className="text-[10px] h-8">Cron</TableHead>
                  <TableHead className="text-[10px] h-8">Próximo</TableHead>
                  <TableHead className="text-[10px] h-8">Retenção</TableHead>
                  <TableHead className="text-[10px] h-8">Status</TableHead>
                  <TableHead className="text-[10px] h-8 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule: any) => (
                  <TableRow key={schedule.id} className="border-border hover:bg-muted/30">
                    <TableCell className="text-xs py-1.5 font-medium">{schedule.name}</TableCell>
                    <TableCell className="text-xs py-1.5 text-muted-foreground">{schedule.vps_name}</TableCell>
                    <TableCell className="text-[10px] py-1.5 font-mono text-muted-foreground">{schedule.cron_expression}</TableCell>
                    <TableCell className="text-[10px] py-1.5 text-muted-foreground">
                      {schedule.next_execution ? format(new Date(schedule.next_execution), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="text-[10px] py-1.5 text-muted-foreground">{schedule.retention_days}d</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${schedule.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        {schedule.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button size="sm" variant="ghost" onClick={() => handleToggleSchedule(schedule.id, schedule.is_active)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                          <Power className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteSchedule(schedule.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

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
