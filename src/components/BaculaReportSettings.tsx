import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, MessageSquare, Save, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BaculaReportTemplate {
  id: string;
  name: string;
  description: string;
  cron_expression: string;
  phone_number: string;
  report_type: string;
  settings: {
    include_successful?: boolean;
    include_errors_only?: boolean;
    custom_message?: string;
  };
  is_active: boolean;
  next_execution: string | null;
  last_execution: string | null;
}

export const BaculaReportSettings = () => {
  const [reportSettings, setReportSettings] = useState<Partial<BaculaReportTemplate>>({
    name: 'Relatório Diário de Erros Bacula',
    description: 'Relatório automático dos backups com erro do dia anterior',
    cron_expression: '0 8 * * *', // 8h da manhã todos os dias
    phone_number: '',
    report_type: 'bacula_daily_errors',
    settings: {
      include_successful: false,
      include_errors_only: true,
      custom_message: ''
    },
    is_active: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingReport, setExistingReport] = useState<BaculaReportTemplate | null>(null);
  const { toast } = useToast();

  // Carregar configuração existente
  useEffect(() => {
    loadExistingReport();
  }, []);

  const loadExistingReport = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('report_type', 'bacula_daily_errors')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const report = data[0];
        setExistingReport(report as any);
        setReportSettings({
          id: report.id,
          name: report.name,
          description: 'Relatório automático dos backups com erro do dia anterior',
          cron_expression: report.cron_expression,
          phone_number: report.phone_number,
          report_type: report.report_type,
          is_active: report.is_active,
          next_execution: report.next_execution,
          last_execution: report.last_execution,
          settings: (report.settings as any) || {
            include_successful: false,
            include_errors_only: true,
            custom_message: ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading existing report:', error);
    }
  };

  const handleSave = async () => {
    if (!reportSettings.phone_number) {
      toast({
        title: "Erro",
        description: "Por favor, informe o número do WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const reportData = {
        name: reportSettings.name!,
        cron_expression: reportSettings.cron_expression!,
        phone_number: reportSettings.phone_number!,
        report_type: 'bacula_daily_errors',
        settings: reportSettings.settings as any,
        is_active: reportSettings.is_active!,
        user_id: userData.user.id
      };

      let result;
      if (existingReport) {
        // Atualizar existente (remover user_id do update)
        const { user_id, ...updateData } = reportData;
        result = await supabase
          .from('scheduled_reports')
          .update(updateData)
          .eq('id', existingReport.id);
      } else {
        // Criar novo
        result = await supabase
          .from('scheduled_reports')
          .insert([reportData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso",
        description: existingReport ? "Relatório atualizado com sucesso!" : "Relatório criado com sucesso!",
      });

      // Recarregar dados
      await loadExistingReport();

    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar o relatório",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestReport = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-bacula-daily-report');

      if (error) throw error;

      toast({
        title: "Teste executado",
        description: "Relatório de teste enviado. Verifique seu WhatsApp.",
      });

    } catch (error) {
      console.error('Error testing report:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar teste do relatório",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cronToDescription = (cron: string) => {
    const cronMap: { [key: string]: string } = {
      '0 8 * * *': 'Diariamente às 8:00',
      '0 9 * * *': 'Diariamente às 9:00',
      '0 7 * * *': 'Diariamente às 7:00',
      '0 8 * * 1-5': 'Dias úteis às 8:00',
      '0 10 * * *': 'Diariamente às 10:00'
    };
    
    return cronMap[cron] || 'Personalizado';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Relatório Diário de Erros do Bacula
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure o envio automático de relatórios sobre backups com erro via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status do relatório */}
          {existingReport && (
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Status do Relatório</span>
                <Badge className={existingReport.is_active ? "bg-green-900/20 text-green-400 border-green-600" : "bg-red-900/20 text-red-400 border-red-600"}>
                  {existingReport.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Próxima execução:</span>
                  <br />
                  <span className="text-slate-300">
                    {existingReport.next_execution 
                      ? new Date(existingReport.next_execution).toLocaleString('pt-BR')
                      : 'Não agendado'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Última execução:</span>
                  <br />
                  <span className="text-slate-300">
                    {existingReport.last_execution 
                      ? new Date(existingReport.last_execution).toLocaleString('pt-BR')
                      : 'Nunca executado'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Configurações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Número do WhatsApp</Label>
              <Input
                id="phone"
                placeholder="5511999999999"
                value={reportSettings.phone_number || ''}
                onChange={(e) => setReportSettings(prev => ({ ...prev, phone_number: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule" className="text-slate-300">Horário de Envio</Label>
              <Select
                value={reportSettings.cron_expression}
                onValueChange={(value) => setReportSettings(prev => ({ ...prev, cron_expression: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="0 7 * * *" className="text-white">7:00 - Diariamente</SelectItem>
                  <SelectItem value="0 8 * * *" className="text-white">8:00 - Diariamente</SelectItem>
                  <SelectItem value="0 9 * * *" className="text-white">9:00 - Diariamente</SelectItem>
                  <SelectItem value="0 10 * * *" className="text-white">10:00 - Diariamente</SelectItem>
                  <SelectItem value="0 8 * * 1-5" className="text-white">8:00 - Apenas dias úteis</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                {cronToDescription(reportSettings.cron_expression || '')}
              </p>
            </div>
          </div>

          {/* Configurações avançadas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Configurações do Relatório</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="errors-only" className="text-slate-300">Apenas erros</Label>
                <p className="text-xs text-slate-400">Incluir somente jobs que falharam</p>
              </div>
              <Switch
                id="errors-only"
                checked={reportSettings.settings?.include_errors_only || false}
                onCheckedChange={(checked) => 
                  setReportSettings(prev => ({
                    ...prev,
                    settings: { ...prev.settings, include_errors_only: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active" className="text-slate-300">Relatório ativo</Label>
                <p className="text-xs text-slate-400">Ativar/desativar envio automático</p>
              </div>
              <Switch
                id="active"
                checked={reportSettings.is_active || false}
                onCheckedChange={(checked) => 
                  setReportSettings(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          {/* Mensagem personalizada */}
          <div className="space-y-2">
            <Label htmlFor="custom-message" className="text-slate-300">Mensagem adicional (opcional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Mensagem personalizada para incluir no relatório..."
              value={reportSettings.settings?.custom_message || ''}
              onChange={(e) => 
                setReportSettings(prev => ({
                  ...prev,
                  settings: { ...prev.settings, custom_message: e.target.value }
                }))
              }
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : (existingReport ? 'Atualizar' : 'Criar Relatório')}
            </Button>
            
            <Button 
              onClick={handleTestReport}
              disabled={isLoading || !reportSettings.phone_number}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Testando...' : 'Testar Agora'}
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-400 font-medium mb-1">Importante:</p>
                <ul className="text-amber-300 space-y-1 text-xs">
                  <li>• O relatório será enviado automaticamente no horário configurado</li>
                  <li>• Apenas jobs com status de erro (E) ou falha fatal (f) serão incluídos</li>
                  <li>• É necessário ter uma integração ativa do WhatsApp (Evolution API)</li>
                  <li>• O relatório abrange apenas o dia anterior à execução</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};