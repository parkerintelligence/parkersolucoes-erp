
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { 
  useCreateScheduledReport, 
  useUpdateScheduledReport, 
  ScheduledReport 
} from '@/hooks/useScheduledReports';
import { AdvancedCronBuilder } from './AdvancedCronBuilder';
import { 
  MessageCircle, 
  HardDrive, 
  Calendar, 
  ExternalLink,
  Eye,
  Plus,
  AlertCircle,
  Save,
  Clock,
  Network,
  Activity
} from 'lucide-react';

interface ScheduledReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingReport: ScheduledReport | null;
  onSuccess: () => void;
}

const templateTypeIcons = {
  backup_alert: HardDrive,
  schedule_critical: Calendar,
  glpi_summary: ExternalLink,
  bacula_daily: HardDrive,
  custom: MessageCircle,
  mikrotik_dashboard: Network
};

export const ScheduledReportForm = ({ open, onOpenChange, editingReport, onSuccess }: ScheduledReportFormProps) => {
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useWhatsAppTemplates();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();

  console.log('📝 ScheduledReportForm - Render:', {
    open,
    editingReport: editingReport ? {
      id: editingReport.id,
      name: editingReport.name,
      cron_expression: editingReport.cron_expression,
      report_type: editingReport.report_type
    } : null,
    templatesCount: templates.length
  });

  const [formData, setFormData] = useState({
    name: '',
    report_type: '',
    phone_number: '',
    cron_expression: '0 9 * * *',
    is_active: true,
    settings: {}
  });

  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Reset form when dialog opens/closes or editing report changes
  const resetForm = useCallback(() => {
    console.log('🔄 Resetando formulário');
    if (editingReport) {
      console.log('📝 Preenchendo com dados do relatório:', {
        name: editingReport.name,
        report_type: editingReport.report_type,
        phone_number: editingReport.phone_number,
        cron_expression: editingReport.cron_expression,
        is_active: editingReport.is_active
      });
      setFormData({
        name: editingReport.name,
        report_type: editingReport.report_type,
        phone_number: editingReport.phone_number,
        cron_expression: editingReport.cron_expression,
        is_active: editingReport.is_active,
        settings: editingReport.settings || {}
      });
    } else {
      console.log('🆕 Criando novo relatório - limpando formulário');
      setFormData({
        name: '',
        report_type: '',
        phone_number: '',
        cron_expression: '0 9 * * *',
        is_active: true,
        settings: {}
      });
    }
    setFormErrors({});
    setShowTemplatePreview(false);
  }, [editingReport]);

  // Effect to reset form when dialog opens or editingReport changes
  React.useEffect(() => {
    if (open) {
      console.log('🔄 Dialog aberto - resetando formulário');
      resetForm();
      refetchTemplates();
    }
  }, [open, editingReport, resetForm, refetchTemplates]);

  // Filtrar apenas templates ativos
  const activeTemplates = useMemo(() => {
    const filtered = templates.filter(template => template.is_active);
    console.log('📋 Templates ativos:', filtered.length, 'de', templates.length);
    return filtered;
  }, [templates]);

  // Template selecionado
  const selectedTemplate = useMemo(() => {
    const template = activeTemplates.find(template => template.id === formData.report_type);
    console.log('🎯 Template selecionado:', template ? template.name : 'nenhum');
    return template;
  }, [activeTemplates, formData.report_type]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Número do WhatsApp é obrigatório';
    } else if (!/^\d{10,15}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      errors.phone_number = 'Formato de telefone inválido';
    }

    if (!formData.cron_expression.trim()) {
      errors.cron_expression = 'Horário é obrigatório';
    } else {
      // Validar formato da expressão cron
      const cronParts = formData.cron_expression.split(' ');
      if (cronParts.length !== 5) {
        errors.cron_expression = 'Formato de horário inválido';
      } else {
        const minute = parseInt(cronParts[0]);
        const hour = parseInt(cronParts[1]);
        if (isNaN(minute) || minute < 0 || minute > 59) {
          errors.cron_expression = 'Minuto inválido (0-59)';
        }
        if (isNaN(hour) || hour < 0 || hour > 23) {
          errors.cron_expression = 'Hora inválida (0-23)';
        }
      }
    }

    if (!formData.report_type) {
      errors.report_type = 'Template é obrigatório';
    }

    // Verificar se o template existe e está ativo
    if (formData.report_type && !selectedTemplate) {
      errors.report_type = 'Template selecionado não encontrado ou inativo';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    console.log('💾 Salvando relatório:', {
      ...formData,
      cron_expression_parsed: formData.cron_expression
    });
    
    if (!validateForm()) {
      toast({
        title: "Erro no formulário",
        description: "Corrija os campos destacados em vermelho.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o template existe e está ativo
    if (!selectedTemplate) {
      toast({
        title: "Template inválido",
        description: "O template selecionado não existe ou não está ativo.",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = {
      ...formData,
      phone_number: formData.phone_number.replace(/\D/g, ''), // Limpar formatação
    };

    console.log('💾 Dados finais a serem salvos:', {
      ...dataToSave,
      cron_breakdown: {
        expression: dataToSave.cron_expression,
        parts: dataToSave.cron_expression.split(' '),
        minute: dataToSave.cron_expression.split(' ')[0],
        hour: dataToSave.cron_expression.split(' ')[1]
      }
    });

    try {
      if (editingReport) {
        console.log('✏️ Atualizando relatório existente:', editingReport.id);
        await updateReport.mutateAsync({
          id: editingReport.id,
          updates: dataToSave
        });
        toast({
          title: "Agendamento atualizado!",
          description: `O relatório "${formData.name}" foi atualizado com sucesso.`,
        });
      } else {
        console.log('🆕 Criando novo relatório');
        await createReport.mutateAsync(dataToSave);
        toast({
          title: "Agendamento criado!",
          description: `O relatório "${formData.name}" foi criado com sucesso.`,
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Erro ao salvar agendamento:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  };

  const handleCronChange = useCallback((cronExpression: string) => {
    console.log('⏰ Cron expression alterada de:', formData.cron_expression, 'para:', cronExpression);
    setFormData(prev => ({
      ...prev,
      cron_expression: cronExpression
    }));
    setFormErrors(prev => ({
      ...prev,
      cron_expression: ''
    }));
  }, [formData.cron_expression]);

  const isLoading = createReport.isPending || updateReport.isPending;

  // Função para formatar a expressão cron para display
  const formatCronForDisplay = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length >= 2) {
      const minute = parseInt(parts[0]) || 0;
      const hour = parseInt(parts[1]) || 0;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    return cron;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingReport ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure um relatório automático para ser enviado via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Informações Básicas */}
            <Card className="border-border bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-foreground">Informações Básicas</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">Configure as informações básicas do agendamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-foreground text-xs">Nome do Agendamento *</Label>
                  <Input 
                    id="name" 
                    placeholder="ex: Relatório Diário de Backups"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`bg-background border-border h-8 text-xs ${formErrors.name ? 'border-destructive' : ''}`}
                  />
                  {formErrors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" />{formErrors.name}</p>}
                </div>
                
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="report_type" className="text-foreground text-xs">Template WhatsApp *</Label>
                    {!templatesLoading && activeTemplates.length === 0 && (
                      <Button variant="outline" size="sm" onClick={() => window.open('/whatsapp-templates', '_blank')} className="h-6 text-[10px]">
                        <Plus className="h-2.5 w-2.5 mr-1" /> Criar Template
                      </Button>
                    )}
                  </div>
                  <Select value={formData.report_type} onValueChange={(value) => { setFormData({...formData, report_type: value}); setFormErrors({...formErrors, report_type: ''}); }}>
                    <SelectTrigger className={`bg-background border-border h-8 text-xs ${formErrors.report_type ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesLoading ? (
                        <div className="p-3 text-center text-muted-foreground"><p className="text-xs">Carregando templates...</p></div>
                      ) : activeTemplates.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground"><p className="text-xs">Nenhum template ativo encontrado.</p></div>
                      ) : (
                        activeTemplates.map((template) => {
                          const Icon = templateTypeIcons[template.template_type as keyof typeof templateTypeIcons] || MessageCircle;
                          return (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium">{template.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{template.subject}</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.report_type && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" />{formErrors.report_type}</p>}
                  
                  {selectedTemplate && (
                    <Button variant="outline" size="sm" onClick={() => setShowTemplatePreview(true)} className="w-full h-7 text-xs mt-1">
                      <Eye className="h-3 w-3 mr-1.5" /> Visualizar Template
                    </Button>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="phone_number" className="text-foreground text-xs">Número WhatsApp *</Label>
                  <Input 
                    id="phone_number" 
                    placeholder="5511999999999"
                    value={formData.phone_number}
                    onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, ''); setFormData({...formData, phone_number: cleaned}); setFormErrors({...formErrors, phone_number: ''}); }}
                    className={`bg-background border-border h-8 text-xs ${formErrors.phone_number ? 'border-destructive' : ''}`}
                    maxLength={13}
                  />
                  {formErrors.phone_number && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" />{formErrors.phone_number}</p>}
                  <p className="text-[10px] text-muted-foreground">Digite apenas números (ex: 5511999999999)</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md border border-border bg-background">
                  <div className="flex-1">
                    <Label htmlFor="is_active" className="text-foreground text-xs">Ativar agendamento</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Quando ativo, será enviado automaticamente</p>
                  </div>
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
                </div>
              </CardContent>
            </Card>

            {/* Horário */}
            <Card className="border-border bg-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm text-foreground">Configuração de Horário</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">Defina quando o relatório deve ser enviado</CardDescription>
                  </div>
                  {formData.cron_expression && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Atual: {formatCronForDisplay(formData.cron_expression)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AdvancedCronBuilder value={formData.cron_expression} onChange={handleCronChange} />
                {formErrors.cron_expression && <p className="text-xs text-destructive flex items-center gap-1 mt-2"><AlertCircle className="h-2.5 w-2.5" />{formErrors.cron_expression}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading || (activeTemplates.length === 0 && !templatesLoading)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? 'Salvando...' : (<><Save className="h-3.5 w-3.5 mr-1.5" />{editingReport ? 'Atualizar' : 'Criar'}</>)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview */}
      {selectedTemplate && (
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className="sm:max-w-2xl border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground text-sm">
                <MessageCircle className="h-4 w-4 text-primary" /> Preview do Template
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">Visualização do template do agendamento</DialogDescription>
            </DialogHeader>
            
            <Card className="border-border bg-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-foreground">{selectedTemplate.name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-400">{selectedTemplate.is_active ? 'Ativo' : 'Inativo'}</Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{selectedTemplate.template_type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-foreground text-xs">Assunto:</Label>
                  <p className="text-xs bg-background p-2 rounded border border-border mt-1 text-foreground">{selectedTemplate.subject}</p>
                </div>
                <div>
                  <Label className="text-foreground text-xs">Conteúdo:</Label>
                  <div className="bg-background p-2.5 rounded border border-border mt-1 whitespace-pre-wrap text-xs text-foreground">{selectedTemplate.body}</div>
                </div>
                {(selectedTemplate.template_type as string) === 'mikrotik_dashboard' && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      <Activity className="h-2.5 w-2.5 mr-1" /> Relatório consolidado Mikrotik
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">Coleta dados de todos os clientes Mikrotik cadastrados.</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">As variáveis serão substituídas automaticamente.</p>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowTemplatePreview(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
