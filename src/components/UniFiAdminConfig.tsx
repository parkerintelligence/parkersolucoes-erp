import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, 
  Server, 
  Users, 
  Activity,
  Plus,
  Trash2,
  Edit,
  TestTube,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { useToast } from '@/hooks/use-toast';

const UniFiAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    base_url: 'https://api.ui.com',
    api_token: '',
    username: '',
    password: '',
    port: 8443,
    use_ssl: true,
    is_active: true
  });

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi') || [];

  const resetForm = () => {
    setFormData({
      name: '',
      base_url: 'https://api.ui.com',
      api_token: '',
      username: '',
      password: '',
      port: 8443,
      use_ssl: true,
      is_active: true
    });
    setIsCreating(false);
    setEditingIntegration(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const integrationData = {
        type: 'unifi',
        name: formData.name,
        base_url: 'https://api.ui.com',
        api_token: formData.api_token,
        username: formData.username,
        password: formData.password,
        port: formData.port,
        use_ssl: formData.use_ssl,
        is_active: formData.is_active
      };

      if (editingIntegration) {
        await updateIntegration.mutateAsync({
          id: editingIntegration.id,
          updates: integrationData
        });
        toast({
          title: "Integração atualizada",
          description: "Configuração UniFi atualizada com sucesso.",
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
        toast({
          title: "Integração criada",
          description: "Nova integração UniFi criada com sucesso.",
        });
      }
      
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar a integração UniFi.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (integration: any) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      base_url: 'https://api.ui.com',
      api_token: integration.api_token || '',
      username: integration.username,
      password: integration.password,
      port: integration.port || 8443,
      use_ssl: integration.use_ssl ?? true,
      is_active: integration.is_active
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await deleteIntegration.mutateAsync(id);
        toast({
          title: "Integração excluída",
          description: "Integração UniFi excluída com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir a integração UniFi.",
          variant: "destructive",
        });
      }
    }
  };

  const testConnection = async (integration: any) => {
    setIsTesting(integration.id);
    try {
      // Teste via edge function usando API Site Manager
      const response = await fetch('/functions/v1/unifi-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: integration.id,
          endpoint: '/v1/hosts',
          method: 'GET'
        }),
      });

      if (response.ok) {
        toast({
          title: "Conexão bem-sucedida",
          description: "Conexão com a API Site Manager da UniFi estabelecida.",
        });
      } else {
        throw new Error('Falha na conexão');
      }
    } catch (error) {
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar com a API Site Manager da UniFi.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-blue-400" />
            <div>
              <CardTitle className="text-white">Integração UniFi</CardTitle>
              <CardDescription className="text-slate-400">
                Configure o acesso à API Site Manager da UniFi para gerenciamento centralizado de todos os seus sites.
                Utilize apenas o token da API oficial para máxima segurança e simplicidade.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="list" className="text-white">Integrações Ativas</TabsTrigger>
              <TabsTrigger value="new" className="text-white" onClick={() => setIsCreating(true)}>
                {isCreating ? (editingIntegration ? 'Editar' : 'Nova') : 'Nova'} Integração
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {unifiIntegrations.length === 0 ? (
                <Alert className="border-blue-500 bg-blue-500/10">
                  <Wifi className="h-4 w-4" />
                  <AlertDescription className="text-white">
                    Nenhuma integração UniFi configurada. Crie uma nova integração para começar.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {unifiIntegrations.map((integration) => (
                    <Card key={integration.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Server className="h-5 w-5 text-blue-400" />
                            <div>
                              <h3 className="text-white font-medium">{integration.name}</h3>
                              <p className="text-slate-400 text-sm">API Site Manager UniFi</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={integration.is_active ? "default" : "secondary"}>
                              {integration.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testConnection(integration)}
                              disabled={isTesting === integration.id}
                              className="border-slate-600 text-white hover:bg-slate-600"
                            >
                              {isTesting === integration.id ? (
                                <Activity className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(integration)}
                              className="border-slate-600 text-white hover:bg-slate-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(integration.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new">
              {isCreating && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Nome da Integração</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: UniFi Principal"
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                   <div>
                     <Label htmlFor="api_token" className="text-white">Token de Acesso da API UniFi *</Label>
                     <Input
                       id="api_token"
                       type="password"
                       value={formData.api_token}
                       onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                       placeholder="Seu token da API Site Manager"
                       required
                       className="bg-slate-700 border-slate-600 text-white"
                     />
                      <p className="text-xs text-slate-400 mt-1">
                        Token da API Site Manager da UniFi. Obrigatório para acessar a API oficial.
                        <br />
                        <a href="https://account.ui.com/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          Obtenha seu token na sua conta UniFi →
                        </a>
                      </p>
                   </div>

                   <Alert className="border-blue-500 bg-blue-500/10 mb-4">
                     <Wifi className="h-4 w-4" />
                     <AlertDescription className="text-white">
                       <strong>API Site Manager da UniFi:</strong><br />
                       • Acesso universal aos seus sites UniFi<br />
                       • Sem necessidade de configurar controllers locais<br />
                       • Gerenciamento centralizado via https://api.ui.com<br />
                       • Token obtido na sua conta UniFi oficial
                     </AlertDescription>
                   </Alert>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Integração Ativa</Label>
                      <p className="text-sm text-slate-400">Ativar esta integração</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit"
                      disabled={createIntegration.isPending || updateIntegration.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {editingIntegration ? 'Atualizar' : 'Criar'} Integração
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={resetForm}
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniFiAdminConfig;