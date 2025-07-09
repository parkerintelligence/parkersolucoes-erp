
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const GuacamoleAdminConfig = () => {
  const { integrations, createIntegration, updateIntegration, deleteIntegration } = useIntegrations();
  const [config, setConfig] = useState({
    base_url: '',
    username: '',
    password: '',
    data_source: 'postgresql', // Changed from 'mysql' to 'postgresql'
    is_active: true,
    name: 'Guacamole'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const guacamoleIntegration = integrations?.find(i => i.type === 'guacamole');

  useEffect(() => {
    if (guacamoleIntegration) {
      setConfig({
        base_url: guacamoleIntegration.base_url || '',
        username: guacamoleIntegration.username || '',
        password: guacamoleIntegration.password || '',
        data_source: guacamoleIntegration.api_token || 'postgresql', // Use api_token field to store data_source
        is_active: guacamoleIntegration.is_active ?? true,
        name: guacamoleIntegration.name || 'Guacamole'
      });
    }
  }, [guacamoleIntegration]);

  const handleSave = async () => {
    if (!config.base_url || !config.username || !config.password) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationData = {
        name: config.name,
        type: 'guacamole' as const,
        base_url: config.base_url,
        username: config.username,
        password: config.password,
        api_token: config.data_source, // Store data_source in api_token field
        is_active: config.is_active
      };

      if (guacamoleIntegration) {
        await updateIntegration.mutateAsync({
          id: guacamoleIntegration.id,
          ...integrationData
        });
      } else {
        await createIntegration.mutateAsync(integrationData);
      }

      setIsEditing(false);
      toast({
        title: "Configuração salva!",
        description: "A configuração do Guacamole foi salva com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a configuração do Guacamole.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!guacamoleIntegration) return;

    if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
      setIsLoading(true);
      try {
        await deleteIntegration.mutateAsync(guacamoleIntegration.id);
        setConfig({
          base_url: '',
          username: '',
          password: '',
          data_source: 'postgresql',
          is_active: true,
          name: 'Guacamole'
        });
        toast({
          title: "Configuração excluída!",
          description: "A configuração do Guacamole foi excluída com sucesso."
        });
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir a configuração do Guacamole.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          Configuração do Guacamole
        </CardTitle>
        <CardDescription>
          Configure a integração com o Apache Guacamole para acesso remoto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {guacamoleIntegration && !isEditing ? (
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Guacamole configurado e {guacamoleIntegration.is_active ? 'ativo' : 'inativo'}
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">URL Base</Label>
                <p className="text-sm">{guacamoleIntegration.base_url}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Usuário</Label>
                <p className="text-sm">{guacamoleIntegration.username}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Data Source</Label>
                <p className="text-sm">{guacamoleIntegration.api_token || 'postgresql'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="text-sm">{guacamoleIntegration.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar
              </Button>
              <Button onClick={handleDelete} variant="destructive">
                <X className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base_url">URL Base do Guacamole *</Label>
              <Input
                id="base_url"
                type="url"
                placeholder="https://guacamole.exemplo.com"
                value={config.base_url}
                onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuário *</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_source">Data Source</Label>
              <Select value={config.data_source} onValueChange={(value) => setConfig({ ...config, data_source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Ativo</Label>
              <Switch
                id="is_active"
                checked={config.is_active}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              {isEditing && (
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuacamoleAdminConfig;
