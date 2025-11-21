import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSnapshotSchedule, useUpdateSnapshotSchedule, HostingerSnapshotSchedule } from '@/hooks/useHostingerSnapshots';
import { Clock, Info } from 'lucide-react';

interface SnapshotScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  vpsId: string;
  vpsName: string;
  schedule?: HostingerSnapshotSchedule;
}

const CRON_PRESETS = [
  { label: 'Diariamente às 2:00 AM', value: '0 2 * * *' },
  { label: 'Semanalmente (Domingo às 3:00 AM)', value: '0 3 * * 0' },
  { label: 'Mensalmente (Dia 1 às 3:00 AM)', value: '0 3 1 * *' },
  { label: 'A cada 12 horas', value: '0 */12 * * *' },
  { label: 'A cada 6 horas', value: '0 */6 * * *' },
  { label: 'Personalizado', value: 'custom' },
];

export const HostingerSnapshotScheduleDialog = ({
  open,
  onOpenChange,
  integrationId,
  vpsId,
  vpsName,
  schedule,
}: SnapshotScheduleDialogProps) => {
  const [name, setName] = useState(schedule?.name || '');
  const [description, setDescription] = useState(schedule?.description || '');
  const [cronPreset, setCronPreset] = useState(schedule?.cron_expression || CRON_PRESETS[0].value);
  const [customCron, setCustomCron] = useState('');
  const [retentionDays, setRetentionDays] = useState(schedule?.retention_days?.toString() || '7');

  const createMutation = useCreateSnapshotSchedule();
  const updateMutation = useUpdateSnapshotSchedule();

  const handleSubmit = () => {
    const cronExpression = cronPreset === 'custom' ? customCron : cronPreset;

    if (!name || !cronExpression) {
      return;
    }

    const scheduleData = {
      integration_id: integrationId,
      vps_id: vpsId,
      vps_name: vpsName,
      name,
      description: description || undefined,
      cron_expression: cronExpression,
      retention_days: parseInt(retentionDays) || 7,
      is_active: true,
    };

    if (schedule) {
      updateMutation.mutate({
        id: schedule.id,
        updates: scheduleData,
      });
    } else {
      createMutation.mutate(scheduleData);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCronPreset(CRON_PRESETS[0].value);
    setCustomCron('');
    setRetentionDays('7');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            {schedule ? 'Editar Agendamento' : 'Agendar Snapshot'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure o agendamento automático de snapshots para {vpsName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Nome do Agendamento</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Backup Diário"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste agendamento"
              className="bg-slate-900 border-slate-700 text-white resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cron-preset" className="text-slate-300">Frequência</Label>
            <Select value={cronPreset} onValueChange={setCronPreset}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {CRON_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value} className="text-white">
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cronPreset === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-cron" className="text-slate-300">Expressão Cron Personalizada</Label>
              <Input
                id="custom-cron"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 2 * * *"
                className="bg-slate-900 border-slate-700 text-white font-mono"
              />
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Formato: minuto hora dia mês dia-semana (ex: 0 2 * * * = todo dia às 2:00)</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="retention" className="text-slate-300">Retenção (dias)</Label>
            <Input
              id="retention"
              type="number"
              min="1"
              max="90"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">Snapshots mais antigos que este período serão removidos automaticamente</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="border-slate-700 text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || (cronPreset === 'custom' && !customCron)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {schedule ? 'Atualizar' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
