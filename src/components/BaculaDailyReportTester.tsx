import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SafeTabs, SafeTabsContent, SafeTabsList, SafeTabsTrigger } from '@/components/SafeTabsWrapper';
import { 
  TestTube, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  Database,
  Activity,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestStep {
  step: string;
  status: 'success' | 'failed';
  message: string;
  details?: any;
  error?: string;
}

interface TestResults {
  timestamp: string;
  phone_number: string;
  steps: TestStep[];
  diagnostic: any;
  report_sent: boolean;
  success: boolean;
  summary?: {
    total_steps: number;
    successful_steps: number;
    success_rate: number;
    overall_status: string;
    critical_issues: string[];
  };
  recommendations?: string[];
}

export const BaculaDailyReportTester = () => {
  const [phoneNumber, setPhoneNumber] = React.useState('5534992284722');
  const [isLoading, setIsLoading] = React.useState(false);
  const [testResults, setTestResults] = React.useState<TestResults | null>(null);
  const [runDiagnostic, setRunDiagnostic] = React.useState(true);
  const [sendReport, setSendReport] = React.useState(true);

  const handleTest = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, insira um número de telefone válido');
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      console.log('🧪 Iniciando teste do relatório diário Bacula...');
      
      const { data, error } = await supabase.functions.invoke('test-bacula-report', {
        body: {
          phone_number: phoneNumber,
          run_diagnostic: runDiagnostic,
          send_report: sendReport
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setTestResults(data);
      
      if (data.success) {
        toast.success(`Teste concluído com sucesso! ${data.summary?.success_rate}% dos passos executados.`);
      } else {
        toast.warning(`Teste concluído com problemas. ${data.summary?.critical_issues?.length || 0} falhas encontradas.`);
      }
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSendReport = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, insira um número de telefone válido');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📤 Enviando relatório diário Bacula...');
      
      const { data, error } = await supabase.functions.invoke('send-bacula-daily-report', {
        body: {
          phone_number: phoneNumber,
          test_mode: false
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Relatório diário enviado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast.error(`Erro ao enviar relatório: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStepName = (step: string) => {
    switch (step) {
      case 'diagnostic':
        return 'Diagnóstico do Sistema';
      case 'send_report':
        return 'Envio do Relatório';
      case 'proxy_test':
        return 'Teste do Proxy Bacula';
      case 'jobs_test':
        return 'Teste de Jobs';
      default:
        return step;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-400" />
            Teste do Relatório Diário Bacula
          </CardTitle>
          <CardDescription className="text-slate-400">
            Teste e envie relatórios diários com dados reais do sistema Bacula
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                <Phone className="h-4 w-4 inline mr-1" />
                Número do WhatsApp
              </label>
              <Input
                type="tel"
                placeholder="5534992284722"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Opções do Teste</label>
              <div className="flex gap-2">
                <Button
                  variant={runDiagnostic ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRunDiagnostic(!runDiagnostic)}
                  className="text-xs"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Diagnóstico
                </Button>
                <Button
                  variant={sendReport ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSendReport(!sendReport)}
                  className="text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Enviar Relatório
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Teste Completo
            </Button>
            <Button
              onClick={handleQuickSendReport}
              disabled={isLoading}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
            >
              {isLoading ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resultados do Teste
              <Badge className={testResults.success ? 'bg-green-900/20 border-green-600/30 text-green-400' : 'bg-red-900/20 border-red-600/30 text-red-400'}>
                {testResults.summary?.overall_status || (testResults.success ? 'SUCESSO' : 'FALHA')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SafeTabs defaultValue="summary" className="w-full">
              <SafeTabsList className="grid w-full grid-cols-3 bg-slate-700 border-slate-600">
                <SafeTabsTrigger value="summary" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  Resumo
                </SafeTabsTrigger>
                <SafeTabsTrigger value="steps" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  Passos Executados
                </SafeTabsTrigger>
                <SafeTabsTrigger value="diagnostic" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  Diagnóstico
                </SafeTabsTrigger>
              </SafeTabsList>

              <SafeTabsContent value="summary" className="space-y-4">
                {testResults.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {testResults.summary.success_rate}%
                        </div>
                        <div className="text-sm text-slate-300">Taxa de Sucesso</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {testResults.summary.successful_steps}
                        </div>
                        <div className="text-sm text-slate-300">Passos OK</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {testResults.summary.total_steps - testResults.summary.successful_steps}
                        </div>
                        <div className="text-sm text-slate-300">Falhas</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {testResults.report_sent ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-slate-300">Relatório Enviado</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {testResults.summary?.critical_issues && testResults.summary.critical_issues.length > 0 && (
                  <Alert className="bg-red-900/20 border-red-600/30">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">
                      <strong>Problemas encontrados:</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {testResults.summary.critical_issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {testResults.recommendations && testResults.recommendations.length > 0 && (
                  <Alert className="bg-yellow-900/20 border-yellow-600/30">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-yellow-400">
                      <strong>Recomendações:</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {testResults.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </SafeTabsContent>

              <SafeTabsContent value="steps" className="space-y-3">
                {testResults.steps.map((step, index) => (
                  <Card key={index} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStepIcon(step.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white">{getStepName(step.step)}</h4>
                            <Badge 
                              className={step.status === 'success' 
                                ? 'bg-green-900/20 border-green-600/30 text-green-400' 
                                : 'bg-red-900/20 border-red-600/30 text-red-400'
                              }
                            >
                              {step.status === 'success' ? 'SUCESSO' : 'FALHA'}
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm">{step.message}</p>
                          {step.details && (
                            <div className="mt-2 text-xs text-slate-400">
                              <pre className="bg-slate-800 p-2 rounded overflow-x-auto">
                                {JSON.stringify(step.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          {step.error && (
                            <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                              {step.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </SafeTabsContent>

              <SafeTabsContent value="diagnostic" className="space-y-3">
                {testResults.diagnostic ? (
                  <Card className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-white mb-3">Dados do Diagnóstico</h4>
                      <pre className="bg-slate-800 p-4 rounded text-slate-300 text-xs overflow-x-auto">
                        {JSON.stringify(testResults.diagnostic, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert className="bg-slate-700 border-slate-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-slate-300">
                      Diagnóstico não foi executado neste teste.
                    </AlertDescription>
                  </Alert>
                )}
              </SafeTabsContent>
            </SafeTabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};