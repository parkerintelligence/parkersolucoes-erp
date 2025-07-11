import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { Server, Plus, Trash2, Settings, RefreshCw } from 'lucide-react';

export const HostingerAdminConfig = () => {
  const { toast } = useToast();
  const { data: integrations, isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  
  const [formData, setFormData] = useState({
    name: '',
    base_url: 'https://api.hostinger.com/v1',
    api_token: '',
    is_active: true
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const hostingerIntegrations = integrations?.filter(integration => integration.type === 'hostinger') || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.api_token.trim()) {
      toast({
        title: "Erro",
        description: "Nome e Token da API são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const integrationData = {
        name: formData.name,
        type: 'hostinger' as const,
        base_url: formData.base_url,
        api_token: formData.api_token,
        is_active: formData.is_active
      };

      if (editingId) {
        await updateIntegration.mutateAsync({ id: editingId, updates: integrationData });
        setEditingId(null);
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      setFormData({
        name: '',
        base_url: 'https://api.hostinger.com/v1',
        api_token: '',
        is_active: true
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar integração Hostinger",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (integration: any) => {
    setFormData({
      name: integration.name,
      base_url: integration.base_url || 'https://api.hostinger.com/v1',
      api_token: integration.api_token || '',
      is_active: integration.is_active ?? true
    });
    setEditingId(integration.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await deleteIntegration.mutateAsync(id);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir integração Hostinger",
          variant: "destructive",
        });
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      base_url: 'https://api.hostinger.com/v1',
      api_token: '',
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Server className="h-5 w-5 text-orange-500" />
            {editingId ? 'Editar Integração Hostinger' : 'Nova Integração Hostinger'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Nome da Integração</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Hostinger Principal"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="base_url" className="text-slate-200">URL da API</Label>
                <Input
                  id="base_url"
                  type="url"
                  value={formData.base_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_token" className="text-slate-200">Token da API</Label>
              <Input
                id="api_token"
                type="password"
                placeholder="Seu token da API Hostinger"
                value={formData.api_token}
                onChange={(e) => setFormData(prev => ({ ...prev, api_token: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-slate-200">Integração Ativa</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createIntegration.isPending || updateIntegration.isPending} className="bg-orange-600 hover:bg-orange-700">
                {(createIntegration.isPending || updateIntegration.isPending) ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingId ? 'Atualizar' : 'Criar'} Integração
              </Button>
              
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Integrações */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Integrações Hostinger Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {hostingerIntegrations.length === 0 ? (
            <p className="text-slate-400 text-center py-4">
              Nenhuma integração Hostinger configurada
            </p>
          ) : (
            <div className="space-y-4">
              {hostingerIntegrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{integration.name}</h3>
                      <Badge variant={integration.is_active ? "default" : "secondary"}>
                        {integration.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{integration.base_url}</p>
                    <p className="text-xs text-slate-500">
                      Token: {integration.api_token ? '••••••••' : 'Não configurado'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(integration)}
                      className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(integration.id)}
                      disabled={deleteIntegration.isPending}
                      className="bg-red-600 border-red-500 text-white hover:bg-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};