
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
  AlertCircle
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
  custom: MessageCircle
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
      // Force refetch templates when dialog opens
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
    console.log('💾 Salvando relatório:', formData);
    
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

    console.log('💾 Dados a serem salvos:', dataToSave);

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
    console.log('⏰ Cron expression alterada:', cronExpression);
    setFormData(prev => ({
      ...prev,
      cron_expression: cronExpression
    }));
    setFormErrors(prev => ({
      ...prev,
      cron_expression: ''
    }));
  }, []);

  const isLoading = createReport.isPending || updateReport.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              Configure um relatório automático para ser enviado via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
                <CardDescription>
                  Configure as informações básicas do agendamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome do Agendamento *</Label>
                  <Input 
                    id="name" 
                    placeholder="ex: Relatório Diário de Backups"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="report_type" className="text-sm font-medium">Template WhatsApp *</Label>
                    {!templatesLoading && activeTemplates.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/whatsapp-templates', '_blank')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Criar Template
                      </Button>
                    )}
                  </div>
                  <Select 
                    value={formData.report_type} 
                    onValueChange={(value) => {
                      console.log('🎯 Template selecionado:', value);
                      setFormData({...formData, report_type: value});
                      setFormErrors({...formErrors, report_type: ''});
                    }}
                  >
                    <SelectTrigger className={`w-full ${formErrors.report_type ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesLoading ? (
                        <div className="p-4 text-center text-gray-500">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Carregando templates...</p>
                        </div>
                      ) : activeTemplates.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum template ativo encontrado.</p>
                          <p className="text-xs mt-1">Crie templates na página "Templates WhatsApp".</p>
                        </div>
                      ) : (
                        activeTemplates.map((template) => {
                          const Icon = templateTypeIcons[template.template_type as keyof typeof templateTypeIcons] || MessageCircle;
                          return (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-xs text-gray-500">{template.subject}</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.report_type && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.report_type}
                    </p>
                  )}
                  
                  {selectedTemplate && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplatePreview(true)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar Template Selecionado
                      </Button>
                    </div>
                  )}
                  
                  {!templatesLoading && activeTemplates.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Configure templates ativos na página "Templates WhatsApp" para criar agendamentos.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium">Número WhatsApp *</Label>
                  <Input 
                    id="phone_number" 
                    placeholder="5511999999999"
                    value={formData.phone_number}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, phone_number: cleaned});
                      setFormErrors({...formErrors, phone_number: ''});
                    }}
                    className={`w-full ${formErrors.phone_number ? 'border-red-500' : ''}`}
                    maxLength={13}
                  />
                  {formErrors.phone_number && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.phone_number}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Digite apenas números (ex: 5511999999999)</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                  <div className="flex-1">
                    <Label htmlFor="is_active" className="text-sm font-medium">Ativar agendamento</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Quando ativo, o relatório será enviado automaticamente
                    </p>
                  </div>
                  <Switch 
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuração de Horário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuração de Horário</CardTitle>
                <CardDescription>
                  Defina quando o relatório deve ser enviado automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedCronBuilder
                  value={formData.cron_expression}
                  onChange={handleCronChange}
                />
                {formErrors.cron_expression && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.cron_expression}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || (activeTemplates.length === 0 && !templatesLoading)}
              className="min-w-24"
            >
              {isLoading ? 'Salvando...' : editingReport ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Preview do Template WhatsApp
              </DialogTitle>
              <DialogDescription>
                Visualização do template que será usado no agendamento
              </DialogDescription>
            </DialogHeader>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {selectedTemplate.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTemplate.template_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Assunto:</Label>
                  <p className="text-sm bg-muted p-2 rounded mt-1">{selectedTemplate.subject}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Conteúdo:</Label>
                  <div className="bg-muted p-3 rounded mt-1 whitespace-pre-wrap text-sm">
                    {selectedTemplate.body}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>As variáveis serão substituídas automaticamente quando o relatório for enviado.</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowTemplatePreview(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
