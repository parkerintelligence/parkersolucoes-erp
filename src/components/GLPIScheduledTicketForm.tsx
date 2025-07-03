import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, AlertTriangle, User, Settings } from 'lucide-react';
import { useCreateGLPIScheduledTicket, useUpdateGLPIScheduledTicket, GLPIScheduledTicket } from '@/hooks/useGLPIScheduledTickets';
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

const CRON_PRESETS = [
  { label: '6:00 - Todo dia', value: '0 6 * * *' },
  { label: '9:00 - Todo dia', value: '0 9 * * *' },
  { label: '12:00 - Todo dia', value: '0 12 * * *' },
  { label: '18:00 - Todo dia', value: '0 18 * * *' },
  { label: '8:00 - Segunda a Sexta', value: '0 8 * * 1-5' },
  { label: '9:00 - Segunda a Sexta', value: '0 9 * * 1-5' },
  { label: '6:00 - Toda Segunda', value: '0 6 * * 1' },
  { label: '9:00 - Todo Domingo', value: '0 9 * * 0' },
];

export const GLPIScheduledTicketForm = ({ editingTicket, onSave, onCancel }: GLPIScheduledTicketFormProps) => {
  const createTicket = useCreateGLPIScheduledTicket();
  const updateTicket = useUpdateGLPIScheduledTicket();

  const [formData, setFormData] = useState({
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Configure as informações básicas do agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Agendamento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Verificação Semanal de Servidores"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cron_expression">Horário de Execução *</Label>
              <Select value={formData.cron_expression} onValueChange={(value) => setFormData({ ...formData, cron_expression: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Agendamento ativo</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Conteúdo do Chamado
          </CardTitle>
          <CardDescription>
            Configure o título e descrição do chamado que será criado no GLPI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Chamado *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Verificação de Status dos Servidores"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Descrição do Chamado *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Descreva detalhadamente o que deve ser verificado ou executado..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Parâmetros do Chamado
          </CardTitle>
          <CardDescription>
            Configure prioridade, urgência e outros parâmetros do chamado no GLPI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgência</Label>
              <Select value={formData.urgency.toString()} onValueChange={(value) => setFormData({ ...formData, urgency: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impacto</Label>
              <Select value={formData.impact.toString()} onValueChange={(value) => setFormData({ ...formData, impact: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo do Chamado</Label>
              <Input
                id="type"
                type="number"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) || 1 })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_id">ID da Entidade</Label>
              <Input
                id="entity_id"
                type="number"
                value={formData.entity_id}
                onChange={(e) => setFormData({ ...formData, entity_id: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">ID da Categoria (opcional)</Label>
              <Input
                id="category_id"
                type="number"
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Ex: 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign_user_id">ID Usuário Responsável (opcional)</Label>
              <Input
                id="assign_user_id"
                type="number"
                value={formData.assign_user_id || ''}
                onChange={(e) => setFormData({ ...formData, assign_user_id: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Ex: 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign_group_id">ID Grupo Responsável (opcional)</Label>
              <Input
                id="assign_group_id"
                type="number"
                value={formData.assign_group_id || ''}
                onChange={(e) => setFormData({ ...formData, assign_group_id: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Ex: 3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={createTicket.isPending || updateTicket.isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {editingTicket ? 'Atualizar' : 'Criar'} Agendamento
        </Button>
        
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};