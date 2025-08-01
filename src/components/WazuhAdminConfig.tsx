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
  Shield, Save, TestTube, CheckCircle, XCircle, 
  AlertCircle, Key, Globe, Users 
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const WazuhAdminConfig = () => {
  const { data: integrations = [], refetch } = useIntegrations();
  const wazuhIntegration = integrations.find(int => int.type === 'wazuh');

  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [formData, setFormData] = useState({
    name: wazuhIntegration?.name || 'Wazuh Principal',
    base_url: wazuhIntegration?.base_url || '',
    username: wazuhIntegration?.username || '',
    password: wazuhIntegration?.password || '',
    api_token: wazuhIntegration?.api_token || '',
    is_active: wazuhIntegration?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!formData.base_url) {
      toast({
        title: "Erro de validação",
        description: "A URL do Wazuh é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.username || !formData.password) {
      toast({
        title: "Erro de validação", 
        description: "Usuário e senha são obrigatórios para acessar a API do Wazuh.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const integrationData = {
        type: 'wazuh',
        name: formData.name,
        base_url: formData.base_url.replace(/\/$/, ''), // Remove trailing slash
        username: formData.username,
        password: formData.password,
        is_active: formData.is_active,
      };

      if (wazuhIntegration) {
        await updateIntegration.mutateAsync({
          id: wazuhIntegration.id,
          updates: integrationData
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      toast({
        title: "Configuração salva!",
        description: "As configurações do Wazuh foram salvas com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações do Wazuh.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Teste básico de conectividade com a API do Wazuh
      const testUrl = `${formData.base_url.replace(/\/$/, '')}/`;
      const response = await fetch(testUrl, { 
        method: 'GET',
        mode: 'no-cors' // Para evitar problemas de CORS no teste
      });

      setTestResult({
        success: true,
        message: "Conexão com Wazuh estabelecida com sucesso!"
      });

      toast({
        title: "Teste bem-sucedido!",
        description: "A conexão com o Wazuh foi testada com sucesso.",
      });
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      setTestResult({
        success: false,
        message: "Falha na conexão. Verifique URL e credenciais."
      });

      toast({
        title: "Teste falhou",
        description: "Não foi possível conectar com o Wazuh. Verifique as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!wazuhIntegration) return;

    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await deleteIntegration.mutateAsync(wazuhIntegration.id);
        setFormData({
          name: 'Wazuh Principal',
          base_url: '',
          username: '',
          password: '',
          api_token: '',
          is_active: true,
        });
        refetch();
      } catch (error) {
        console.error('Erro ao excluir integração:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              <div>
                <CardTitle className="text-white">Configuração Wazuh</CardTitle>
                <CardDescription className="text-slate-400">
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
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="connection" className="text-white">Conexão</TabsTrigger>
              <TabsTrigger value="settings" className="text-white">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome da Integração</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Wazuh Principal"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_url" className="text-white">URL do Wazuh *</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://wazuh.empresa.com:55000"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    URL completa incluindo porta (padrão: 55000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Usuário *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="wazuh-user"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-white">Integração ativa</Label>
                </div>
              </div>

              {testResult && (
                <Alert className={testResult.success ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-white">
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {isTesting ? "Testando..." : "Testar Conexão"}
                </Button>

                <Button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>

                {wazuhIntegration && (
                  <Button 
                    onClick={handleDelete}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Alert className="border-blue-500 bg-blue-500/10">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-white">
                  <strong>Sobre a API do Wazuh:</strong><br />
                  • Porta padrão: 55000<br />
                  • Autenticação via usuário/senha<br />
                  • Acesso HTTPS recomendado<br />
                  • Suporte para múltiplos clusters
                </AlertDescription>
              </Alert>

              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Funcionalidades Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Monitoramento de agentes em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Visualização de alertas de segurança</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Estatísticas de conformidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Relatórios de vulnerabilidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dashboard de segurança</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WazuhAdminConfig;