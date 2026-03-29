import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateRecurringSchedule, useUpdateRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
import { useScheduleServices } from '@/hooks/useScheduleServices';
import { toast } from '@/hooks/use-toast';
import { scheduleColorPalette } from '@/utils/colorUtils';
import { Clock, CalendarDays, MapPin, Building2, Palette, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;

interface RecurringScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSchedule?: RecurringSchedule | null;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Seg', full: 'Segunda' },
  { value: 2, label: 'Ter', full: 'Terça' },
  { value: 3, label: 'Qua', full: 'Quarta' },
  { value: 4, label: 'Qui', full: 'Quinta' },
  { value: 5, label: 'Sex', full: 'Sexta' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
  { value: 0, label: 'Dom', full: 'Domingo' },
];

export const RecurringScheduleDialog = ({ isOpen, onOpenChange, editingSchedule }: RecurringScheduleDialogProps) => {
  const { data: companies = [] } = useCompanies();
  const { data: services = [] } = useScheduleServices();
  const createSchedule = useCreateRecurringSchedule();
  const updateSchedule = useUpdateRecurringSchedule();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    system_name: '',
    location: '',
    time_hour: 9,
    time_minute: 0,
    days_of_week: [] as number[],
    is_active: true,
    color: '#3b82f6'
  });

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        name: editingSchedule.name,
        description: editingSchedule.description || '',
        client_id: editingSchedule.client_id || '',
        system_name: editingSchedule.system_name,
        location: editingSchedule.location || '',
        time_hour: editingSchedule.time_hour,
        time_minute: editingSchedule.time_minute,
        days_of_week: editingSchedule.days_of_week || [],
        is_active: editingSchedule.is_active ?? true,
        color: editingSchedule.color || '#3b82f6'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        client_id: '',
        system_name: '',
        location: '',
        time_hour: 9,
        time_minute: 0,
        days_of_week: [],
        is_active: true,
        color: '#3b82f6'
      });
    }
  }, [editingSchedule, isOpen]);

  const handleSave = () => {
    if (!formData.name || !formData.system_name || formData.days_of_week.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, sistema/serviço e selecione pelo menos um dia.",
        variant: "destructive"
      });
      return;
    }

    if (editingSchedule) {
      updateSchedule.mutate({ id: editingSchedule.id, updates: formData });
    } else {
      createSchedule.mutate(formData);
    }
    onOpenChange(false);
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const formatTime = (hour: number, minute: number) =>
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const selectedDaysText = formData.days_of_week
    .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.full)
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento Recorrente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure um agendamento que se repete nos dias selecionados.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Nome do agendamento *</Label>
            <Input
              placeholder="Ex: Backup diário servidor"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-8 text-xs bg-muted/50 border-border"
            />
          </div>

          {/* Cliente + Sistema */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                Cliente
              </Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
                <SelectTrigger className="h-8 text-xs bg-muted/50 border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Sistema/Serviço *</Label>
              <Select value={formData.system_name} onValueChange={(value) => setFormData(prev => ({ ...prev, system_name: value }))}>
                <SelectTrigger className="h-8 text-xs bg-muted/50 border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.name} className="text-xs">
                      {s.category ? `${s.category} — ${s.name}` : s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {services.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Nenhum serviço cadastrado.</p>
              )}
            </div>
          </div>

          {/* Local */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              Local
            </Label>
            <Input
              placeholder="Ex: Sede, Filial, Remoto"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="h-8 text-xs bg-muted/50 border-border"
            />
          </div>

          {/* Dias da semana */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Dias da semana *</Label>
            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.days_of_week.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    title={day.full}
                    className={cn(
                      "flex-1 h-9 rounded-md text-xs font-medium transition-all border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horário + Cor + Ativo */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Hora
              </Label>
              <Select value={formData.time_hour.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, time_hour: parseInt(v) }))}>
                <SelectTrigger className="h-8 text-xs bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-xs">
                      {i.toString().padStart(2, '0')}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Min</Label>
              <Select value={formData.time_minute.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, time_minute: parseInt(v) }))}>
                <SelectTrigger className="h-8 text-xs bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 5, 10, 15, 20, 30, 45].map(m => (
                    <SelectItem key={m} value={m.toString()} className="text-xs">
                      {m.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                <Palette className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Select value={formData.color} onValueChange={(v) => setFormData(prev => ({ ...prev, color: v }))}>
                <SelectTrigger className="h-8 w-14 bg-muted/50 border-border px-2">
                  <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: formData.color }} />
                </SelectTrigger>
                <SelectContent>
                  <div className="grid grid-cols-5 gap-1 p-1">
                    {scheduleColorPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                          formData.color === color ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Ativo toggle */}
            <div className="flex flex-col items-center gap-1 pb-0.5">
              <Label className="text-[10px] text-muted-foreground">Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                className="scale-90"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Descrição</Label>
            <Textarea
              placeholder="Observações adicionais..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="text-xs bg-muted/50 border-border resize-none"
            />
          </div>

          {/* Preview */}
          {formData.days_of_week.length > 0 && (formData.name || formData.system_name) && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Prévia</p>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: formData.color }} />
                <p className="text-xs text-foreground font-medium">
                  {formData.name || formData.system_name}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground pl-[18px]">
                {formData.system_name && <span>{formData.system_name} · </span>}
                {formatTime(formData.time_hour, formData.time_minute)} · {selectedDaysText}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createSchedule.isPending || updateSchedule.isPending}
            className="h-8 text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {editingSchedule ? 'Atualizar' : 'Criar Agendamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
