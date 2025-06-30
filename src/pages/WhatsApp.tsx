
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Plus, Settings, RefreshCw, Send } from 'lucide-react';
import { useIntegrations, useCreateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const WhatsApp = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'chatwoot' as 'chatwoot' | 'evolution_api',
    name: '',
    base_url: '',
    api_token: '',
    webhook_url: '',
    phone_number: ''
  });

  const { data: integrations, isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();

  const conversations = [
    { id: '1', contactName: 'João Silva', contactPhone: '+5511999999999', lastMessage: 'Olá, preciso de ajuda', lastMessageTime: '2 min atrás', unreadCount: 3, status: 'active' },
    { id: '2', contactName: 'Maria Santos', contactPhone: '+5511888888888', lastMessage: 'Obrigada pelo atendimento', lastMessageTime: '15 min atrás', unreadCount: 0, status: 'active' },
    { id: '3', contactName: 'Pedro Costa', contactPhone: '+5511777777777', lastMessage: 'Quando fica pronto?', lastMessageTime: '1h atrás', unreadCount: 2, status: 'active' },
  ];

  const handleSubmit = () => {
    if (!formData.name || !formData.base_url || !formData.api_token || !formData.type) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    createIntegration.mutate({
      ...formData,
      is_active: true
    });
    setIsDialogOpen(false);
    setFormData({
      type: 'chatwoot',
      name: '',
      base_url: '',
      api_token: '',
      webhook_url: '',
      phone_number: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'archived': 'bg-gray-100 text-gray-800 border-gray-200',
      'blocked': 'bg-red-100 text-red-800 border-red-200',
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              WhatsApp - Conversas
            </h1>
            <p className="text-blue-600">Gerencie conversas e integrações do WhatsApp</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Integração
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Configurar Integração</DialogTitle>
                <DialogDescription>Configure uma nova integração com Chatwoot ou Evolution API</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Integração</Label>
                  <Select value={formData.type} onValueChange={(value: 'chatwoot' | 'evolution_api') => setFormData({...formData, type: value})}>
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
                  <Label htmlFor="name">Nome da Integração</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: WhatsApp Principal" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="base_url">URL Base</Label>
                  <Input 
                    id="base_url" 
                    value={formData.base_url}
                    onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                    placeholder="https://api.example.com" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="api_token">Token da API</Label>
                  <Input 
                    id="api_token" 
                    type="password"
                    value={formData.api_token}
                    onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                    placeholder="Token de acesso" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Número do WhatsApp</Label>
                  <Input 
                    id="phone_number" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="+5511999999999" 
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Integrações Configuradas */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Integrações Configuradas</CardTitle>
            <CardDescription>Configure e gerencie suas integrações do WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando integrações...</p>
            ) : integrations && integrations.length > 0 ? (
              <div className="grid gap-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <p className="text-sm text-gray-600">Tipo: {integration.type}</p>
                      <p className="text-sm text-gray-600">Telefone: {integration.phone_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma integração configurada ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Conversas */}
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-blue-900">Conversas Ativas</CardTitle>
                <CardDescription>Acompanhe todas as conversas do WhatsApp</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Última Mensagem</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Não Lidas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{conversation.contactName}</TableCell>
                    <TableCell>{conversation.contactPhone}</TableCell>
                    <TableCell className="max-w-xs truncate">{conversation.lastMessage}</TableCell>
                    <TableCell>{conversation.lastMessageTime}</TableCell>
                    <TableCell>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive">{conversation.unreadCount}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WhatsApp;
