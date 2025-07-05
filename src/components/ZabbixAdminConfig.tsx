import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, Save, TestTube, CheckCircle, XCircle, 
  AlertCircle, Key, Globe, Shield 
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { validateZabbixConnection } from '@/hooks/useZabbixValidation';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ZabbixAdminConfig = () => {
  const { data: integrations = [], refetch } = useIntegrations();
  const zabbixIntegration = integrations.find(int => int.type === 'zabbix');

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [formData, setFormData] = useState({
    name: zabbixIntegration?.name || 'Zabbix Principal',
    base_url: zabbixIntegration?.base_url || '',
    username: zabbixIntegration?.username || '',
    password: zabbixIntegration?.password || '',
    api_token: zabbixIntegration?.api_token || '',
    is_active: zabbixIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!formData.base_url) {
      toast({
        title: "Erro de validação",
        description: "A URL do Zabbix é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.api_token && (!formData.username || !formData.password)) {
      toast({
        title: "Erro de validação", 
        description: "Forneça um API Token ou usuário e senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationData = {
        name: formData.name,
        type: 'zabbix',
        base_url: formData.base_url,
        username: formData.username || null,
        password: formData.password || null,
        api_token: formData.api_token || null,
        is_active: formData.is_active,
      };

      const { data, error } = zabbixIntegration
        ? await supabase
            .from('integrations')
            .update(integrationData)
            .eq('id', zabbixIntegration.id)
            .select()
            .single()
        : await supabase
            .from('integrations')
            .insert(integrationData)
            .select()
            .single();

      if (error) throw error;

      await refetch();
      setTestResult(null);
      
      toast({
        title: "Configuração salva!",
        description: "A integração do Zabbix foi configurada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!formData.base_url) {
      toast({
        title: "Erro de validação",
        description: "A URL do Zabbix é obrigatória para testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await validateZabbixConnection(
        formData.base_url,
        formData.username || undefined,
        formData.password || undefined,
        formData.api_token || undefined
      );

      setTestResult(result);

      if (result.isValid) {
        toast({
          title: "Conexão bem-sucedida!",
          description: "A conexão com o Zabbix foi estabelecida com sucesso.",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.error || "Não foi possível conectar ao Zabbix.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorResult = {
        isValid: false,
        error: 'Erro interno de teste',
        details: error.message || 'Erro desconhecido durante o teste'
      };
      setTestResult(errorResult);
      
      toast({
        title: "Erro no teste",
        description: error.message || "Ocorreu um erro durante o teste de conexão.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-red-100 p-2 rounded-lg">
          <Monitor className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configuração do Zabbix</h3>
          <p className="text-sm text-muted-foreground">
            Configure a integração com o servidor Zabbix para monitoramento
          </p>
        </div>
        {zabbixIntegration && (
          <Badge variant={zabbixIntegration.is_active ? "default" : "secondary"}>
            {zabbixIntegration.is_active ? "Ativo" : "Inativo"}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="test">Teste de Conexão</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações Básicas
              </CardTitle>
              <CardDescription>
                Configure os parâmetros de conexão com o servidor Zabbix
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Integração</Label>
                <Input
                  id="name"
                  placeholder="Ex: Zabbix Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="base_url">URL do Zabbix *</Label>
                <Input
                  id="base_url"
                  placeholder="https://zabbix.exemplo.com"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  URL completa do servidor Zabbix (será automaticamente complementada com /api_jsonrpc.php)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Integração Ativa</Label>
                  <p className="text-xs text-muted-foreground">
                    Ativar ou desativar esta integração
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticação
              </CardTitle>
              <CardDescription>
                Configure as credenciais de acesso. Use API Token (recomendado) ou usuário/senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="api_token">API Token (Recomendado)</Label>
                <Input
                  id="api_token"
                  type="password"
                  placeholder="Token de API do Zabbix"
                  value={formData.api_token}
                  onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  API Token criado no Zabbix (mais seguro que usuário/senha)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Ou use credenciais de usuário (alternativa ao API Token):
                </p>
                
                <div className="grid gap-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    placeholder="Nome de usuário do Zabbix"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha do usuário"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={isTesting}>
              <TestTube className="mr-2 h-4 w-4" />
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Teste de Conexão
              </CardTitle>
              <CardDescription>
                Verifique se as configurações estão corretas testando a conexão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResult && (
                <Alert className={testResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex">
                    {testResult.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div className="ml-3">
                      <h4 className={`text-sm font-medium ${testResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.isValid ? 'Conexão Bem-sucedida' : 'Falha na Conexão'}
                      </h4>
                      <AlertDescription className={testResult.isValid ? 'text-green-700' : 'text-red-700'}>
                        {testResult.isValid ? (
                          'A conexão com o Zabbix foi estabelecida com sucesso!'
                        ) : (
                          <div>
                            <p><strong>Erro:</strong> {testResult.error}</p>
                            {testResult.details && (
                              <div className="mt-2">
                                <p><strong>Detalhes:</strong></p>
                                <pre className="text-xs mt-1 whitespace-pre-wrap">{testResult.details}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>URL sendo testada:</strong> {formData.base_url || 'Não configurada'}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Método de autenticação:</strong> {
                    formData.api_token ? 'API Token' : 
                    (formData.username && formData.password) ? 'Usuário/Senha' : 
                    'Não configurado'
                  }
                </p>
              </div>

              <Button onClick={handleTest} disabled={isTesting || !formData.base_url}>
                <TestTube className="mr-2 h-4 w-4" />
                {isTesting ? 'Testando Conexão...' : 'Executar Teste'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ZabbixAdminConfig;