
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Settings, Plus, Phone, Clock } from 'lucide-react';
import { useState } from 'react';
import { useIntegrations, useCreateIntegration } from '@/hooks/useIntegrations';

const WhatsApp = () => {
  const { isAuthenticated } = useAuth();
  const { data: integrations = [], isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '' as 'chatwoot' | 'evolution_api' | '',
    name: '',
    base_url: '',
    api_token: '',
    webhook_url: '',
    phone_number: ''
  });

  // Mock data para conversas
  const mockConversations = [
    {
      id: '1',
      contact_name: 'João Silva',
      contact_phone: '+5511999887766',
      last_message: 'Olá, preciso de ajuda com o sistema',
      last_message_time: '2024-01-15T10:30:00Z',
      unread_count: 2,
      status: 'active'
    },
    {
      id: '2',
      contact_name: 'Maria Santos',
      contact_phone: '+5511888776655',
      last_message: 'Obrigada pelo atendimento!',
      last_message_time: '2024-01-15T09:15:00Z',
      unread_count: 0,
      status: 'active'
    },
    {
      id: '3',
      contact_name: 'Pedro Costa',
      contact_phone: '+5511777665544',
      last_message: 'Quando será a próxima atualização?',
      last_message_time: '2024-01-14T16:45:00Z',
      unread_count: 1,
      status: 'active'
    }
  ];

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSave = () => {
    if (!formData.name || !formData.base_url || !formData.api_token || !formData.type) {
      return;
    }

    createIntegration.mutate({
      ...formData,
      is_active: true
    });

    setFormData({
      type: '',
      name: '',
      base_url: '',
      api_token: '',
      webhook_url: '',
      phone_number: ''
    });
    setIsDialogOpen(false);
  };

  const activeIntegrations = integrations.filter(i => i.is_active);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-slate-600">Carregando integrações...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-900 flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              WhatsApp Business
            </h1>
            <p className="text-green-600">Gerencie conversas e integrações do WhatsApp</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Integração
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Configurar Integração</DialogTitle>
                <DialogDescription>
                  Configure uma nova integração com Chatwoot ou Evolution API
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Integração *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatwoot">Chatwoot</SelectItem>
                      <SelectItem value="evolution_api">Evolution API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Integração *</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: WhatsApp Principal"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="base_url">URL Base *</Label>
                  <Input 
                    id="base_url" 
                    placeholder="https://app.chatwoot.com"
                    value={formData.base_url}
                    onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="api_token">API Token *</Label>
                  <Input 
                    id="api_token" 
                    type="password"
                    placeholder="Token da API"
                    value={formData.api_token}
                    onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input 
                    id="webhook_url" 
                    placeholder="https://webhook.site/your-webhook"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Número do WhatsApp</Label>
                  <Input 
                    id="phone_number" 
                    placeholder="+5511999887766"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
                  Salvar Integração
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Integrações Ativas */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Integrações Configuradas
            </CardTitle>
            <CardDescription>Integrações ativas do WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            {activeIntegrations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma integração configurada</p>
                <p className="text-sm">Configure uma integração para começar a receber mensagens</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeIntegrations.map((integration) => (
                  <Card key={integration.id} className="border-green-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-green-900">{integration.name}</h4>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {integration.type === 'chatwoot' ? 'Chatwoot' : 'Evolution API'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>URL: {integration.base_url}</div>
                        {integration.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {integration.phone_number}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversas Recentes */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversas Recentes
            </CardTitle>
            <CardDescription>Últimas conversas do WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            {mockConversations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockConversations.map((conversation) => (
                  <Card key={conversation.id} className="border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{conversation.contact_name}</h4>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Phone className="h-3 w-3" />
                            {conversation.contact_phone}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{conversation.last_message}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(conversation.last_message_time).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{activeIntegrations.length}</p>
                  <p className="text-sm text-green-600">Integrações Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{mockConversations.length}</p>
                  <p className="text-sm text-blue-600">Conversas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {mockConversations.reduce((total, conv) => total + conv.unread_count, 0)}
                  </p>
                  <p className="text-sm text-red-600">Não Lidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">
                    {activeIntegrations.filter(i => i.phone_number).length}
                  </p>
                  <p className="text-sm text-purple-600">Números</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WhatsApp;
