
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
import { 
  MessageCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Search,
  Calendar,
  Building,
  Clock,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { 
  useWhatsAppTemplates, 
  useCreateWhatsAppTemplate, 
  useUpdateWhatsAppTemplate, 
  useDeleteWhatsAppTemplate 
} from '@/hooks/useWhatsAppTemplates';
import { toast } from '@/hooks/use-toast';

const WhatsAppTemplates = () => {
  const { data: templates = [], isLoading } = useWhatsAppTemplates();
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
    },
    custom: {
      name: 'Personalizado',
      icon: MessageCircle,
      color: 'bg-purple-100 text-purple-800',
      variables: ['{{custom_var}}']
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.body.toLowerCase().includes(searchTerm.toLowerCase())
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

      setFormData({ name: '', template_type: 'backup_alert', subject: '', body: '', is_active: true });
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Template copiado!",
      description: "O conteúdo foi copiado para a área de transferência."
    });
  };

  const getCategoryColor = (templateType: string) => {
    return templateTypes[templateType as keyof typeof templateTypes]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modelos WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie modelos de mensagens para relatórios automáticos</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setFormData({ name: '', template_type: 'backup_alert', subject: '', body: '', is_active: true });
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const templateTypeInfo = templateTypes[template.template_type as keyof typeof templateTypes];
          const Icon = templateTypeInfo?.icon || MessageCircle;
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    {template.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(template.template_type)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {templateTypeInfo?.name || template.template_type}
                    </Badge>
                    {template.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Assunto:</Label>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm font-medium">Conteúdo:</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">{template.body}</p>
                </div>
                
                {templateTypeInfo?.variables && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Variáveis disponíveis:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {templateTypeInfo.variables.map((variable: string) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(template.body)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhum modelo encontrado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm ? 'Nenhum modelo corresponde aos filtros aplicados.' : 'Crie seu primeiro modelo de mensagem para WhatsApp.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Edite o modelo de mensagem.' : 'Crie um novo modelo de mensagem para WhatsApp.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Alerta de Backups Personalizado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_type">Tipo de Template *</Label>
              <Select value={formData.template_type} onValueChange={(value: any) => setFormData({ ...formData, template_type: value })}>
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

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: 🚨 Backups Desatualizados - {{date}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body">Corpo da Mensagem *</Label>
              <Textarea
                id="template-body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Digite o corpo da mensagem aqui..."
                rows={8}
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
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Template ativo</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
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
