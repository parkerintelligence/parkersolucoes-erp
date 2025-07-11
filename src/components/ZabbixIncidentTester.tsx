import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Zap
} from 'lucide-react';

export const ZabbixIncidentTester = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testBaculaIncident = async () => {
    setIsTesting(true);
    setLastTestResult(null);

    try {
      console.log('🧪 Testando webhook com dados do incidente Bacula...');

      // Dados simulados baseados no incidente real
      const incidentData = {
        problem_name: 'Port 4000 is down',
        host_name: 'bacula-server',
        severity: '4',
        eventid: `test_${Date.now()}`,
        triggerid: '12345',
        status: '1', // 1 = problema ativo
        timestamp: '2025-07-11 18:28:00'
      };

      console.log('📊 Dados do teste:', incidentData);

      // Chamar o webhook do Zabbix
      const { data, error } = await supabase.functions.invoke('zabbix-webhook', {
        body: incidentData
      });

      if (error) {
        console.error('❌ Erro no teste do webhook:', error);
        throw error;
      }

      console.log('✅ Resultado do teste:', data);
      setLastTestResult(data);

      toast({
        title: "Teste executado com sucesso",
        description: `Webhooks processados: ${data.processed_webhooks || 0}`,
      });

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setLastTestResult({ error: error.message });
      
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testHostDownIncident = async () => {
    setIsTesting(true);
    setLastTestResult(null);

    try {
      const incidentData = {
        problem_name: 'Bacula Director service is down',
        host_name: 'bacula-director',
        severity: '5',
        eventid: `test_host_${Date.now()}`,
        triggerid: '54321',
        status: '1',
        timestamp: new Date().toLocaleString('pt-BR')
      };

      const { data, error } = await supabase.functions.invoke('zabbix-webhook', {
        body: incidentData
      });

      if (error) throw error;

      setLastTestResult(data);
      toast({
        title: "Teste de host down executado",
        description: `Webhooks processados: ${data.processed_webhooks || 0}`,
      });

    } catch (error) {
      console.error('❌ Erro no teste de host down:', error);
      setLastTestResult({ error: error.message });
      
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Teste de Incidentes Bacula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testBaculaIncident}
              disabled={isTesting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar: Port 4000 Down
            </Button>

            <Button
              onClick={testHostDownIncident}
              disabled={isTesting}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Testar: Host Down
            </Button>
          </div>

          {lastTestResult && (
            <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-600">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                {lastTestResult.error ? (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                Resultado do Teste
              </h4>
              
              {lastTestResult.error ? (
                <div className="text-red-400 text-sm font-mono">
                  {lastTestResult.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-900/20 text-green-400 border-green-600">
                      Sucesso
                    </Badge>
                    <span className="text-slate-300 text-sm">
                      {lastTestResult.processed_webhooks} webhook(s) processado(s)
                    </span>
                  </div>
                  
                  {lastTestResult.results?.map((result: any, index: number) => (
                    <div key={index} className="bg-slate-800 p-3 rounded border border-slate-600">
                      <div className="text-white font-medium mb-2">
                        {result.webhook_name}
                      </div>
                      
                      {result.actions?.map((action: any, actionIndex: number) => (
                        <div key={actionIndex} className="flex items-center gap-2 text-sm">
                          {action.type === 'whatsapp_message' && (
                            <MessageSquare className="h-3 w-3 text-green-400" />
                          )}
                          <span className="text-slate-300">{action.type}:</span>
                          <Badge 
                            className={action.success 
                              ? "bg-green-900/20 text-green-400 border-green-600" 
                              : "bg-red-900/20 text-red-400 border-red-600"
                            }
                          >
                            {action.success ? 'Enviado' : 'Falhou'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>💡 Dica:</strong> Para o webhook funcionar automaticamente, configure no Zabbix:
            </p>
            <code className="text-blue-200 text-xs block mt-2 bg-blue-900/30 p-2 rounded">
              URL: https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/zabbix-webhook
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};