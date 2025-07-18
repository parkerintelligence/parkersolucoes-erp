
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { toast } from 'sonner';

export const BaculaAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    username: '',
    password: '',
    is_active: true,
  });

  const baculaIntegrations = integrations?.filter(integration => integration.type === 'bacula') || [];

  const resetForm = () => {
    setFormData({
      name: '',
      base_url: '',
      username: '',
      password: '',
      is_active: true,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createIntegration.mutateAsync({
        ...formData,
        type: 'bacula',
      });
      resetForm();
    } catch (error) {
      console.error('Error creating Bacula integration:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name || !formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateIntegration.mutateAsync({ 
        id, 
        updates: formData 
      });
      resetForm();
    } catch (error) {
      console.error('Error updating Bacula integration:', error);
    }
  };

  const handleEdit = (integration: any) => {
    setFormData({
      name: integration.name,
      base_url: integration.base_url,
      username: integration.username || '',
      password: integration.password || '',
      is_active: integration.is_active,
    });
    setEditingId(integration.id);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await deleteIntegration.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting Bacula integration:', error);
      }
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Configuração BaculaWeb</CardTitle>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isCreating || editingId !== null}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Integração
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(isCreating || editingId) && (
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {editingId ? 'Editar Integração' : 'Nova Integração BaculaWeb'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-slate-200">Nome da Integração</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: BaculaWeb Produção"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="base_url" className="text-slate-200">URL do BaculaWeb</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="http://baculaweb.example.com"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-slate-200">Usuário</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="admin"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-slate-200">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-slate-200">Integração ativa</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                  disabled={createIntegration.isPending || updateIntegration.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={resetForm} className="border-slate-600 text-slate-200 hover:bg-slate-700">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Integrações Configuradas</h3>
          {baculaIntegrations.length === 0 ? (
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-6 text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400">Nenhuma integração BaculaWeb configurada.</p>
              </CardContent>
            </Card>
          ) : (
            baculaIntegrations.map((integration) => (
              <Card key={integration.id} className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-white">{integration.name}</h4>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-300">
                        <p><strong>URL:</strong> {integration.base_url}</p>
                        <p><strong>Usuário:</strong> {integration.username}</p>
                        <p><strong>Criado em:</strong> {new Date(integration.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(integration)}
                        disabled={isCreating || editingId !== null}
                        className="border-slate-600 text-slate-200 hover:bg-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                        disabled={deleteIntegration.isPending}
                        className="border-red-600 text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
