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
  Activity,
  Trash2,
  Edit,
  TestTube,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    api_token: '',
    is_active: true
  });

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi') || [];

  const resetForm = () => {
    setFormData({
      name: '',
      api_token: '',
      is_active: true
    });
    setIsCreating(false);
    setEditingIntegration(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.api_token.trim()) {
      toast({
        title: "Erro",
        description: "O API Token é obrigatório para conectar à UniFi Site Manager API.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const integrationData = {
        type: 'unifi',
        name: formData.name,
        api_token: formData.api_token,
        is_active: formData.is_active,
        // Limpar campos desnecessários para Site Manager API
        base_url: null,
        username: null,
        password: null,
        port: null,
        use_ssl: null
      };

      if (editingIntegration) {
        await updateIntegration.mutateAsync({
          id: editingIntegration.id,
          updates: integrationData
        });
        toast({
          title: "Integração atualizada",
          description: "Configuração UniFi Site Manager API atualizada com sucesso.",
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
        toast({
          title: "Integração criada",
          description: "Nova integração UniFi Site Manager API criada com sucesso.",
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
      api_token: integration.api_token || '',
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
      const response = await supabase.functions.invoke('unifi-proxy', {
        body: {
          integrationId: integration.id,
          endpoint: '/ea/hosts',
          method: 'GET'
        }
      });

      const { data, error } = response;
      
      if (error) {
        throw new Error(error.message || 'Falha na conexão');
      }

      toast({
        title: "Conexão bem-sucedida",
        description: "Conexão com a UniFi Site Manager API estabelecida com sucesso.",
      });
    } catch (error) {
      let errorMessage = "Não foi possível conectar com a UniFi Site Manager API.";
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = "Token de API inválido ou expirado. Verifique o token na configuração.";
        } else if (error.message.includes('Token inválido')) {
          errorMessage = "Token de API inválido ou expirado. Gere um novo token em unifi.ui.com";
        }
      }
      
      toast({
        title: "Erro na conexão",
        description: errorMessage,
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
              <CardTitle className="text-white">Integração UniFi Site Manager API</CardTitle>
              <CardDescription className="text-slate-400">
                Configure o acesso à UniFi Site Manager API para gerenciar suas controladoras na nuvem.
                Utilize apenas o API Token gerado no portal UniFi.
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
                              <p className="text-slate-400 text-sm">UniFi Site Manager API</p>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Alert className="border-blue-500 bg-blue-500/10">
                    <Wifi className="h-4 w-4" />
                    <AlertDescription className="text-white">
                      <strong>🚀 UniFi Site Manager API</strong><br />
                      Conecte-se à sua controladora UniFi através da API oficial na nuvem.<br />
                      Gere seu API Token em: <a href="https://unifi.ui.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                        unifi.ui.com <ExternalLink className="h-3 w-3" />
                      </a> → Account → API
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="name" className="text-white">Nome da Integração</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: UniFi Principal"
                      required
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="api_token" className="text-white">API Token</Label>
                    <Input
                      id="api_token"
                      type="password"
                      value={formData.api_token}
                      onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                      placeholder="Cole aqui o token gerado no portal UniFi"
                      required
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Token de acesso à API da UniFi. Mantenha seguro e não compartilhe.
                    </p>
                  </div>

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