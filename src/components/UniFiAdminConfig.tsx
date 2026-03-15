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
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ConnectionMode = 'site_manager' | 'local_controller';

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
    connection_mode: 'site_manager' as ConnectionMode,
    api_token: '',
    base_url: '',
    username: '',
    password: '',
    use_ssl: true,
    is_active: true
  });

  const unifiIntegrations = integrations?.filter(int => int.type === 'unifi') || [];

  const normalizeBaseUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      connection_mode: 'site_manager',
      api_token: '',
      base_url: '',
      username: '',
      password: '',
      use_ssl: true,
      is_active: true
    });
    setIsCreating(false);
    setEditingIntegration(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const isSiteManager = formData.connection_mode === 'site_manager';

      if (isSiteManager && !formData.api_token.trim()) {
        toast({
          title: 'Erro',
          description: 'API Token é obrigatório para Site Manager.',
          variant: 'destructive',
        });
        return;
      }

      if (!isSiteManager && (!formData.base_url.trim() || !formData.username.trim() || !formData.password.trim())) {
        toast({
          title: 'Erro',
          description: 'URL, usuário e senha são obrigatórios para controladora local.',
          variant: 'destructive',
        });
        return;
      }

      const normalizedBaseUrl = normalizeBaseUrl(formData.base_url);

      const integrationData: any = {
        type: 'unifi',
        name: formData.name,
        port: 8443,
        is_active: formData.is_active,
        is_global: true
      };

      if (isSiteManager) {
        integrationData.api_token = formData.api_token.trim();
        integrationData.base_url = null;
        integrationData.username = null;
        integrationData.password = null;
        integrationData.use_ssl = true;
      } else {
        integrationData.base_url = normalizedBaseUrl;
        integrationData.username = formData.username.trim();
        integrationData.password = formData.password;
        integrationData.use_ssl = formData.use_ssl;
        integrationData.api_token = null;
      }

      if (editingIntegration) {
        await updateIntegration.mutateAsync({
          id: editingIntegration.id,
          updates: integrationData
        });
        toast({
          title: 'Integração atualizada',
          description: 'Configuração UniFi atualizada com sucesso.',
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
        toast({
          title: 'Integração criada',
          description: 'Nova integração UniFi criada com sucesso.',
        });
      }

      resetForm();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar a integração UniFi.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (integration: any) => {
    const isLocalController = !!(integration.base_url && integration.username);

    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      connection_mode: isLocalController ? 'local_controller' : 'site_manager',
      api_token: integration.api_token || '',
      base_url: integration.base_url || '',
      username: integration.username || '',
      password: integration.password || '',
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
          title: 'Integração excluída',
          description: 'Integração UniFi excluída com sucesso.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao excluir a integração UniFi.',
          variant: 'destructive',
        });
      }
    }
  };

  const testConnection = async (integration: any) => {
    setIsTesting(integration.id);

    try {
      const isLocalController = !!(integration.base_url && integration.username && integration.password);
      const endpoint = isLocalController ? '/api/self/sites' : '/v1/hosts';

      const response = await supabase.functions.invoke('unifi-proxy', {
        body: {
          integrationId: integration.id,
          endpoint,
          method: 'GET'
        }
      });

      const { error } = response;

      if (error) {
        throw new Error(error.message || 'Falha na conexão UniFi');
      }

      toast({
        title: 'Conexão bem-sucedida',
        description: isLocalController
          ? 'Controladora local conectada com sucesso.'
          : 'Token válido! Conexão com Site Manager API estabelecida.',
      });
    } catch (error) {
      toast({
        title: 'Erro na conexão',
        description: error instanceof Error
          ? error.message
          : 'Falha na conexão UniFi. Verifique suas credenciais.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(null);
    }
  };

  const isSiteManager = formData.connection_mode === 'site_manager';
  const submitDisabled = createIntegration.isPending || updateIntegration.isPending ||
    (isSiteManager ? !formData.api_token.trim() : (!formData.base_url.trim() || !formData.username.trim() || !formData.password.trim()));

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-blue-400" />
            <div>
              <CardTitle className="text-white">Integração UniFi</CardTitle>
              <CardDescription className="text-slate-400">
                Configure via Site Manager API (token) ou controladora local (URL + usuário/senha).
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
                  {unifiIntegrations.map((integration) => {
                    const isLocalController = !!(integration.base_url && integration.username && integration.password);

                    return (
                      <Card key={integration.id} className="bg-slate-700 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Server className="h-5 w-5 text-blue-400" />
                              <div>
                                <h3 className="text-white font-medium">{integration.name}</h3>
                                <p className="text-slate-400 text-sm">
                                  {isLocalController ? 'Controladora Local' : 'Site Manager API'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                                {integration.is_active ? 'Ativo' : 'Inativo'}
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
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new">
              {isCreating && (
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="space-y-3">
                    <Label className="text-white">Tipo de conexão</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={isSiteManager ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, connection_mode: 'site_manager' })}
                      >
                        Site Manager API
                      </Button>
                      <Button
                        type="button"
                        variant={!isSiteManager ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, connection_mode: 'local_controller' })}
                      >
                        Controladora Local
                      </Button>
                    </div>
                  </div>

                  {isSiteManager ? (
                    <>
                      <div>
                        <Label htmlFor="api_token" className="text-white">API Token *</Label>
                        <Input
                          id="api_token"
                          type="password"
                          value={formData.api_token}
                          onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                          placeholder="Cole aqui seu token da UniFi Site Manager API"
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <Alert className="border-blue-500 bg-blue-500/10">
                        <Wifi className="h-4 w-4" />
                        <AlertDescription className="text-white">
                          Gere o token em <a href="https://unifi.ui.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">unifi.ui.com</a> em <strong>Settings → API</strong>.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="base_url" className="text-white">URL da Controladora *</Label>
                        <Input
                          id="base_url"
                          value={formData.base_url}
                          onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                          placeholder="https://unifi.parkersolucoes.com.br:8445"
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username" className="text-white">Usuário *</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="admin"
                            required
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password" className="text-white">Senha *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            required
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Usar SSL/HTTPS</Label>
                          <p className="text-sm text-slate-400">Ative se sua URL usa HTTPS</p>
                        </div>
                        <Switch
                          checked={formData.use_ssl}
                          onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                        />
                      </div>
                    </>
                  )}

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
                      disabled={submitDisabled}
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
