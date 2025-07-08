
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit, Trash2, Database, Cloud, Shield, Server, Zap, Globe, Wifi } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { BaculaAdminConfig } from '@/components/BaculaAdminConfig';
import SystemSettingsPanel from '@/components/SystemSettingsPanel';

const Admin = () => {
  const { data: integrations = [], isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'grafana' as const,
    name: '',
    base_url: '',
    api_token: '',
    username: '',
    password: '',
    region: '',
    bucket_name: '',
    port: 22,
    directory: '',
    passive_mode: false,
    use_ssl: false,
    keep_logged: false,
    phone_number: '',
    webhook_url: ''
  });

  const integrationTypes = [
    { 
      value: 'grafana', 
      label: 'Grafana', 
      icon: <Database className="h-5 w-5 text-orange-400" />,
      description: 'Sistema de monitoramento e dashboards'
    },
    { 
      value: 'glpi', 
      label: 'GLPI', 
      icon: <Shield className="h-5 w-5 text-blue-400" />,
      description: 'Sistema de gerenciamento de ativos e helpdesk'
    },
    { 
      value: 'bacula', 
      label: 'BaculaWeb', 
      icon: <Database className="h-5 w-5 text-green-400" />,
      description: 'Interface web para monitoramento do Bacula'
    },
    { 
      value: 'wasabi', 
      label: 'Wasabi Cloud Storage', 
      icon: <Cloud className="h-5 w-5 text-green-400" />,
      description: 'Armazenamento em nuvem'
    },
    { 
      value: 'ftp', 
      label: 'FTP/SFTP', 
      icon: <Server className="h-5 w-5 text-purple-400" />,
      description: 'Transferência de arquivos'
    },
    { 
      value: 'chatwoot', 
      label: 'Chatwoot', 
      icon: <Zap className="h-5 w-5 text-indigo-400" />,
      description: 'Plataforma de chat e atendimento'
    },
    { 
      value: 'evolution_api', 
      label: 'Evolution API', 
      icon: <Globe className="h-5 w-5 text-teal-400" />,
      description: 'API para WhatsApp Business'
    },
    { 
      value: 'unifi', 
      label: 'UniFi Controller', 
      icon: <Wifi className="h-5 w-5 text-cyan-400" />,
      description: 'Controladora UniFi para gerenciamento de rede'
    }
  ];

  const getFieldsForType = (type: string) => {
    switch (type) {
      case 'grafana':
        return ['name', 'base_url', 'username', 'password'];
      case 'glpi':
        return ['name', 'base_url', 'api_token'];
      case 'bacula':
        return ['name', 'base_url', 'username', 'password'];
      case 'wasabi':
        return ['name', 'base_url', 'api_token', 'region', 'bucket_name'];
      case 'ftp':
        return ['name', 'base_url', 'username', 'password', 'port', 'directory', 'passive_mode', 'use_ssl'];
      case 'chatwoot':
      case 'evolution_api':
        return ['name', 'base_url', 'api_token', 'phone_number', 'webhook_url'];
      case 'unifi':
        return ['name', 'base_url', 'username', 'password', 'port'];
      default:
        return ['name', 'base_url'];
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.base_url) return;

    const integrationData = {
      is_active: true,
      type: formData.type,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token || null,
      username: formData.username || null,
      password: formData.password || null,
      region: formData.region || null,
      bucket_name: formData.bucket_name || null,
      port: formData.port || null,
      directory: formData.directory || null,
      passive_mode: formData.passive_mode || null,
      use_ssl: formData.use_ssl || null,
      keep_logged: formData.keep_logged || null,
      phone_number: formData.phone_number || null,
      webhook_url: formData.webhook_url || null
    };

    if (editingIntegration) {
      updateIntegration.mutate({ id: editingIntegration, updates: integrationData });
    } else {
      createIntegration.mutate(integrationData);
    }

    setFormData({
      type: 'grafana',
      name: '',
      base_url: '',
      api_token: '',
      username: '',
      password: '',
      region: '',
      bucket_name: '',
      port: 22,
      directory: '',
      passive_mode: false,
      use_ssl: false,
      keep_logged: false,
      phone_number: '',
      webhook_url: ''
    });
    setIsDialogOpen(false);
    setEditingIntegration(null);
  };

  const handleEdit = (integration: any) => {
    setFormData({
      type: integration.type,
      name: integration.name || '',
      base_url: integration.base_url || '',
      api_token: integration.api_token || '',
      username: integration.username || '',
      password: integration.password || '',
      region: integration.region || '',
      bucket_name: integration.bucket_name || '',
      port: integration.port || 22,
      directory: integration.directory || '',
      passive_mode: integration.passive_mode || false,
      use_ssl: integration.use_ssl || false,
      keep_logged: integration.keep_logged || false,
      phone_number: integration.phone_number || '',
      webhook_url: integration.webhook_url || ''
    });
    setEditingIntegration(integration.id);
    setIsDialogOpen(true);
  };

  const getIntegrationIcon = (type: string) => {
    const typeConfig = integrationTypes.find(t => t.value === type);
    return typeConfig?.icon || <Settings className="h-5 w-5 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <div className="text-gray-400">Carregando integrações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <Tabs defaultValue="integrations" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="integrations" className="data-[state=active]:bg-gray-700">
              Integrações
            </TabsTrigger>
            <TabsTrigger value="bacula" className="data-[state=active]:bg-gray-700">
              BaculaWeb
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Integração
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingIntegration ? 'Editar Integração' : 'Nova Integração'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Configure uma nova integração com serviços externos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type" className="text-gray-200">Tipo de Integração *</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {integrationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-600">
                              <div className="flex items-center gap-2">
                                {type.icon}
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-gray-400">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {getFieldsForType(formData.type).includes('name') && (
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-gray-200">Nome *</Label>
                        <Input 
                          id="name" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Nome da integração"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    )}

                    {getFieldsForType(formData.type).includes('base_url') && (
                      <div className="grid gap-2">
                        <Label htmlFor="base_url" className="text-gray-200">URL Base *</Label>
                        <Input 
                          id="base_url" 
                          value={formData.base_url}
                          onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                          placeholder="https://exemplo.com"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    )}

                    {/* Render other fields based on type */}
                    {getFieldsForType(formData.type).includes('api_token') && (
                      <div className="grid gap-2">
                        <Label htmlFor="api_token" className="text-gray-200">Token da API</Label>
                        <Input 
                          id="api_token" 
                          type="password"
                          value={formData.api_token}
                          onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                          placeholder="Token de acesso"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    )}

                    {getFieldsForType(formData.type).includes('username') && (
                      <div className="grid gap-2">
                        <Label htmlFor="username" className="text-gray-200">Usuário</Label>
                        <Input 
                          id="username" 
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          placeholder="Nome de usuário"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    )}

                    {getFieldsForType(formData.type).includes('password') && (
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-gray-200">Senha</Label>
                        <Input 
                          id="password" 
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="Senha"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      {editingIntegration ? 'Atualizar' : 'Salvar'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Integration Types Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrationTypes.map((type) => {
                const activeCount = integrations.filter(i => i.type === type.value && i.is_active).length;
                const totalCount = integrations.filter(i => i.type === type.value).length;
                
                return (
                  <Card key={type.value} className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3">
                        {type.icon}
                        {type.label}
                      </CardTitle>
                      <CardDescription className="text-gray-400">{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                          <span className="font-semibold text-white">{activeCount}</span> ativas de <span className="font-semibold text-white">{totalCount}</span> total
                        </div>
                        <Badge className={activeCount > 0 ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-gray-700 text-gray-400 border-gray-600'}>
                          {activeCount > 0 ? 'Configurado' : 'Não configurado'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Active Integrations Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Integrações Ativas
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de todas as integrações configuradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">Nenhuma integração configurada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-800/50">
                          <TableHead className="text-gray-300">Tipo</TableHead>
                          <TableHead className="text-gray-300">Nome</TableHead>
                          <TableHead className="text-gray-300">URL</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-right text-gray-300">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {integrations.map((integration) => (
                          <TableRow key={integration.id} className="border-gray-700 hover:bg-gray-800/30">
                            <TableCell className="flex items-center gap-2">
                              {getIntegrationIcon(integration.type)}
                              <span className="font-medium text-gray-200 capitalize">{integration.type}</span>
                            </TableCell>
                            <TableCell className="text-gray-200">{integration.name}</TableCell>
                            <TableCell className="text-gray-300">{integration.base_url}</TableCell>
                            <TableCell>
                              <Badge className={integration.is_active ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-red-900/20 text-red-400 border-red-600'}>
                                {integration.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEdit(integration)}
                                  className="border-gray-600 text-gray-200 hover:bg-gray-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-red-600 text-red-400 hover:bg-red-900/30"
                                  onClick={() => deleteIntegration.mutate(integration.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bacula">
            <BaculaAdminConfig />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
