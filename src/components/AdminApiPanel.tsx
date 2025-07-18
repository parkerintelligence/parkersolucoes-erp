import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Settings, ExternalLink } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface IntegrationFormData {
  name: string;
  type: string;
  base_url: string;
  api_token: string;
  username: string;
  password: string;
  is_active: boolean;
}

export const AdminApiPanel = () => {
  const { data: integrations = [] } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [showForm, setShowForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntegrationFormData>({
    name: '',
    type: 'api',
    base_url: '',
    api_token: '',
    username: '',
    password: '',
    is_active: true,
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.base_url) {
      toast.error("Campos obrigatórios", {
        description: "Preencha pelo menos o nome e a URL base."
      });
      return;
    }

    const integrationData = {
      ...formData,
      phone_number: null,
      webhook_url: null,
      region: null,
      bucket_name: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null,
    };

    try {
      if (editingIntegration) {
        await updateIntegration.mutateAsync({
          id: editingIntegration,
          updates: integrationData
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      setShowForm(false);
      setEditingIntegration(null);
      setFormData({
        name: '',
        type: 'api',
        base_url: '',
        api_token: '',
        username: '',
        password: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
    }
  };

  const handleEdit = (integration: any) => {
    setFormData({
      name: integration.name,
      type: integration.type,
      base_url: integration.base_url,
      api_token: integration.api_token || '',
      username: integration.username || '',
      password: integration.password || '',
      is_active: integration.is_active,
    });
    setEditingIntegration(integration.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      await deleteIntegration.mutateAsync(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="space-y-6 p-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Painel de APIs e Integrações
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie todas as integrações e APIs do sistema
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Integração
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Form */}
            {showForm && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingIntegration ? 'Editar Integração' : 'Nova Integração'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-200">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-gray-200">Tipo</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="base_url" className="text-gray-200">URL Base</Label>
                    <Input
                      id="base_url"
                      value={formData.base_url}
                      onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-gray-200">Usuário</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-gray-200">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="api_token" className="text-gray-200">Token da API</Label>
                    <Input
                      id="api_token"
                      type="password"
                      value={formData.api_token}
                      onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active" className="text-gray-200">Ativo</Label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    {editingIntegration ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingIntegration(null);
                    }}
                    className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Integrations List */}
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{integration.name}</h4>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="border-gray-500 text-gray-300">
                          {integration.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{integration.base_url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(integration.base_url, '_blank')}
                        className="border-gray-600 text-gray-200 hover:bg-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(integration)}
                        className="border-gray-600 text-gray-200 hover:bg-gray-600"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {integrations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p>Nenhuma integração configurada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
