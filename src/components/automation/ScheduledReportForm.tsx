
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { 
  useCreateScheduledReport, 
  useUpdateScheduledReport, 
  ScheduledReport 
} from '@/hooks/useScheduledReports';

interface ScheduledReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingReport: ScheduledReport | null;
  onSuccess: () => void;
}

const reportTypes = {
  backup_alert: { 
    name: 'Alerta de Backups', 
    description: 'Relatório de backups desatualizados'
  },
  schedule_critical: { 
    name: 'Vencimentos Críticos', 
    description: 'Itens da agenda com vencimento próximo'
  },
  glpi_summary: { 
    name: 'Resumo GLPI', 
    description: 'Chamados abertos no GLPI'
  }
};

const cronPresets = [
  { label: '6:00 - Todo dia', value: '0 6 * * *' },
  { label: '9:00 - Todo dia', value: '0 9 * * *' },
  { label: '12:00 - Todo dia', value: '0 12 * * *' },
  { label: '18:00 - Todo dia', value: '0 18 * * *' },
  { label: '8:00 - Segunda a Sexta', value: '0 8 * * 1-5' },
  { label: '9:00 - Segunda a Sexta', value: '0 9 * * 1-5' },
];

export const ScheduledReportForm = ({ open, onOpenChange, editingReport, onSuccess }: ScheduledReportFormProps) => {
  const { data: templates = [] } = useWhatsAppTemplates();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();

  const [formData, setFormData] = useState({
    name: editingReport?.name || '',
    report_type: editingReport?.report_type || 'backup_alert' as const,
    phone_number: editingReport?.phone_number || '',
    cron_expression: editingReport?.cron_expression || '0 9 * * *',
    is_active: editingReport?.is_active ?? true,
    settings: editingReport?.settings || {}
  });

  // Buscar templates ativos disponíveis
  const availableReportTypes = useMemo(() => {
    const activeTemplates = templates.filter(template => template.is_active);
    
    return activeTemplates.map(template => ({
      value: template.template_type,
      name: template.name,
      description: `Template: ${template.name}`,
      template: template
    }));
  }, [templates]);

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
      const firstAvailableTemplate = availableReportTypes[0];
      setFormData({
        name: '',
        report_type: firstAvailableTemplate?.value || 'backup_alert',
        phone_number: '',
        cron_expression: '0 9 * * *',
        is_active: true,
        settings: {}
      });
    }
  }, [editingReport, availableReportTypes]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone_number.trim() || !formData.cron_expression.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, telefone e horário.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se existe template ativo para o tipo selecionado
    const selectedTemplate = availableReportTypes.find(type => type.value === formData.report_type);
    if (!selectedTemplate) {
      toast({
        title: "Template não encontrado",
        description: "Não há template ativo para o tipo de relatório selecionado.",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingReport ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            Configure um relatório automático para ser enviado via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
            <Label htmlFor="report_type" className="text-sm font-medium">Tipo de Relatório *</Label>
            <Select value={formData.report_type} onValueChange={(value: any) => setFormData({...formData, report_type: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                {availableReportTypes.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>Nenhum template ativo encontrado.</p>
                    <p className="text-xs mt-1">Crie templates na aba "Templates" primeiro.</p>
                  </div>
                ) : (
                  availableReportTypes.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      <div className="flex flex-col">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                        <div className="text-xs text-blue-600">
                          Tipo: {reportTypes[template.value as keyof typeof reportTypes]?.name || template.value}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableReportTypes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Configure templates ativos na aba "Templates" para criar agendamentos.
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

          <div className="space-y-2">
            <Label htmlFor="cron_expression" className="text-sm font-medium">Horário de Envio *</Label>
            <Select value={formData.cron_expression} onValueChange={(value) => setFormData({...formData, cron_expression: value})}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cronPresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || availableReportTypes.length === 0}
            className="min-w-24"
          >
            {isLoading ? 'Salvando...' : editingReport ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
