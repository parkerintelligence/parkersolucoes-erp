import { useState } from 'react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
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
    backup_alert: { name: 'Alerta de Backups', icon: HardDrive, color: 'bg-destructive/10 text-destructive border-destructive/30', variables: ['{{date}}', '{{hours_threshold}}', '{{backup_list}}', '{{total_outdated}}'] },
    schedule_critical: { name: 'Vencimentos Críticos', icon: Calendar, color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', variables: ['{{date}}', '{{schedule_items}}', '{{total_items}}', '{{critical_count}}'] },
    glpi_summary: { name: 'Resumo GLPI', icon: ExternalLink, color: 'bg-primary/10 text-primary border-primary/30', variables: ['{{date}}', '{{open_tickets}}', '{{critical_tickets}}', '{{pending_tickets}}', '{{ticket_list}}', '{{open_tickets_list}}', '{{open_tickets_detailed}}', '{{critical_tickets_list}}', '{{critical_tickets_detailed}}', '{{overdue}}', '{{total_active}}', '{{new_today}}', '{{avg_time_open}}'] },
    custom: { name: 'Personalizado', icon: MessageCircle, color: 'bg-purple-500/10 text-purple-500 border-purple-500/30', variables: ['{{custom_var}}'] }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.body) {
      toast({ title: "Erro no formulário", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, updates: formData });
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
    setFormData({ name: template.name, template_type: template.template_type, subject: template.subject, body: template.body, is_active: template.is_active });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const { confirm } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ title: "Excluir template", description: "Tem certeza que deseja excluir este template?" });
    if (confirmed) {
      try { await deleteTemplate.mutateAsync(id); } catch (error) { console.error('Erro ao excluir template:', error); }
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFormData({ ...formData, body: newText });
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Modelos WhatsApp
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie modelos de mensagens para relatórios automáticos</p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowForm(true); setEditingTemplate(null); setFormData({ name: '', template_type: 'backup_alert', subject: '', body: '', is_active: true }); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Novo Modelo
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar modelos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-8 bg-card border-border h-8 text-xs"
        />
      </div>

      {/* Templates Grid */}
      <div className="space-y-2">
        {filteredTemplates.map(template => {
          const templateTypeInfo = templateTypes[template.template_type as keyof typeof templateTypes];
          const Icon = templateTypeInfo?.icon || MessageCircle;

          return (
            <div
              key={template.id}
              className="bg-card border border-border p-3 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium text-foreground text-sm truncate flex-1">{template.name}</span>
                  <Badge variant="outline" className={`text-[10px] border ${templateTypeInfo?.color || ''}`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {templateTypeInfo?.name || template.template_type}
                  </Badge>
                  <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(template)} className="h-7 w-7 p-0">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground truncate pl-7">
                {template.subject}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum modelo encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchTerm ? 'Nenhum modelo corresponde aos filtros aplicados.' : 'Crie seu primeiro modelo de mensagem para WhatsApp.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingTemplate ? 'Edite o modelo de mensagem.' : 'Crie um novo modelo de mensagem para WhatsApp.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground text-xs">Nome *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Alerta de Backups Personalizado" className="bg-background border-border h-8 text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_type" className="text-foreground text-xs">Tipo de Template *</Label>
              <Select value={formData.template_type} onValueChange={(value: any) => setFormData({ ...formData, template_type: value })}>
                <SelectTrigger className="bg-background border-border h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(templateTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2"><type.icon className="h-3.5 w-3.5" />{type.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-foreground text-xs">Assunto *</Label>
              <Input id="subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Ex: 🚨 Backups Desatualizados - {{date}}" className="bg-background border-border h-8 text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body" className="text-foreground text-xs">Corpo da Mensagem *</Label>
              <Textarea id="template-body" value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} placeholder="Digite o corpo da mensagem aqui..." rows={8} className="bg-background border-border text-xs" />
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] text-muted-foreground">Variáveis:</span>
                {(templateTypes[formData.template_type as keyof typeof templateTypes]?.variables || []).map(variable => (
                  <Button key={variable} variant="outline" size="sm" type="button" onClick={() => insertVariable(variable)} className="text-[10px] h-5 px-1.5 border-border">{variable}</Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({ ...formData, is_active: checked })} />
              <Label htmlFor="is_active" className="text-foreground text-xs">Template ativo</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} size="sm">Cancelar</Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={createTemplate.isPending || updateTemplate.isPending}>
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
