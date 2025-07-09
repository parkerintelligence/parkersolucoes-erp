
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Phone, 
  Search, 
  RefreshCw, 
  Users, 
  Clock, 
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WhatsAppChats = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  const { 
    conversations, 
    isLoading, 
    error, 
    refetch,
    syncConversations
  } = useWhatsAppConversations();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleSync = async () => {
    await syncConversations();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact_phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conversas WhatsApp</h1>
            <p className="text-muted-foreground">Gerencie suas conversas do WhatsApp</p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar conversas</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conversas WhatsApp</h1>
            <p className="text-muted-foreground">Gerencie suas conversas do WhatsApp</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar
          </Button>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              Conversas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {conversations.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {conversations.reduce((total, c) => total + (c.unread_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensagens não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Conversas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversas ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Carregando conversas...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma conversa encontrada para "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma conversa encontrada</p>
                    <p className="text-sm">
                      Sincronize com a API para carregar as conversas
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{conversation.contact_name}</h3>
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        {conversation.unread_count > 0 && (
                          <Badge variant="secondary">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {conversation.contact_phone}
                      </p>
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {conversation.last_message}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {conversation.last_message_time
                        ? formatDistanceToNow(new Date(conversation.last_message_time), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : 'Sem mensagens'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detalhes da Conversa */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedConversation.contact_name}</h3>
                  <p className="text-muted-foreground">{selectedConversation.contact_phone}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className={getStatusColor(selectedConversation.status)}>
                      {selectedConversation.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Mensagens não lidas</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.unread_count || 0}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Última mensagem</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.last_message || 'Nenhuma mensagem'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Última atividade</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.last_message_time
                      ? new Date(selectedConversation.last_message_time).toLocaleString('pt-BR')
                      : 'Sem registro'}
                  </p>
                </div>
                
                <Separator />
                
                <Button className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                <p>Selecione uma conversa para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppChats;
