
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Check, X, TestTube, Edit } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface ApiConfiguration {
  id?: string;
  type: string;
  name: string;
  base_url: string;
  username: string;
  password: string;
  region?: string;
  bucket_name?: string;
  is_active: boolean;
}

const AdminApiPanel = () => {
  const { data: integrations, createIntegration, updateIntegration, deleteIntegration } = useIntegrations();
  const [newConfig, setNewConfig] = useState<ApiConfiguration>({
    type: '',
    name: '',
    base_url: '',
    username: '',
    password: '',
    region: '',
    bucket_name: '',
    is_active: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const apiTypes = [
    { value: 'glpi', label: 'GLPI' },
    { value: 'zabbix', label: 'Zabbix' },
    { value: 'wasabi', label: 'Wasabi' },
    { value: 'chatwoot', label: 'Chatwoot' },
    { value: 'evolution_api', label: 'Evolution API' },
    { value: 'other', label: 'Outro' }
  ];

  const resetForm = () => {
    setNewConfig({
      type: '',
      name: '',
      base_url: '',
      username: '',
      password: '',
      region: '',
      bucket_name: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (config: any) => {
    setNewConfig({
      id: config.id,
      type: config.type,
      name: config.name,
      base_url: config.base_url,
      username: config.username || '',
      password: config.password || '',
      region: config.region || '',
      bucket_name: config.bucket_name || '',
      is_active: config.is_active
    });
    setEditingId(config.id);
  };

  const testConnection = async (config: ApiConfiguration) => {
    if (!config.id) return;
    
    setTestingConnection(config.id);
    
    try {
      console.log('Testando conexão com configuração:', {
        type: config.type,
        name: config.name,
        base_url: config.base_url,
        username: config.username ? '***' : '',
        region: config.region,
        bucket_name: config.bucket_name
      });

      // Simulação de teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (config.type === 'wasabi') {
        if (!config.username || !config.password || !config.bucket_name) {
          toast({
            title: "Erro de configuração",
            description: "Access Key, Secret Key e Bucket Name são obrigatórios para Wasabi.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Teste de conexão simulado",
          description: `Configuração do Wasabi ${config.name} testada com sucesso! (Simulado)`,
        });
      } else {
        if (!config.base_url) {
          toast({
            title: "Erro de configuração",
            description: "URL Base é obrigatória.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Teste de conexão simulado",
          description: `Configuração ${config.name} testada com sucesso! (Simulado)`,
        });
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      toast({
        title: "Erro no teste",
        description: `Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Salvando configuração:', {
      ...newConfig,
      password: newConfig.password ? '***' : ''
    });

    // Validações básicas
    if (!newConfig.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!newConfig.type) {
      toast({
        title: "Campo obrigatório",
        description: "Tipo de API é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    // Configurar valores padrão para Wasabi
    let configToSave = { ...newConfig };
    
    if (newConfig.type === 'wasabi') {
      // Validações específicas do Wasabi
      if (!newConfig.username || !newConfig.password || !newConfig.bucket_name) {
        toast({
          title: "Campos obrigatórios",
          description: "Para Wasabi: Access Key, Secret Key e Bucket Name são obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      // Definir endpoint padrão se não fornecido
      if (!configToSave.base_url.trim()) {
        configToSave.base_url = 's3.wasabisys.com';
      }

      // Definir região padrão se não fornecido
      if (!configToSave.region?.trim()) {
        configToSave.region = 'us-east-1';
      }

      console.log('Configuração Wasabi processada:', {
        ...configToSave,
        password: '***'
      });
    } else {
      // Para outros tipos, validar URL base
      if (!configToSave.base_url.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "URL Base é obrigatória.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const integrationData = {
        type: configToSave.type as any,
        name: configToSave.name,
        base_url: configToSave.base_url,
        api_token: null,
        webhook_url: null,
        phone_number: null,
        username: configToSave.username || null,
        password: configToSave.password || null,
        region: configToSave.region || null,
        bucket_name: configToSave.bucket_name || null,
        is_active: configToSave.is_active
      };

      if (editingId) {
        console.log('Atualizando integração:', editingId);
        await updateIntegration.mutateAsync({ 
          id: editingId, 
          updates: integrationData
        });
        toast({
          title: "Configuração atualizada!",
          description: `${configToSave.name} foi atualizada com sucesso.`,
        });
      } else {
        console.log('Criando nova integração');
        await createIntegration.mutateAsync(integrationData);
        toast({
          title: "Configuração criada!",
          description: `${configToSave.name} foi configurada com sucesso.`,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar",
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique os logs do console para mais detalhes.`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      console.log('Removendo integração:', id, name);
      await deleteIntegration.mutateAsync(id);
      toast({
        title: "Configuração removida!",
        description: `${name} foi removida com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
      toast({
        title: "Erro ao remover",
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulário */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
          <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? 'Editar' : 'Nova'} Configuração de API
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold text-gray-700">Tipo de API *</Label>
                <select
                  id="type"
                  value={newConfig.type}
                  onChange={(e) => setNewConfig({ ...newConfig, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {apiTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nome *</Label>
                <Input
                  id="name"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="Nome da configuração"
                  className="p-3 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url" className="text-sm font-semibold text-gray-700">
                {newConfig.type === 'wasabi' ? 'Endpoint (opcional - padrão: s3.wasabisys.com)' : 'URL Base *'}
              </Label>
              <Input
                id="base_url"
                value={newConfig.base_url}
                onChange={(e) => setNewConfig({ ...newConfig, base_url: e.target.value })}
                placeholder={newConfig.type === 'wasabi' ? 's3.wasabisys.com' : 'https://api.exemplo.com'}
                className="p-3 border-gray-300 focus:ring-2 focus:ring-blue-500"
                required={newConfig.type !== 'wasabi'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  {newConfig.type === 'wasabi' ? 'Access Key *' : 'Usuário'}
                </Label>
                <Input
                  id="username"
                  value={newConfig.username}
                  onChange={(e) => setNewConfig({ ...newConfig, username: e.target.value })}
                  placeholder={newConfig.type === 'wasabi' ? 'Access Key' : 'Usuário'}
                  className="p-3 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required={newConfig.type === 'wasabi'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  {newConfig.type === 'wasabi' ? 'Secret Key *' : 'Senha'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newConfig.password}
                  onChange={(e) => setNewConfig({ ...newConfig, password: e.target.value })}
                  placeholder={newConfig.type === 'wasabi' ? 'Secret Key' : 'Senha'}
                  className="p-3 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required={newConfig.type === 'wasabi'}
                />
              </div>
            </div>

            {newConfig.type === 'wasabi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-semibold text-gray-700">Região (opcional - padrão: us-east-1)</Label>
                  <Input
                    id="region"
                    value={newConfig.region || ''}
                    onChange={(e) => setNewConfig({ ...newConfig, region: e.target.value })}
                    placeholder="us-east-1"
                    className="p-3 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bucket_name" className="text-sm font-semibold text-gray-700">Nome do Bucket *</Label>
                  <Input
                    id="bucket_name"
                    value={newConfig.bucket_name || ''}
                    onChange={(e) => setNewConfig({ ...newConfig, bucket_name: e.target.value })}
                    placeholder="nome-do-bucket"
                    className="p-3 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={newConfig.is_active}
                onChange={(e) => setNewConfig({ ...newConfig, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <Label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Configuração Ativa</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createIntegration.isPending || updateIntegration.isPending}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white font-semibold rounded-lg shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createIntegration.isPending || updateIntegration.isPending ? 
                  (editingId ? 'Atualizando...' : 'Salvando...') : 
                  (editingId ? 'Atualizar' : 'Salvar')
                }
              </Button>
              
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="px-6 py-3 font-semibold rounded-lg shadow-md"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
          <CardTitle className="text-xl text-blue-900">Configurações Existentes</CardTitle>
          {integrations && integrations.length > 0 && (
            <p className="text-sm text-blue-600">{integrations.length} configuração(ões) encontrada(s)</p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {integrations && integrations.length > 0 ? (
            <div className="space-y-4">
              {integrations.map((config) => (
                <Card key={config.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg text-gray-900">{config.name}</h3>
                          <Badge 
                            variant={config.type === 'wasabi' ? 'default' : 'secondary'}
                            className="px-3 py-1 text-xs font-semibold"
                          >
                            {config.type.toUpperCase()}
                          </Badge>
                          <Badge 
                            variant={config.is_active ? 'default' : 'secondary'}
                            className={`px-3 py-1 text-xs font-semibold ${
                              config.is_active 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {config.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">URL/Endpoint:</span>
                            <p className="text-gray-600 break-all">{config.base_url || 'Não informado'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">
                              {config.type === 'wasabi' ? 'Access Key:' : 'Usuário:'}
                            </span>
                            <p className="text-gray-600">{config.username || 'Não informado'}</p>
                          </div>
                          {config.type === 'wasabi' && config.region && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <span className="font-semibold text-gray-700 block mb-1">Região:</span>
                              <p className="text-gray-600">{config.region}</p>
                            </div>
                          )}
                          {config.type === 'wasabi' && config.bucket_name && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <span className="font-semibold text-gray-700 block mb-1">Bucket:</span>
                              <p className="text-gray-600">{config.bucket_name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-row lg:flex-col gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection({
                            id: config.id,
                            type: config.type,
                            name: config.name,
                            base_url: config.base_url,
                            username: config.username || '',
                            password: config.password || '',
                            region: config.region || '',
                            bucket_name: config.bucket_name || '',
                            is_active: config.is_active || false
                          })}
                          disabled={testingConnection === config.id}
                          className="flex-1 lg:flex-none hover:bg-blue-50 border-blue-200"
                        >
                          <TestTube className={`h-4 w-4 mr-2 ${testingConnection === config.id ? 'animate-spin' : ''}`} />
                          {testingConnection === config.id ? 'Testando...' : 'Testar'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config)}
                          className="flex-1 lg:flex-none hover:bg-green-50 border-green-200"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(config.id, config.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 flex-1 lg:flex-none"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 max-w-md mx-auto">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">Nenhuma configuração encontrada</p>
                <p className="text-gray-500 text-sm">Adicione uma nova configuração de API para começar</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApiPanel;
