import { useToast } from "@/hooks/use-toast";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from "@/hooks/useIntegrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Loader2, TestTube, CheckCircle, XCircle, AlertTriangle, Activity, Network, Shield, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateWazuhConnection, runWazuhDiagnostics, WazuhValidationResult } from "@/hooks/useWazuhValidation";

const WazuhAdminConfig = () => {
  const { toast } = useToast();
  const { data: integrations, refetch } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  
  const wazuhIntegration = integrations?.find(int => int.type === 'wazuh');

  const [formData, setFormData] = useState({
    name: wazuhIntegration?.name || 'Wazuh Principal',
    base_url: wazuhIntegration?.base_url || '',
    username: wazuhIntegration?.username || '',
    password: wazuhIntegration?.password || '',
    is_active: wazuhIntegration?.is_active ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    if (wazuhIntegration) {
      setFormData({
        name: wazuhIntegration.name || 'Wazuh Principal',
        base_url: wazuhIntegration.base_url || '',
        username: wazuhIntegration.username || '',
        password: wazuhIntegration.password || '',
        is_active: wazuhIntegration.is_active ?? true,
      });
    }
  }, [wazuhIntegration]);

  const saveConfiguration = async () => {
    const integrationData = {
      type: 'wazuh' as const,
      name: formData.name,
      base_url: formData.base_url.replace(/\/$/, ''),
      username: formData.username,
      password: formData.password,
      is_active: formData.is_active,
    };

    if (wazuhIntegration) {
      return await updateIntegration.mutateAsync({
        id: wazuhIntegration.id,
        updates: integrationData
      });
    } else {
      return await createIntegration.mutateAsync(integrationData);
    }
  };

  const testConnection = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // First save the configuration to get an integration ID
      const savedIntegration = await saveConfiguration();
      if (!savedIntegration?.id) {
        throw new Error("Falha ao salvar configuração para teste");
      }

      // Test the connection using the validation hook
      const result = await validateWazuhConnection(
        formData.base_url,
        formData.username,
        formData.password,
        savedIntegration.id
      );

      if (result.isValid) {
        setTestResult({
          success: true,
          message: "Conexão realizada com sucesso!",
          details: "Wazuh respondeu corretamente"
        });

        toast({
          title: "Teste realizado com sucesso",
          description: "A conexão com o Wazuh foi estabelecida.",
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Falha na conexão",
          details: result.details || "Erro desconhecido na comunicação"
        });

        toast({
          title: "Erro na conexão",
          description: result.error || "Falha ao conectar com o Wazuh.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Wazuh connection test failed:', error);
      setTestResult({
        success: false,
        message: "Falha na conexão",
        details: error.message || "Erro desconhecido na comunicação"
      });

      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com o Wazuh.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostics = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de executar diagnósticos.",
        variant: "destructive",
      });
      return;
    }

    setIsDiagnosing(true);
    setDiagnostics(null);

    try {
      // First save the configuration to get an integration ID
      const savedIntegration = await saveConfiguration();
      if (!savedIntegration?.id) {
        throw new Error("Falha ao salvar configuração para diagnósticos");
      }

      // Run diagnostics
      const result = await runWazuhDiagnostics(
        formData.base_url,
        formData.username,
        formData.password,
        savedIntegration.id
      );

      if (result.diagnostics) {
        setDiagnostics(result.diagnostics);
        
        toast({
          title: "Diagnósticos executados",
          description: `${result.diagnostics.summary?.totalTests || 0} testes realizados`,
        });
      } else {
        toast({
          title: "Erro nos diagnósticos",
          description: result.error || "Falha ao executar diagnósticos",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Wazuh diagnostics failed:', error);
      toast({
        title: "Erro nos diagnósticos",
        description: error.message || "Falha ao executar diagnósticos.",
        variant: "destructive",
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await saveConfiguration();
      
      toast({
        title: "Configuração salva!",
        description: "As configurações do Wazuh foram salvas com sucesso.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error saving Wazuh configuration:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Configuração Wazuh</CardTitle>
              <CardDescription>
                Configure a integração com o Wazuh SIEM para monitoramento de segurança
              </CardDescription>
            </div>
          </div>
          {wazuhIntegration && (
            <Badge variant={wazuhIntegration.is_active ? "default" : "secondary"}>
              {wazuhIntegration.is_active ? "Ativo" : "Inativo"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Integração</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Wazuh Principal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url">URL do Wazuh *</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://wazuh.empresa.com:55000"
            />
            <p className="text-xs text-muted-foreground">
              URL completa incluindo porta (será testada automaticamente em múltiplas portas)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Usuário *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="wazuh-user"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Integração ativa</Label>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading || isDiagnosing}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuração"
            )}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={isLoading || isDiagnosing}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
            <Button
              onClick={runDiagnostics}
              disabled={isLoading || isDiagnosing}
              variant="outline"
              className="flex-1"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Diagnósticos
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className="ml-2">
                  <div className="font-medium">{testResult.message}</div>
                  {testResult.details && (
                    <div className="text-sm text-gray-600 mt-1">
                      {testResult.details}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {diagnostics && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Activity className="h-5 w-5" />
                  Relatório de Diagnósticos
                </CardTitle>
                <CardDescription>
                  Executado em {new Date(diagnostics.diagnostics.timestamp).toLocaleString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Resumo dos Testes</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {diagnostics.summary.passedTests}/{diagnostics.summary.totalTests} aprovados
                      </Badge>
                      {diagnostics.summary.hasConnectivity ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectividade OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Sem conectividade
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">URLs Testadas</Label>
                    <div className="text-sm text-gray-600">
                      {diagnostics.diagnostics.baseUrls.length} URL(s) diferentes
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Resultados Detalhados</Label>
                  {diagnostics.diagnostics.tests.map((test: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                      <div className="flex-shrink-0 mt-0.5">
                        {test.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : test.success === false ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{test.name}</span>
                          {test.url && (
                            <Badge variant="outline" className="text-xs">
                              {new URL(test.url).hostname}
                            </Badge>
                          )}
                          {test.status && (
                            <Badge variant={test.success ? "secondary" : "destructive"} className="text-xs">
                              {test.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {test.details || test.error}
                        </div>
                        {test.hostname && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Shield className="w-3 h-3" />
                            SSL: {test.hostname}:{test.port}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {diagnostics.summary.recommendations && diagnostics.summary.recommendations.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Recomendações
                      </Label>
                      <div className="space-y-1">
                        {diagnostics.summary.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-sm text-gray-700 bg-amber-50 p-2 rounded border border-amber-200">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WazuhAdminConfig;