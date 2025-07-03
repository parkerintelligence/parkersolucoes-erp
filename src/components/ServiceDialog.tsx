import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Shield, Mail, Server, Database, Cloud, Code, Monitor, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (service: ServiceData) => void;
}

interface ServiceData {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const availableIcons = [
  { name: 'Sistema', icon: Code, value: 'code' },
  { name: 'Email', icon: Mail, value: 'mail' },
  { name: 'Hosting', icon: Server, value: 'server' },
  { name: 'Database', icon: Database, value: 'database' },
  { name: 'Cloud', icon: Cloud, value: 'cloud' },
  { name: 'Security', icon: Shield, value: 'shield' },
  { name: 'Monitoring', icon: Monitor, value: 'monitor' },
  { name: 'Config', icon: Settings, value: 'settings' },
  { name: 'Web', icon: Globe, value: 'globe' },
];

const availableColors = [
  { name: 'Azul', value: 'blue' },
  { name: 'Verde', value: 'green' },
  { name: 'Roxo', value: 'purple' },
  { name: 'Laranja', value: 'orange' },
  { name: 'Vermelho', value: 'red' },
  { name: 'Amarelo', value: 'yellow' },
  { name: 'Cinza', value: 'gray' },
  { name: 'Rosa', value: 'pink' },
];

export const ServiceDialog = ({ isOpen, onOpenChange, onSave }: ServiceDialogProps) => {
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    description: '',
    icon: 'code',
    color: 'blue'
  });

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do serviço.",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    setFormData({ name: '', description: '', icon: 'code', color: 'blue' });
    onOpenChange(false);
  };

  const selectedIcon = availableIcons.find(icon => icon.value === formData.icon);
  const IconComponent = selectedIcon?.icon || Code;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Serviço</DialogTitle>
          <DialogDescription>
            Configure um novo tipo de serviço para organizar suas senhas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="service-name">Nome do Serviço *</Label>
            <Input
              id="service-name"
              placeholder="Ex: Sistema ERP"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="service-description">Descrição</Label>
            <Textarea
              id="service-description"
              placeholder="Descrição opcional do serviço"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-icon">Ícone</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({...formData, icon: value})}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {selectedIcon?.name}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {icon.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-color">Cor</Label>
            <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma cor" />
              </SelectTrigger>
              <SelectContent>
                {availableColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full bg-${color.value}-500`}></div>
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            Salvar Serviço
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};