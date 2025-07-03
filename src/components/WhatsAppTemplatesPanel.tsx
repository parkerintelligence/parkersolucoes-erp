import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Edit, Trash2, MessageSquare, HardDrive, Calendar, ExternalLink
} from 'lucide-react';
import { 
  useWhatsAppTemplates, 
  useCreateWhatsAppTemplate, 
  useUpdateWhatsAppTemplate, 
  useDeleteWhatsAppTemplate,
  WhatsAppTemplate 
} from '@/hooks/useWhatsAppTemplates';
import { toast } from '@/hooks/use-toast';

const WhatsAppTemplatesPanel = () => {
  const { data: templates = [], isLoading, refetch } = useWhatsAppTemplates();
  const createTemplate = useCreateWhatsAppTemplate();
  const updateTemplate = useUpdateWhatsAppTemplate();
  const deleteTemplate = useDeleteWhatsAppTemplate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    template_type: 'backup_alert' | 'schedule_critical' | 'glpi_summary';
    subject: string;
    body: string;
    is_active: boolean;
  }>({
    name: '',
    template_type: 'backup_alert' as const,
    subject: '',
    body: '',
    is_active: true
  });

  const templateTypes = {
    backup_alert: { 
      name: 'Alerta de Backups', 
      icon: HardDrive, 
      color: 'bg-red-100 text-red-800',
      variables: ['{{date}}', '{{hours_threshold}}', '{{backup_list}}']
    },
    schedule_critical: { 
      name: 'Vencimentos Críticos', 
      icon: Calendar, 
      color: 'bg-orange-100 text-orange-800',
      variables: ['{{date}}', '{{schedule_items}}', '{{total_items}}']
    },
    glpi_summary: { 
      name: 'Resumo GLPI', 
      icon: ExternalLink, 
      color: 'bg-blue-100 text-blue-800',
      variables: ['{{date}}', '{{open_tickets}}', '{{critical_tickets}}', '{{pending_tickets}}', '{{ticket_list}}']
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, assunto e corpo da mensagem.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          updates: formData
        });
      } else {
        await createTemplate.mutateAsync(formData);
      }
      
      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        template_type: 'backup_alert',
        subject: '',
        body: '',
        is_active: true
      });
      refetch();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (template: WhatsAppTemplate) => {
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        updates: { is_active: !template.is_active }
      });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        await deleteTemplate.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir template:', error);
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const templateType = templateTypes[type];
    const Icon = templateType.icon;
    return (
      <Badge className={templateType.color}>
        <Icon className="h-3 w-3 mr-1" />
        {templateType.name}
      </Badge>
    );
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + variable + after;
      
      setFormData({ ...formData, body: newText });
      
      // Restaurar posição do cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600">Carregando templates...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Templates de Mensagens WhatsApp
            </CardTitle>
            <CardDescription>
              Modelos de mensagens para relatórios automáticos
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTemplate(null);
                setFormData({
                  name: '',
                  template_type: 'backup_alert',
                  subject: '',
                  body: '',
                  is_active: true
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </DialogTitle>
                <DialogDescription>
                  Configure um template de mensagem para relatórios automáticos
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input 
                    id="name" 
                    placeholder="ex: Alerta de Backups Personalizado"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="template_type">Tipo de Template *</Label>
                  <Select value={formData.template_type} onValueChange={(value: any) => setFormData({...formData, template_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templateTypes).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input 
                    id="subject" 
                    placeholder="ex: 🚨 Backups Desatualizados - {{date}}"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template-body">Corpo da Mensagem *</Label>
                  <Textarea 
                    id="template-body"
                    placeholder="Digite o corpo da mensagem aqui..."
                    value={formData.body}
                    onChange={(e) => setFormData({...formData, body: e.target.value})}
                    rows={10}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Label className="text-sm text-gray-600">Variáveis disponíveis:</Label>
                    {templateTypes[formData.template_type].variables.map((variable) => (
                      <Button
                        key={variable}
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="text-xs"
                      >
                        {variable}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Template ativo</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {editingTemplate ? 'Atualizar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{getTypeBadge(template.template_type)}</TableCell>
                <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                <TableCell>
                  {template.is_active ? (
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(template)}
                    >
                      {template.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {templates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum template encontrado. Crie o primeiro template.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppTemplatesPanel;