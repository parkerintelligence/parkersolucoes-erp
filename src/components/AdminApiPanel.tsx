import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit, Trash2, Key, MessageCircle, HardDrive, Activity, DollarSign, Monitor, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

export function AdminApiPanel() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState({
    type: 'chatwoot' as 'chatwoot' | 'evolution_api' | 'wasabi' | 'grafana' | 'bomcontrole' | 'zabbix',
    name: '',
    base_url: '',
    api_token: '',
    webhook_url: '',
    phone_number: '',
    username: '',
    password: '',
    access_key: '',
    secret_key: '',
    region: '',
    is_active: true
  });

  const testWasabiConnection = async () => {
    if (formData.type !== 'wasabi' || !formData.base_url || !formData.access_key || !formData.secret_key) {
      toast({
        title: "Campos obrigatórios",
        description: "URL, Access Key e Secret Key são obrigatórios para testar a conexão Wasabi.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      // Teste básico de conexão com Wasabi
      const testUrl = `${formData.base_url.replace(/\/$/, '')}/`;
      
      const response = await fetch('/api/test-wasabi-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: testUrl,
          accessKey: formData.access_key,
          secretKey: formData.secret_key,
          region: formData.region || 'us-east-1'
        })
      });

      if (response.ok) {
        setConnectionTestResult('success');
        toast({
          title: "Conexão bem-sucedida!",
          description: "A conexão com o Wasabi foi estabelecida com sucesso.",
        });
      } else {
        throw new Error('Falha na conexão');
      }
    } catch (error) {
      console.error('Erro ao testar conexão Wasabi:', error);
      setConnectionTestResult('error');
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar ao Wasabi. Verifique as credenciais e URL.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.base_url.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e URL base são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    // Validações específicas por tipo
    if (formData.type === 'wasabi') {
      if (!formData.access_key.trim() || !formData.secret_key.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Access Key e Secret Key são obrigatórios para Wasabi.",
          variant: "destructive"
        });
        return;
      }
      
      if (connectionTestResult !== 'success') {
        toast({
          title: "Teste de conexão necessário",
          description: "Execute o teste de conexão antes de salvar a integração Wasabi.",
          variant: "destructive"
        });
        return;
      }
    }

    if ((formData.type === 'grafana' || formData.type === 'bomcontrole' || formData.type === 'zabbix') && 
        (!formData.username.trim() || !formData.password.trim())) {
      toast({
        title: "Campos obrigatórios",
        description: "Usuário e senha são obrigatórios para este tipo de integração.",
        variant: "destructive"
      });
      return;
    }

    if ((formData.type !== 'grafana' && formData.type !== 'bomcontrole' && formData.type !== 'zabbix' && formData.type !== 'wasabi') && 
        !formData.api_token.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Token da API é obrigatório para este tipo de integração.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: formData.type,
      name: formData.name.trim(),
      base_url: formData.base_url.trim(),
      api_token: formData.api_token.trim() || null,
      webhook_url: formData.webhook_url.trim() || null,
      phone_number: formData.phone_number.trim() || null,
      username: formData.username.trim() || formData.access_key.trim() || null,
      password: formData.password.trim() || formData.secret_key.trim() || null,
      is_active: formData.is_active
    };

    if (editingIntegration) {
      updateIntegration.mutate({ id: editingIntegration, updates: integrationData });
    } else {
      createIntegration.mutate(integrationData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'chatwoot',
      name: '',
      base_url: '',
      api_token: '',
      webhook_url: '',
      phone_number: '',
      username: '',
      password: '',
      access_key: '',
      secret_key: '',
      region: '',
      is_active: true
    });
    setIsDialogOpen(false);
    setEditingIntegration(null);
    setConnectionTestResult(null);
  };

  const handleEdit = (integration: any) => {
    setFormData({
      type: integration.type,
      name: integration.name,
      base_url: integration.base_url,
      api_token: integration.api_token || '',
      webhook_url: integration.webhook_url || '',
      phone_number: integration.phone_number || '',
      username: integration.username || '',
      password: integration.password || '',
      access_key: integration.type === 'wasabi' ? integration.username || '' : '',
      secret_key: integration.type === 'wasabi' ? integration.password || '' : '',
      region: integration.region || 'us-east-1',
      is_active: integration.is_active ?? true
    });
    setEditingIntegration(integration.id);
    setIsDialogOpen(true);
    setConnectionTestResult(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chatwoot':
      case 'evolution_api':
        return MessageCircle;
      case 'wasabi':
        return HardDrive;
      case 'grafana':
        return Activity;
      case 'bomcontrole':
        return DollarSign;
      case 'zabbix':
        return Monitor;
      default:
        return Settings;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chatwoot':
        return 'Chatwoot';
      case 'evolution_api':
        return 'Evolution API';
      case 'wasabi':
        return 'Wasabi';
      case 'grafana':
        return 'Grafana';
      case 'bomcontrole':
        return 'Bom Controle';
      case 'zabbix':
        return 'Zabbix';
      default:
        return type;
    }
  };

  const requiresAuth = (type: string) => {
    return type === 'grafana' || type === 'bomcontrole' || type === 'zabbix';
  };

  const requiresApiToken = (type: string) => {
    return type !== 'grafana' && type !== 'bomcontrole' && type !== 'zabbix' && type !== 'wasabi';
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando configurações...</div>;
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Configurações de Integrações & APIs
            </CardTitle>
            <CardDescription>
              Configure todas as integrações: WhatsApp, Wasabi, Grafana, Bom Controle, Zabbix e outras APIs
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Integração
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingIntegration ? 'Editar Integração' : 'Configurar Nova Integração'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma nova integração com APIs externas ou sistemas de monitoramento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Integração</Label>
                  <Select value={formData.type} onValueChange={(value: any) => {
                    setFormData({...formData, type: value});
                    setConnectionTestResult(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatwoot">📱 Chatwoot - WhatsApp</SelectItem>
                      <SelectItem value="evolution_api">📱 Evolution API - WhatsApp</SelectItem>
                      <SelectItem value="wasabi">☁️ Wasabi Cloud Storage</SelectItem>
                      <SelectItem value="grafana">📊 Grafana Monitoring</SelectItem>
                      <SelectItem value="bomcontrole">💰 Bom Controle - Financeiro</SelectItem>
                      <SelectItem value="zabbix">🖥️ Zabbix Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Integração</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: WhatsApp Principal, Grafana Server, etc." 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="base_url">
                    {formData.type === 'wasabi' ? 'Endpoint URL do Wasabi' : 'URL Base da API/Sistema'}
                  </Label>
                  <Input 
                    id="base_url" 
                    value={formData.base_url}
                    onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                    placeholder={formData.type === 'wasabi' ? 'https://s3.wasabisys.com' : 'https://api.example.com'} 
                  />
                </div>

                {formData.type === 'wasabi' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="access_key">Access Key</Label>
                        <Input 
                          id="access_key" 
                          value={formData.access_key}
                          onChange={(e) => setFormData({...formData, access_key: e.target.value})}
                          placeholder="Sua Access Key do Wasabi"
                          type="password"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="secret_key">Secret Key</Label>
                        <Input 
                          id="secret_key" 
                          type="password"
                          value={formData.secret_key}
                          onChange={(e) => setFormData({...formData, secret_key: e.target.value})}
                          placeholder="Sua Secret Key do Wasabi" 
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="region">Região (opcional)</Label>
                      <Input 
                        id="region" 
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                        placeholder="us-east-1 (padrão)" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={testWasabiConnection}
                        disabled={isTestingConnection || !formData.base_url || !formData.access_key || !formData.secret_key}
                        className="flex items-center gap-2"
                      >
                        {isTestingConnection && <Loader2 className="h-4 w-4 animate-spin" />}
                        {connectionTestResult === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {connectionTestResult === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        Testar Conexão
                      </Button>
                      {connectionTestResult === 'success' && (
                        <span className="text-sm text-green-600">Conexão OK!</span>
                      )}
                      {connectionTestResult === 'error' && (
                        <span className="text-sm text-red-600">Falha na conexão</span>
                      )}
                    </div>
                  </>
                )}

                {requiresAuth(formData.type) && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Usuário</Label>
                      <Input 
                        id="username" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="Usuário de acesso ao sistema" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Senha de acesso ao sistema" 
                      />
                    </div>
                  </>
                )}

                {requiresApiToken(formData.type) && (
                  <div className="grid gap-2">
                    <Label htmlFor="api_token">Token/Chave da API</Label>
                    <Input 
                      id="api_token" 
                      type="password"
                      value={formData.api_token}
                      onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                      placeholder="Token de acesso da API" 
                    />
                  </div>
                )}

                {(formData.type === 'chatwoot' || formData.type === 'evolution_api') && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="phone_number">Número do WhatsApp</Label>
                      <Input 
                        id="phone_number" 
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                        placeholder="+5511999999999" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="webhook_url">URL do Webhook (opcional)</Label>
                      <Input 
                        id="webhook_url" 
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                        placeholder="https://webhook.example.com" 
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={handleSave}
                  disabled={createIntegration.isPending || updateIntegration.isPending}
                >
                  {editingIntegration ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma integração configurada ainda.</p>
            <p className="text-sm mt-2">Configure suas integrações para habilitar as funcionalidades do sistema.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>URL Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => {
                const Icon = getTypeIcon(integration.type);
                return (
                  <TableRow key={integration.id} className="hover:bg-blue-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{integration.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(integration.type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{integration.base_url}</TableCell>
                    <TableCell>
                      <Badge variant={integration.is_active ? "default" : "secondary"}>
                        {integration.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {integration.phone_number && `Tel: ${integration.phone_number}`}
                      {integration.webhook_url && 'Webhook configurado'}
                      {integration.username && integration.type !== 'wasabi' && `User: ${integration.username}`}
                      {integration.type === 'wasabi' && 'S3 Compatible'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(integration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteIntegration.mutate(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
