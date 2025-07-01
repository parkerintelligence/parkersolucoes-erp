import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit, Trash2, Key, MessageCircle, HardDrive, Activity, DollarSign } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration, useDeleteIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

export function AdminApiPanel() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'chatwoot' as 'chatwoot' | 'evolution_api' | 'wasabi' | 'grafana' | 'bomcontrole',
    name: '',
    base_url: '',
    api_token: '',
    webhook_url: '',
    phone_number: '',
    username: '',
    password: '',
    is_active: true
  });

  const handleSave = () => {
    if (!formData.name || !formData.base_url) return;
    
    // Para Grafana e Bom Controle, username/password são obrigatórios
    if ((formData.type === 'grafana' || formData.type === 'bomcontrole') && (!formData.username || !formData.password)) {
      toast({
        title: "Campos obrigatórios",
        description: "Username e Password são obrigatórios para Grafana e Bom Controle.",
        variant: "destructive"
      });
      return;
    }

    const integrationData = {
      type: formData.type,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token || '',
      webhook_url: formData.webhook_url || null,
      phone_number: formData.phone_number || null,
      username: formData.username || null,
      password: formData.password || null,
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
      is_active: true
    });
    setIsDialogOpen(false);
    setEditingIntegration(null);
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
      is_active: integration.is_active ?? true
    });
    setEditingIntegration(integration.id);
    setIsDialogOpen(true);
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
      default:
        return type;
    }
  };

  const requiresAuth = (type: string) => {
    return type === 'grafana' || type === 'bomcontrole';
  };

  const requiresApiToken = (type: string) => {
    return type !== 'grafana' && type !== 'bomcontrole';
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
              Configurações de API
            </CardTitle>
            <CardDescription>
              Configure integrações com APIs externas (WhatsApp, Wasabi, Grafana, Bom Controle)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Integração
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingIntegration ? 'Editar Integração' : 'Configurar Nova Integração'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma nova integração com APIs externas
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Integração</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatwoot">Chatwoot - WhatsApp</SelectItem>
                      <SelectItem value="evolution_api">Evolution API - WhatsApp</SelectItem>
                      <SelectItem value="wasabi">Wasabi Cloud Storage</SelectItem>
                      <SelectItem value="grafana">Grafana Monitoring</SelectItem>
                      <SelectItem value="bomcontrole">Bom Controle - Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Integração</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: WhatsApp Principal, Wasabi Backup, etc." 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="base_url">URL Base da API</Label>
                  <Input 
                    id="base_url" 
                    value={formData.base_url}
                    onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                    placeholder="https://api.example.com" 
                  />
                </div>

                {requiresAuth(formData.type) && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Usuário</Label>
                      <Input 
                        id="username" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="Usuário de acesso" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Senha de acesso" 
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
                      placeholder="Token de acesso" 
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

                {formData.type === 'wasabi' && (
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                    <strong>Wasabi:</strong> Configure as credenciais de acesso ao bucket do Wasabi. 
                    O token deve conter as chaves de acesso (Access Key e Secret Key).
                  </div>
                )}

                {formData.type === 'grafana' && (
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                    <strong>Grafana:</strong> Configure a URL do Grafana e as credenciais de usuário para acessar os dashboards.
                  </div>
                )}

                {formData.type === 'bomcontrole' && (
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                    <strong>Bom Controle:</strong> Configure a URL da API do Bom Controle e as credenciais de acesso para integração financeira.
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
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
            <p className="text-sm mt-2">Configure suas APIs para habilitar as funcionalidades do sistema.</p>
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
                      {integration.username && `User: ${integration.username}`}
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
