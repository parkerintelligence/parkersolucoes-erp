
import React, { useState, useMemo } from 'react';
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
  Plus
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
  const { data: templates = [] } = useWhatsAppTemplates();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();

  const [formData, setFormData] = useState({
    name: editingReport?.name || '',
    report_type: editingReport?.report_type || '',
    phone_number: editingReport?.phone_number || '',
    cron_expression: editingReport?.cron_expression || '0 9 * * *',
    is_active: editingReport?.is_active ?? true,
    settings: editingReport?.settings || {}
  });

  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Filtrar apenas templates ativos
  const activeTemplates = useMemo(() => {
    return templates.filter(template => template.is_active);
  }, [templates]);

  // Template selecionado
  const selectedTemplate = useMemo(() => {
    return activeTemplates.find(template => template.id === formData.report_type);
  }, [activeTemplates, formData.report_type]);

  React.useEffect(() => {
    if (editingReport) {
      setFormData({
        name: editingReport.name,
        report_type: editingReport.report_type,
        phone_number: editingReport.phone_number,
        cron_expression: editingReport.cron_expression,
        is_active: editingReport.is_active,
        settings: editingReport.settings || {}
      });
    } else {
      // Reset form when creating new
      setFormData({
        name: '',
        report_type: '',
        phone_number: '',
        cron_expression: '0 9 * * *',
        is_active: true,
        settings: {}
      });
    }
  }, [editingReport, open]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone_number.trim() || !formData.cron_expression.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, telefone e horário.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.report_type) {
      toast({
        title: "Template obrigatório",
        description: "Selecione um template de mensagem.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o template existe e está ativo
    const template = activeTemplates.find(t => t.id === formData.report_type);
    if (!template) {
      toast({
        title: "Template inválido",
        description: "O template selecionado não existe ou não está ativo.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingReport) {
        await updateReport.mutateAsync({
          id: editingReport.id,
          updates: formData
        });
      } else {
        await createReport.mutateAsync(formData);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  const isLoading = createReport.isPending || updateReport.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              Configure um relatório automático para ser enviado via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Coluna Esquerda - Informações Básicas */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome do Agendamento *</Label>
                <Input 
                  id="name" 
                  placeholder="ex: Relatório Diário de Backups"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="report_type" className="text-sm font-medium">Template de Mensagem *</Label>
                  {activeTemplates.length === 0 && (
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
                <Select value={formData.report_type} onValueChange={(value) => setFormData({...formData, report_type: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTemplates.length === 0 ? (
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
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-xs text-gray-500">{template.subject}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {template.template_type}
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                
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
                
                {activeTemplates.length === 0 && (
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
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value.replace(/\D/g, '')})}
                  className="w-full"
                  maxLength={13}
                />
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
            </div>

            {/* Coluna Direita - Configuração de Horário */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-4 block">Configuração de Horário *</Label>
                <AdvancedCronBuilder
                  value={formData.cron_expression}
                  onChange={(cronExpression) => setFormData({...formData, cron_expression: cronExpression})}
                />
              </div>
            </div>
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
              disabled={isLoading || activeTemplates.length === 0}
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
                Preview do Template
              </DialogTitle>
              <DialogDescription>
                Visualização do template que será usado no agendamento
              </DialogDescription>
            </DialogHeader>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    {selectedTemplate.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardDescription>
                  Tipo: {selectedTemplate.template_type}
                </CardDescription>
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
