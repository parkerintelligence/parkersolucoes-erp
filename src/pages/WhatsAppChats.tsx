
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, RefreshCw, Send, Search, Archive, Ban } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';

const WhatsAppChats = () => {
  const { data: integrations = [], isLoading: integrationsLoading } = useIntegrations();
  const { data: conversations = [], isLoading: conversationsLoading, refetch } = useWhatsAppConversations();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const whatsappIntegrations = integrations.filter(i => 
    (i.type === 'chatwoot' || i.type === 'evolution_api') && i.is_active
  );
  
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.contact_phone.includes(searchTerm) ||
                         (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIntegration = selectedIntegration === '' || conv.integration_id === selectedIntegration;
    return matchesSearch && matchesIntegration;
  });

  const getStatusBadge = (status: string | null) => {
    const statusValue = status || 'active';
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'archived': 'bg-gray-100 text-gray-800 border-gray-200',
      'blocked': 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      'active': 'Ativo',
      'archived': 'Arquivado',
      'blocked': 'Bloqueado',
    };
    return <Badge className={colors[statusValue as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>{labels[statusValue as keyof typeof labels] || statusValue}</Badge>;
  };

  const getIntegrationName = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    return integration?.name || 'Integração não encontrada';
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Sem horário';
    
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Agora';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      if (diffDays < 7) return `${diffDays}d atrás`;
      
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Horário inválido';
    }
  };

  const activeConversations = filteredConversations.filter(c => c.status === 'active' || !c.status);
  const totalUnread = filteredConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  if (integrationsLoading || conversationsLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-blue-600">Carregando conversas...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Conversas do WhatsApp
            </h1>
            <p className="text-blue-600">Acompanhe todas as conversas dos números vinculados</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas das Conversas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{filteredConversations.length}</p>
                  <p className="text-sm text-blue-600">Total de Conversas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{activeConversations.length}</p>
                  <p className="text-sm text-green-600">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">{totalUnread}</p>
                  <p className="text-sm text-orange-600">Não Lidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{whatsappIntegrations.length}</p>
                  <p className="text-sm text-purple-600">Integrações Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por integração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as integrações</SelectItem>
                  {whatsappIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name} - {integration.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Conversas */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Conversas</CardTitle>
            <CardDescription>
              {filteredConversations.length > 0 
                ? `Mostrando ${filteredConversations.length} conversas`
                : 'Nenhuma conversa encontrada'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredConversations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Última Mensagem</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Integração</TableHead>
                    <TableHead>Não Lidas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conversation) => (
                    <TableRow key={conversation.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{conversation.contact_name}</TableCell>
                      <TableCell>{conversation.contact_phone}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {conversation.last_message || 'Sem mensagens'}
                      </TableCell>
                      <TableCell>{formatTime(conversation.last_message_time)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getIntegrationName(conversation.integration_id)}
                      </TableCell>
                      <TableCell>
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge variant="destructive">{conversation.unread_count}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" title="Responder">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" title="Arquivar">
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" title="Bloquear">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada com os filtros aplicados.</p>
                {whatsappIntegrations.length === 0 && (
                  <p className="text-sm mt-2">Configure uma integração WhatsApp no menu Administração primeiro.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WhatsAppChats;
