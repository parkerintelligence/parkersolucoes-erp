
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Webhook, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const ZabbixWebhookTester = () => {
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const [testData, setTestData] = useState({
    problem_name: 'Teste de problema do Zabbix',
    host_name: 'servidor-teste',
    severity: '4',
    eventid: '12345',
    triggerid: '67890',
    status: '1',
    trigger_type: 'problem_created', // Adicionado para coincidir com webhooks configurados
    timestamp: new Date().toISOString()
  });

  const webhookUrl = `https://mpvxppgoyadedukkfoccs.supabase.co/functions/v1/zabbix-webhook`;

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);

    try {
      console.log('🔥 Testando webhook com dados:', testData);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testData,
          timestamp: new Date().toISOString(),
          // Determinar trigger_type baseado no status
          trigger_type: testData.status === '0' ? 'problem_resolved' : 'problem_created'
        })
      });

      const result = await response.json();
      setTestResult({ success: response.ok, data: result, status: response.status });

      if (response.ok) {
        toast({
          title: "✅ Webhook testado com sucesso!",
          description: `${result.processed_webhooks || 0} webhook(s) processado(s)`,
        });
      } else {
        toast({
          title: "❌ Erro no teste do webhook",
          description: result.error || 'Erro desconhecido',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      setTestResult({ success: false, error: error.message });
      toast({
        title: "❌ Erro de conexão",
        description: "Não foi possível conectar com o webhook",
        variant: "destructive"
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "📋 URL copiada!",
      description: "URL do webhook copiada para a área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Webhook className="h-5 w-5" />
            Configuração do Webhook Zabbix
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure o Zabbix para enviar webhooks para este endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-200">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              />
              <Button
                onClick={copyWebhookUrl}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-200 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <ExternalLink className="h-4 w-4" />
              <span className="font-medium">Configuração no Zabbix</span>
            </div>
            <div className="text-sm text-blue-300 space-y-1">
              <p>1. Vá em Administration → Media types → Create media type</p>
              <p>2. Type: Webhook</p>
              <p>3. Name: Webhook Automação</p>
              <p>4. Script name: webhook.js (ou similar)</p>
              <p>5. Parameters: Configure os parâmetros necessários</p>
              <p>6. URL: Use a URL acima</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TestTube className="h-5 w-5" />
            Testar Webhook
          </CardTitle>
          <CardDescription className="text-gray-400">
            Simule um webhook do Zabbix para testar a integração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-200">Nome do Problema</Label>
              <Input
                value={testData.problem_name}
                onChange={(e) => setTestData(prev => ({ ...prev, problem_name: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-200">Nome do Host</Label>
              <Input
                value={testData.host_name}
                onChange={(e) => setTestData(prev => ({ ...prev, host_name: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-200">Severidade</Label>
              <Input
                value={testData.severity}
                onChange={(e) => setTestData(prev => ({ ...prev, severity: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-200">Status (0=Resolvido, 1=Problema)</Label>
              <Input
                value={testData.status}
                onChange={(e) => setTestData(prev => ({ ...prev, status: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleTestWebhook}
            disabled={isTestingWebhook}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isTestingWebhook ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testando Webhook...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Testar Webhook
              </>
            )}
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-900/20 border-green-600' 
                : 'bg-red-900/20 border-red-600'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                <span className={`font-medium ${
                  testResult.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {testResult.success ? 'Teste bem-sucedido!' : 'Teste falhou'}
                </span>
                <Badge variant="outline" className="ml-auto">
                  Status: {testResult.status}
                </Badge>
              </div>
              
              <Textarea
                value={JSON.stringify(testResult.data || testResult, null, 2)}
                readOnly
                className="bg-gray-900 border-gray-600 text-white font-mono text-xs"
                rows={8}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
