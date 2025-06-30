
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScheduleItem } from '@/hooks/useScheduleItems';

interface ScheduleFormProps {
  onSubmit: (item: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>) => void;
}

export const ScheduleForm = ({ onSubmit }: ScheduleFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '' as 'certificate' | 'license' | 'system_update' | '',
    due_date: '',
    description: '',
    company: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.due_date || !formData.company) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData as Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>);
    
    setFormData({
      title: '',
      type: '',
      due_date: '',
      description: '',
      company: ''
    });
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
        <Label htmlFor="due_date">Data de Vencimento *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
