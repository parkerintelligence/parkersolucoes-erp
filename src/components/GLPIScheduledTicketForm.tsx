import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, AlertTriangle, User, Settings } from 'lucide-react';
import { useCreateGLPIScheduledTicket, useUpdateGLPIScheduledTicket, GLPIScheduledTicket } from '@/hooks/useGLPIScheduledTickets';
import { ScheduleFrequencySelector } from './ScheduleFrequencySelector';
import { toast } from '@/hooks/use-toast';

interface GLPIScheduledTicketFormProps {
  editingTicket?: GLPIScheduledTicket | null;
  onSave?: () => void;
  onCancel?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Muito Baixa' },
  { value: 2, label: 'Baixa' },
  { value: 3, label: 'Média' },
  { value: 4, label: 'Alta' },
  { value: 5, label: 'Muito Alta' },
  { value: 6, label: 'Crítica' },
];

export const GLPIScheduledTicketForm = ({ editingTicket, onSave, onCancel }: GLPIScheduledTicketFormProps) => {
  const createTicket = useCreateGLPIScheduledTicket();
  const updateTicket = useUpdateGLPIScheduledTicket();

  const [formData, setFormData] = React.useState({
    name: editingTicket?.name || '',
    title: editingTicket?.title || '',
    content: editingTicket?.content || '',
    priority: editingTicket?.priority || 3,
    urgency: editingTicket?.urgency || 3,
    impact: editingTicket?.impact || 3,
    type: editingTicket?.type || 1,
    category_id: editingTicket?.category_id || undefined,
    requester_user_id: editingTicket?.requester_user_id || undefined,
    assign_user_id: editingTicket?.assign_user_id || undefined,
    assign_group_id: editingTicket?.assign_group_id || undefined,
    entity_id: editingTicket?.entity_id || 0,
    cron_expression: editingTicket?.cron_expression || '0 9 * * *',
    is_active: editingTicket?.is_active ?? true,
    settings: editingTicket?.settings || {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.title || !formData.content || !formData.cron_expression) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, título, conteúdo e horário.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTicket) {
        await updateTicket.mutateAsync({
          id: editingTicket.id,
          updates: formData
        });
      } else {
        await createTicket.mutateAsync(formData);
      }
      
      onSave?.();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure as informações básicas do agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome do Agendamento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Verificação Semanal de Servidores"
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
              />
            </div>

            <ScheduleFrequencySelector
              value={formData.cron_expression}
              onChange={(value) => setFormData({ ...formData, cron_expression: value })}
            />

            <div className="flex items-center space-x-2">
              <Switch 
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-white">Agendamento ativo</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5" />
              Conteúdo do Chamado
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure o título e descrição do chamado que será criado no GLPI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Título do Chamado *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Verificação de Status dos Servidores"
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">Descrição do Chamado *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Descreva detalhadamente o que deve ser verificado ou executado..."
                rows={4}
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              Parâmetros do Chamado
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure prioridade, urgência e outros parâmetros do chamado no GLPI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-white">Prioridade</Label>
                <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                  <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-600 border-gray-500">
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-gray-500">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-white">Urgência</Label>
                <Select value={formData.urgency.toString()} onValueChange={(value) => setFormData({ ...formData, urgency: parseInt(value) })}>
                  <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-600 border-gray-500">
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-gray-500">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact" className="text-white">Impacto</Label>
                <Select value={formData.impact.toString()} onValueChange={(value) => setFormData({ ...formData, impact: parseInt(value) })}>
                  <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-600 border-gray-500">
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-gray-500">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-white">Tipo do Chamado</Label>
                <Input
                  id="type"
                  type="number"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity_id" className="text-white">ID da Entidade</Label>
                <Input
                  id="entity_id"
                  type="number"
                  value={formData.entity_id}
                  onChange={(e) => setFormData({ ...formData, entity_id: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id" className="text-white">ID da Categoria (opcional)</Label>
                <Input
                  id="category_id"
                  type="number"
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ex: 5"
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assign_user_id" className="text-white">ID Usuário Responsável (opcional)</Label>
                <Input
                  id="assign_user_id"
                  type="number"
                  value={formData.assign_user_id || ''}
                  onChange={(e) => setFormData({ ...formData, assign_user_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ex: 2"
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assign_group_id" className="text-white">ID Grupo Responsável (opcional)</Label>
                <Input
                  id="assign_group_id"
                  type="number"
                  value={formData.assign_group_id || ''}
                  onChange={(e) => setFormData({ ...formData, assign_group_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ex: 3"
                  className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button 
            type="submit" 
            disabled={createTicket.isPending || updateTicket.isPending}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {editingTicket ? 'Atualizar' : 'Criar'} Agendamento
          </Button>
          
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
