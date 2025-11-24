import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateSnapshotSchedule, useUpdateSnapshotSchedule, HostingerSnapshotSchedule } from '@/hooks/useHostingerSnapshots';
import { Clock, Info, Calendar } from 'lucide-react';

interface SnapshotScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  vpsId: string;
  vpsName: string;
  schedule?: HostingerSnapshotSchedule;
}

const WEEKDAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
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
  const [hour, setHour] = useState('2');
  const [minute, setMinute] = useState('0');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [retentionDays, setRetentionDays] = useState(schedule?.retention_days?.toString() || '7');

  // Parse existing cron expression when editing
  useEffect(() => {
    if (schedule?.cron_expression) {
      const parts = schedule.cron_expression.split(' ');
      if (parts.length === 5) {
        setMinute(parts[0]);
        setHour(parts[1]);
        if (parts[4] !== '*') {
          const days = parts[4].split(',').map(Number);
          setSelectedDays(days);
        }
      }
    }
  }, [schedule]);

  const createMutation = useCreateSnapshotSchedule();
  const updateMutation = useUpdateSnapshotSchedule();

  const handleSubmit = () => {
    if (!name || selectedDays.length === 0) {
      return;
    }

    // Build cron expression: minute hour day month weekday
    const dayOfWeek = selectedDays.length === 7 ? '*' : selectedDays.sort((a, b) => a - b).join(',');
    const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;

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
    setHour('2');
    setMinute('0');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setRetentionDays('7');
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
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
            <Label className="text-slate-300 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário do Snapshot
            </Label>
            <div className="flex gap-2 items-center">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-24">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-white">
                      {i.toString().padStart(2, '0')}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-slate-400">:</span>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-24">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['00', '15', '30', '45'].map((m) => (
                    <SelectItem key={m} value={m} className="text-white">
                      {m}min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dias da Semana
            </Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day.value}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => toggleDay(day.value)}
                >
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                    className="border-slate-600"
                  />
                  <span className="text-sm text-white">{day.label}</span>
                </div>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-400">Selecione pelo menos um dia da semana</p>
            )}
          </div>

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
            disabled={!name || selectedDays.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {schedule ? 'Atualizar' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
