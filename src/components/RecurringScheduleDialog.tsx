import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateRecurringSchedule, useUpdateRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
import { useScheduleServices } from '@/hooks/useScheduleServices';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;

interface RecurringScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSchedule?: RecurringSchedule | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
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
    is_active: true
  });

  React.useEffect(() => {
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
        is_active: editingSchedule.is_active
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
        is_active: true
      });
    }
  }, [editingSchedule]);

  const handleSave = () => {
    if (!formData.name || !formData.system_name || formData.days_of_week.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios e selecione pelo menos um dia da semana.",
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

  const handleDayToggle = (day: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        days_of_week: [...prev.days_of_week, day].sort()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        days_of_week: prev.days_of_week.filter(d => d !== day)
      }));
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento Recorrente'}</DialogTitle>
          <DialogDescription>
            Configure um agendamento que se repete automaticamente nos dias selecionados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Agendamento *</Label>
            <Input
              id="name"
              placeholder="Ex: Backup diário do sistema"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="system">Sistema/Serviço *</Label>
            <Select value={formData.system_name} onValueChange={(value) => setFormData(prev => ({ ...prev, system_name: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um sistema/serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{service.category}</span>
                      <span>-</span>
                      <span>{service.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {services.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum sistema/serviço cadastrado. Use o botão "Gerenciar Sistemas/Serviços" para criar.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              placeholder="Ex: Servidor principal, Sala de TI, etc."
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="hour">Hora</Label>
              <Select value={formData.time_hour.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, time_hour: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minute">Minutos</Label>
              <Select value={formData.time_minute.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, time_minute: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map(minute => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString().padStart(2, '0')}min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Dias da Semana *</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={formData.days_of_week.includes(day.value)}
                    onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes adicionais sobre o agendamento"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
            />
            <Label htmlFor="is_active">Agendamento ativo</Label>
          </div>

          {/* Preview */}
          {formData.days_of_week.length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <p className="text-sm text-muted-foreground">
                {formData.system_name || 'Sistema'} às {formatTime(formData.time_hour, formData.time_minute)} - {' '}
                {formData.days_of_week.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={createSchedule.isPending || updateSchedule.isPending}>
            {editingSchedule ? 'Atualizar' : 'Criar'} Agendamento
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};