import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap } from 'lucide-react';

interface ChatwootQuickRepliesProps {
  onSelectReply: (text: string) => void;
}

const quickReplies = [
  { label: 'Olá! Como posso ajudar?', text: 'Olá! Como posso ajudar você hoje?' },
  { label: 'Obrigado pelo contato', text: 'Obrigado por entrar em contato conosco!' },
  { label: 'Em análise', text: 'Estamos analisando sua solicitação e retornaremos em breve.' },
  { label: 'Resolvido', text: 'Sua solicitação foi resolvida. Se precisar de mais ajuda, estamos à disposição!' },
  { label: 'Aguarde um momento', text: 'Por favor, aguarde um momento enquanto verifico as informações.' },
  { label: 'Horário de atendimento', text: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.' },
  { label: 'Mais informações', text: 'Para prosseguir, preciso de mais informações. Pode me enviar mais detalhes?' },
  { label: 'Encaminhado', text: 'Sua solicitação foi encaminhada para o setor responsável.' },
];

export const ChatwootQuickReplies = ({ onSelectReply }: ChatwootQuickRepliesProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Respostas Rápidas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ScrollArea className="h-80">
          <div className="p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Selecione uma resposta rápida:
            </p>
            <div className="space-y-1">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-2"
                  onClick={() => onSelectReply(reply.text)}
                >
                  <div>
                    <p className="text-sm font-medium">{reply.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {reply.text}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
