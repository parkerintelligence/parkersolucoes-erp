import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatwootSimpleConfig } from '@/components/ChatwootSimpleConfig';
import { ChatwootMessageDialog } from '@/components/ChatwootMessageDialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

const WhatsAppChats = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { data: integrations } = useIntegrations();
  const chatwootIntegration = integrations?.find(int => int.type === 'chatwoot');

  const refetchConversations = () => {
    // Implementar a lógica para buscar novamente as conversas
    console.log('Refetching conversations...');
  };

  const handleMessageSent = () => {
    refetchConversations();
    setSelectedConversation(null);
  };

  const handleStartChat = () => {
    // Implementar a lógica para iniciar um novo chat
    console.log('Starting a new chat...');
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              WhatsApp Chats (via Chatwoot)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chatwootIntegration ? (
              <>
                <p className="text-sm text-gray-500">
                  Conectado via Chatwoot: {chatwootIntegration.base_url}
                </p>
                <Button onClick={handleStartChat}>Iniciar Nova Conversa</Button>
              </>
            ) : (
              <ChatwootSimpleConfig />
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedConversation && (
        <ChatwootMessageDialog
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onMessageSent={handleMessageSent}
        />
      )}
    </Layout>
  );
};

export default WhatsAppChats;
