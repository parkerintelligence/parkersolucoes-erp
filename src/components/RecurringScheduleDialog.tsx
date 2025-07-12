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
import { scheduleColorPalette } from '@/utils/colorUtils';
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
    is_active: true,
    color: '#3b82f6'
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
        is_active: editingSchedule.is_active,
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

  const colorOptions = scheduleColorPalette.map((color, index) => ({
    value: color,
    label: `Cor ${index + 1}`
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">{editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento Recorrente'}</DialogTitle>
          <DialogDescription className="text-gray-300">
            Configure um agendamento que se repete automaticamente nos dias selecionados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {/* Linha 1 - Nome e Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="name" className="text-sm font-medium text-white">Nome do Agendamento *</Label>
              <Input
                id="name"
                placeholder="Ex: Backup diário"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-8 bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="client" className="text-sm font-medium text-white">Cliente</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
                <SelectTrigger className="h-8 bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id} className="text-white hover:bg-gray-700">{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2 - Sistema/Serviço e Local */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="system" className="text-sm font-medium text-white">Sistema/Serviço *</Label>
              <Select value={formData.system_name} onValueChange={(value) => setFormData(prev => ({ ...prev, system_name: value }))}>
                <SelectTrigger className="h-8 bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um sistema/serviço" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.name} className="text-white hover:bg-gray-700">
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
                <p className="text-xs text-gray-400">
                  Nenhum sistema/serviço cadastrado.
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="location" className="text-sm font-medium text-white">Local</Label>
              <Input
                id="location"
                placeholder="Ex: Servidor principal"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="h-8 bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Linha 3 - Horário e Cor */}
          <div className="grid grid-cols-5 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="hour" className="text-sm font-medium text-white">Hora</Label>
              <Select value={formData.time_hour.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, time_hour: parseInt(value) }))}>
                <SelectTrigger className="h-8 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-white hover:bg-gray-700">
                      {i.toString().padStart(2, '0')}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="minute" className="text-sm font-medium text-white">Minutos</Label>
              <Select value={formData.time_minute.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, time_minute: parseInt(value) }))}>
                <SelectTrigger className="h-8 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {[0, 15, 30, 45].map(minute => (
                    <SelectItem key={minute} value={minute.toString()} className="text-white hover:bg-gray-700">
                      {minute.toString().padStart(2, '0')}min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="color" className="text-sm font-medium text-white">Cor</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                <SelectTrigger className="h-8 bg-gray-800 border-gray-600 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.color }}></div>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                />
                <Label htmlFor="is_active" className="text-sm text-white">Ativo</Label>
              </div>
            </div>
          </div>

          {/* Linha 4 - Dias da Semana */}
          <div className="grid gap-1">
            <Label className="text-sm font-medium text-white">Dias da Semana *</Label>
            <div className="grid grid-cols-4 gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-1">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={formData.days_of_week.includes(day.value)}
                    onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-xs text-white">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Linha 5 - Descrição */}
          <div className="grid gap-1">
            <Label htmlFor="description" className="text-sm font-medium text-white">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes adicionais"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="text-sm bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Preview */}
          {formData.days_of_week.length > 0 && (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
              <p className="text-sm font-medium mb-1 text-white">Preview:</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color }}></div>
                <p className="text-sm text-gray-300">
                  {formData.system_name || 'Sistema'} às {formatTime(formData.time_hour, formData.time_minute)} - {' '}
                  {formData.days_of_week.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={createSchedule.isPending || updateSchedule.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {editingSchedule ? 'Atualizar' : 'Criar'} Agendamento
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};