import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, MessageCircle, Calendar } from 'lucide-react';
import { ChatwootConversation } from '@/hooks/useChatwootAPI';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatwootContactPanelProps {
  conversation: ChatwootConversation | null;
}

export const ChatwootContactPanel = ({ conversation }: ChatwootContactPanelProps) => {
  if (!conversation) {
    return (
      <Card className="h-full">
        <CardContent className="p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Selecione uma conversa para ver os detalhes do contato</p>
        </CardContent>
      </Card>
    );
  }

  const contact = conversation.meta?.sender;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações do Contato
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Nome</p>
              <p className="text-sm font-medium">{contact?.name || 'Não informado'}</p>
            </div>

            {contact?.phone_number && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Telefone
                </p>
                <p className="text-sm">{contact.phone_number}</p>
              </div>
            )}

            {contact?.email && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </p>
                <p className="text-sm">{contact.email}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Conversation Info */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Canal
              </p>
              <p className="text-sm capitalize">{conversation.channel || 'WhatsApp'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Criado em
              </p>
              <p className="text-sm">
                {format(new Date(conversation.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Última atividade</p>
              <p className="text-sm">
                {format(new Date(conversation.last_activity_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total de mensagens</p>
              <p className="text-sm">{conversation.messages?.length || 0}</p>
            </div>

            {conversation.unread_count > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Mensagens não lidas</p>
                <p className="text-sm font-semibold text-destructive">{conversation.unread_count}</p>
              </div>
            )}
          </div>

          {conversation.additional_attributes && Object.keys(conversation.additional_attributes).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Atributos Adicionais</p>
                <div className="space-y-2">
                  {Object.entries(conversation.additional_attributes).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-medium">{key}:</span>{' '}
                      <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
