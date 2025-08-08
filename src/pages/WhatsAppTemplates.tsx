import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Plus, Edit, Trash2, Search, Calendar, HardDrive, ExternalLink } from 'lucide-react';
import { useWhatsAppTemplates, useCreateWhatsAppTemplate, useUpdateWhatsAppTemplate, useDeleteWhatsAppTemplate } from '@/hooks/useWhatsAppTemplates';
import { toast } from '@/hooks/use-toast';

const WhatsAppTemplates = () => {
  const {
    data: templates = [],
    isLoading
  } = useWhatsAppTemplates();
  const createTemplate = useCreateWhatsAppTemplate();
  const updateTemplate = useUpdateWhatsAppTemplate();
  const deleteTemplate = useDeleteWhatsAppTemplate();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
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
      color: 'bg-red-600 text-white',
      variables: ['{{date}}', '{{hours_threshold}}', '{{backup_list}}', '{{total_outdated}}']
    },
    schedule_critical: {
      name: 'Vencimentos Críticos',
      icon: Calendar,
      color: 'bg-orange-600 text-white',
      variables: ['{{date}}', '{{schedule_items}}', '{{total_items}}', '{{critical_count}}']
    },
    glpi_summary: {
      name: 'Resumo GLPI',
      icon: ExternalLink,
      color: 'bg-blue-600 text-white',
      variables: [
        '{{date}}', '{{open_tickets}}', '{{critical_tickets}}', '{{pending_tickets}}', 
        '{{ticket_list}}', '{{open_tickets_list}}', '{{open_tickets_detailed}}', 
        '{{critical_tickets_list}}', '{{critical_tickets_detailed}}', '{{overdue}}', 
        '{{total_active}}', '{{new_today}}', '{{avg_time_open}}'
      ]
    },
    custom: {
      name: 'Personalizado',
      icon: MessageCircle,
      color: 'bg-purple-600 text-white',
      variables: ['{{custom_var}}']
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos obrigatórios.",
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

      setFormData({
        name: '',
        template_type: 'backup_alert',
        subject: '',
        body: '',
        is_active: true
      });
      setEditingTemplate(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleEdit = (template: any) => {
    setFormData({
      name: template.name,
      template_type: template.template_type,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        await deleteTemplate.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao excluir template:', error);
      }
    }
  };

  const getCategoryColor = (templateType: string) => {
    return templateTypes[templateType as keyof typeof templateTypes]?.color || 'bg-gray-600 text-white';
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

      setFormData({
        ...formData,
        body: newText
      });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="text-gray-400">Carregando templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Modelos WhatsApp</h1>
          <p className="text-gray-400">Gerencie modelos de mensagens para relatórios automáticos</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setFormData({
              name: '',
              template_type: 'backup_alert',
              subject: '',
              body: '',
              is_active: true
            });
          }}
          className="bg-blue-800 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar modelos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="space-y-2">
        {filteredTemplates.map(template => {
          const templateTypeInfo = templateTypes[template.template_type as keyof typeof templateTypes];
          const Icon = templateTypeInfo?.icon || MessageCircle;

          return (
            <div
              key={template.id}
              className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-white truncate flex-1">{template.name}</span>
                  <Badge className={getCategoryColor(template.template_type)} title={templateTypeInfo?.name}>
                    <Icon className="h-3 w-3" />
                  </Badge>
                  {template.is_active ? (
                    <Badge className="bg-green-600 text-white">Ativo</Badge>
                  ) : (
                    <Badge className="bg-gray-600 text-white">Inativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    title="Editar"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="h-7 w-7 p-0 text-white border-red-600 bg-red-900 hover:bg-red-800"
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400 truncate">
                {template.subject}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-gray-800/50 border-gray-700 border-dashed">
          <CardContent className="p-12">
            <div className="text-center text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">Nenhum modelo encontrado</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchTerm ? 'Nenhum modelo corresponde aos filtros aplicados.' : 'Crie seu primeiro modelo de mensagem para WhatsApp.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingTemplate ? 'Edite o modelo de mensagem.' : 'Crie um novo modelo de mensagem para WhatsApp.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })}
                placeholder="Ex: Alerta de Backups Personalizado"
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_type" className="text-gray-300">Tipo de Template *</Label>
              <Select value={formData.template_type} onValueChange={(value: any) => setFormData({
                ...formData,
                template_type: value
              })}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {Object.entries(templateTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-300">Assunto *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={e => setFormData({
                  ...formData,
                  subject: e.target.value
                })}
                placeholder="Ex: 🚨 Backups Desatualizados - {{date}}"
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body" className="text-gray-300">Corpo da Mensagem *</Label>
              <Textarea
                id="template-body"
                value={formData.body}
                onChange={e => setFormData({
                  ...formData,
                  body: e.target.value
                })}
                placeholder="Digite o corpo da mensagem aqui..."
                rows={8}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <Label className="text-sm text-gray-400">Variáveis disponíveis:</Label>
                {templateTypes[formData.template_type].variables.map(variable => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
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
                onCheckedChange={checked => setFormData({
                  ...formData,
                  is_active: checked
                })}
              />
              <Label htmlFor="is_active" className="text-gray-300">Template ativo</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {editingTemplate ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppTemplates;
