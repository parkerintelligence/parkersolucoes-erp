
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ScheduleItem } from '@/pages/Schedule';

interface ScheduleFormProps {
  onSubmit: (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'status'>) => void;
}

export const ScheduleForm = ({ onSubmit }: ScheduleFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '' as 'certificate' | 'license' | 'system_update' | '',
    dueDate: '',
    description: '',
    company: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.dueDate || !formData.company) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData as Omit<ScheduleItem, 'id' | 'createdAt' | 'status'>);
    
    setFormData({
      title: '',
      type: '',
      dueDate: '',
      description: '',
      company: ''
    });

    toast({
      title: "Agendamento criado!",
      description: "O item foi adicionado à agenda com sucesso.",
    });
  };

  const typeLabels = {
    certificate: 'Certificado',
    license: 'Licença',
    system_update: 'Atualização de Sistema'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Renovação Certificado SSL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="certificate">Certificado</SelectItem>
            <SelectItem value="license">Licença</SelectItem>
            <SelectItem value="system_update">Atualização de Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Empresa *</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Nome da empresa"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Data de Vencimento *</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detalhes sobre o agendamento..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Agendamento
      </Button>
    </form>
  );
};
