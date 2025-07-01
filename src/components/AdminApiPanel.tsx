
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Check, X, TestTube } from 'lucide-react';
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

  const handleEdit = (config: ApiConfiguration) => {
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
    setEditingId(config.id || null);
  };

  const testConnection = async (config: ApiConfiguration) => {
    if (!config.id) return;
    
    setTestingConnection(config.id);
    
    try {
      let testUrl = '';
      let testOptions: RequestInit = {};

      if (config.type === 'wasabi') {
        // Teste específico para Wasabi usando s3.wasabisys.com
        testUrl = '/api/wasabi-test';
        testOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: config.base_url || 's3.wasabisys.com',
            accessKey: config.username,
            secretKey: config.password,
            region: config.region || 'us-east-1',
            bucketName: config.bucket_name
          })
        };
      } else {
        // Teste genérico para outras APIs
        testUrl = config.base_url;
        testOptions = {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`
          }
        };
      }

      const response = await fetch(testUrl, testOptions);
      
      if (response.ok || response.status === 401) {
        toast({
          title: "Conexão bem-sucedida!",
          description: `Conexão com ${config.name} estabelecida com sucesso.`,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Erro no teste de conexão:', error);
      toast({
        title: "Erro na conexão",
        description: `Não foi possível conectar com ${config.name}. Verifique as configurações.`,
        variant: "destructive"
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newConfig.name || !newConfig.base_url) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e URL base são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Para Wasabi, testar conexão antes de salvar
    if (newConfig.type === 'wasabi') {
      if (!newConfig.username || !newConfig.password) {
        toast({
          title: "Credenciais obrigatórias",
          description: "Access Key e Secret Key são obrigatórios para Wasabi.",
          variant: "destructive"
        });
        return;
      }

      // Definir endpoint padrão do Wasabi se não informado
      if (!newConfig.base_url) {
        newConfig.base_url = 's3.wasabisys.com';
      }

      // Testar conexão
      try {
        const testResponse = await fetch('/api/wasabi-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: newConfig.base_url,
            accessKey: newConfig.username,
            secretKey: newConfig.password,
            region: newConfig.region || 'us-east-1',
            bucketName: newConfig.bucket_name
          })
        });

        if (!testResponse.ok) {
          toast({
            title: "Falha no teste de conexão",
            description: "Não foi possível conectar com o Wasabi. Verifique as credenciais.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.warn('Erro no teste de conexão Wasabi:', error);
        // Continuar mesmo com erro no teste, pois pode ser problema de rede
      }
    }

    try {
      if (editingId) {
        await updateIntegration.mutateAsync({ 
          id: editingId, 
          updates: {
            type: newConfig.type as any,
            name: newConfig.name,
            base_url: newConfig.base_url,
            username: newConfig.username,
            password: newConfig.password,
            region: newConfig.region,
            bucket_name: newConfig.bucket_name,
            is_active: newConfig.is_active
          }
        });
        toast({
          title: "Configuração atualizada!",
          description: `${newConfig.name} foi atualizada com sucesso.`,
        });
      } else {
        await createIntegration.mutateAsync({
          type: newConfig.type as any,
          name: newConfig.name,
          base_url: newConfig.base_url,
          api_token: null,
          webhook_url: null,
          phone_number: null,
          username: newConfig.username,
          password: newConfig.password,
          region: newConfig.region,
          bucket_name: newConfig.bucket_name,
          is_active: newConfig.is_active
        });
        toast({
          title: "Configuração adicionada!",
          description: `${newConfig.name} foi adicionada com sucesso.`,
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar a configuração. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteIntegration.mutateAsync(id);
      toast({
        title: "Configuração removida!",
        description: `${name} foi removida com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Erro ao remover a configuração. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {editingId ? 'Editar' : 'Nova'} Configuração de API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de API</Label>
                <select
                  id="type"
                  value={newConfig.type}
                  onChange={(e) => setNewConfig({ ...newConfig, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="Nome da configuração"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="base_url">
                {newConfig.type === 'wasabi' ? 'Endpoint (padrão: s3.wasabisys.com)' : 'URL Base'}
              </Label>
              <Input
                id="base_url"
                value={newConfig.base_url}
                onChange={(e) => setNewConfig({ ...newConfig, base_url: e.target.value })}
                placeholder={newConfig.type === 'wasabi' ? 's3.wasabisys.com' : 'https://api.exemplo.com'}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">
                  {newConfig.type === 'wasabi' ? 'Access Key' : 'Usuário'}
                </Label>
                <Input
                  id="username"
                  value={newConfig.username}
                  onChange={(e) => setNewConfig({ ...newConfig, username: e.target.value })}
                  placeholder={newConfig.type === 'wasabi' ? 'Access Key' : 'Usuário'}
                />
              </div>
              
              <div>
                <Label htmlFor="password">
                  {newConfig.type === 'wasabi' ? 'Secret Key' : 'Senha'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newConfig.password}
                  onChange={(e) => setNewConfig({ ...newConfig, password: e.target.value })}
                  placeholder={newConfig.type === 'wasabi' ? 'Secret Key' : 'Senha'}
                />
              </div>
            </div>

            {newConfig.type === 'wasabi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Região</Label>
                  <Input
                    id="region"
                    value={newConfig.region}
                    onChange={(e) => setNewConfig({ ...newConfig, region: e.target.value })}
                    placeholder="us-east-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bucket_name">Nome do Bucket</Label>
                  <Input
                    id="bucket_name"
                    value={newConfig.bucket_name}
                    onChange={(e) => setNewConfig({ ...newConfig, bucket_name: e.target.value })}
                    placeholder="nome-do-bucket"
                    required={newConfig.type === 'wasabi'}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={newConfig.is_active}
                onChange={(e) => setNewConfig({ ...newConfig, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Ativa</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createIntegration.isPending || updateIntegration.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Atualizar' : 'Adicionar'}
              </Button>
              
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Configurações Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations && integrations.length > 0 ? (
            <div className="space-y-3">
              {integrations.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{config.name}</h3>
                        <Badge variant={config.type === 'wasabi' ? 'default' : 'secondary'}>
                          {config.type.toUpperCase()}
                        </Badge>
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>URL:</strong> {config.base_url}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Usuário:</strong> {config.username}
                      </p>
                      {config.type === 'wasabi' && config.region && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Região:</strong> {config.region}
                        </p>
                      )}
                      {config.type === 'wasabi' && config.bucket_name && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Bucket:</strong> {config.bucket_name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
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
                      >
                        <TestTube className={`h-4 w-4 mr-1 ${testingConnection === config.id ? 'animate-spin' : ''}`} />
                        {testingConnection === config.id ? 'Testando...' : 'Testar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit({
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
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id, config.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">
              Nenhuma configuração encontrada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApiPanel;
