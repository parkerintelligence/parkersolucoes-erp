
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check, X, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const GuacamoleAdminConfig = () => {
  const { data: integrations } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  
  const [config, setConfig] = useState({
    base_url: '',
    username: '',
    password: '',
    data_source: 'postgresql',
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
        data_source: guacamoleIntegration.directory || 'postgresql', // Usar directory para data_source
        is_active: guacamoleIntegration.is_active ?? true,
        name: guacamoleIntegration.name || 'Guacamole'
      });
    }
  }, [guacamoleIntegration]);

  const normalizeBaseUrl = (url: string): string => {
    return url.trim();
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!config.base_url || !config.username || !config.password) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(config.base_url)) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida (ex: http://servidor:8080/guacamole).",
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
        directory: config.data_source, // Usar directory para armazenar data_source
        is_active: config.is_active
      };

      if (guacamoleIntegration) {
        await updateIntegration.mutateAsync({
          id: guacamoleIntegration.id,
          updates: integrationData
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

  const handleBaseUrlChange = (url: string) => {
    setConfig({ ...config, base_url: url });
  };

  const handleBaseUrlBlur = () => {
    if (config.base_url) {
      const normalized = normalizeBaseUrl(config.base_url);
      if (normalized !== config.base_url) {
        setConfig({ ...config, base_url: normalized });
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
                <p className="text-sm">
                  <Badge variant="outline">
                    {guacamoleIntegration.directory || 'postgresql'}
                  </Badge>
                </p>
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
              <Label htmlFor="base_url" className="flex items-center gap-2">
                URL Base do Guacamole *
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Formato: http://servidor:porta/guacamole</p>
                    <p>Exemplo: http://192.168.1.100:8080/guacamole</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="base_url"
                type="url"
                placeholder="http://servidor:8080/guacamole"
                value={config.base_url}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                onBlur={handleBaseUrlBlur}
                className={!validateUrl(config.base_url) && config.base_url ? 'border-red-300' : ''}
              />
              {config.base_url && !validateUrl(config.base_url) && (
                <p className="text-sm text-red-600">URL inválida</p>
              )}
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
              <Label htmlFor="data_source" className="flex items-center gap-2">
                Data Source
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tipo de banco de dados configurado no Guacamole</p>
                    <p>Geralmente PostgreSQL ou MySQL</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
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

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> O usuário deve ter permissões administrativas no Guacamole para acessar a API.
                Verifique se o usuário pode administrar conexões e usuários no painel web.
              </AlertDescription>
            </Alert>

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
