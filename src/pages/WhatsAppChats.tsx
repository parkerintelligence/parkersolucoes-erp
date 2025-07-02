
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatwootSimpleConfig } from '@/components/ChatwootSimpleConfig';
import { useIntegrations } from '@/hooks/useIntegrations';
import { MessageSquare } from 'lucide-react';

const WhatsAppChats = () => {
  const { data: integrations } = useIntegrations();
  const chatwootIntegration = integrations?.find(int => int.type === 'chatwoot');

  const handleStartChat = () => {
    // Implementar a lógica para iniciar um novo chat
    console.log('Starting a new chat...');
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              WhatsApp Chats
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
    </Layout>
  );
};

export default WhatsAppChats;
