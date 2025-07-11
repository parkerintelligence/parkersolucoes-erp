import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTestScheduledReport } from '@/hooks/useScheduledReports';
import { toast } from 'sonner';
import { PlayCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const BaculaReportTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const testReportMutation = useTestScheduledReport();

  const handleTestBaculaReport = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 Testando relatório diário do Bacula...');
      
      // ID fixo do agendamento padrão do Bacula
      const baculaReportId = 'bf1005ec-7c62-4b43-bb7f-b663f81d2cbb';
      
      await testReportMutation.mutateAsync(baculaReportId);
      
      toast.success('✅ Teste do relatório Bacula enviado com sucesso!', {
        description: 'Verifique seu WhatsApp para confirmar o recebimento da mensagem.',
      });
    } catch (error: any) {
      console.error('❌ Erro ao testar relatório Bacula:', error);
      toast.error('❌ Erro ao testar relatório', {
        description: error.message || 'Falha ao enviar teste do relatório Bacula.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-500" />
          Teste do Relatório Diário Bacula
        </CardTitle>
        <CardDescription>
          Teste o envio manual do relatório diário de erros do Bacula
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este teste enviará um relatório das últimas 24 horas com dados reais do Bacula (se configurado) 
            ou dados simulados para demonstração.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Agendamento automático: todos os dias às 8:00 AM</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>Template: Relatório Diário de Erros Bacula</span>
          </div>
        </div>

        <Button 
          onClick={handleTestBaculaReport}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Enviando teste...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              Testar Relatório Agora
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md">
          <strong>Como funciona:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Busca integração Bacula ativa do usuário</li>
            <li>Coleta dados dos jobs das últimas 24 horas</li>
            <li>Filtra jobs com status Error ou Fatal</li>
            <li>Envia relatório via WhatsApp usando Evolution API</li>
            <li>Registra log de execução para auditoria</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};