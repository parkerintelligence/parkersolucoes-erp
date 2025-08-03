import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Award, Key, RefreshCw, Calendar, FileText, Settings, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreateScheduleTypeData } from '@/hooks/useScheduleTypes';

interface ScheduleTypeFormProps {
  onSubmit: (data: CreateScheduleTypeData) => void;
  onCancel: () => void;
}

const iconOptions = [
  { value: 'calendar', label: 'Calendário', icon: Calendar },
  { value: 'award', label: 'Certificado', icon: Award },
  { value: 'key', label: 'Licença', icon: Key },
  { value: 'refresh-cw', label: 'Atualização', icon: RefreshCw },
  { value: 'file-text', label: 'Documento', icon: FileText },
  { value: 'settings', label: 'Configuração', icon: Settings },
  { value: 'activity', label: 'Atividade', icon: Activity },
];

const colorOptions = [
  { value: '#10b981', label: 'Verde', color: '#10b981' },
  { value: '#3b82f6', label: 'Azul', color: '#3b82f6' },
  { value: '#f59e0b', label: 'Amarelo', color: '#f59e0b' },
  { value: '#ef4444', label: 'Vermelho', color: '#ef4444' },
  { value: '#8b5cf6', label: 'Roxo', color: '#8b5cf6' },
  { value: '#06b6d4', label: 'Ciano', color: '#06b6d4' },
  { value: '#f97316', label: 'Laranja', color: '#f97316' },
  { value: '#84cc16', label: 'Lima', color: '#84cc16' },
];

export const ScheduleTypeForm = ({ onSubmit, onCancel }: ScheduleTypeFormProps) => {
  const [formData, setFormData] = React.useState<CreateScheduleTypeData>({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'calendar',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro no formulário",
        description: "O nome do tipo é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'calendar',
      is_active: true,
    });
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Calendar;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Tipo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Renovação SSL"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição opcional do tipo..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon">Ícone</Label>
          <Select 
            value={formData.icon} 
            onValueChange={(value) => setFormData({ ...formData, icon: value })}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = getIconComponent(formData.icon);
                    return <IconComponent className="h-4 w-4" />;
                  })()}
                  {iconOptions.find(opt => opt.value === formData.icon)?.label}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Cor</Label>
          <Select 
            value={formData.color} 
            onValueChange={(value) => setFormData({ ...formData, color: value })}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border" 
                    style={{ backgroundColor: formData.color }}
                  />
                  {colorOptions.find(opt => opt.value === formData.color)?.label}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: option.color }}
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          <Plus className="mr-2 h-4 w-4" />
          Criar Tipo
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  );
};