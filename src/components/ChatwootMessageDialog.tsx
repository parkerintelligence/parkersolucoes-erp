
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';

interface ChatwootMessageDialogProps {
  conversation: ChatwootConversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatwootMessageDialog = ({ conversation, open, onOpenChange }: ChatwootMessageDialogProps) => {
  const [message, setMessage] = useState('');
  const { sendMessage } = useChatwootAPI();

  const handleSendMessage = async () => {
    if (!conversation || !message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: conversation.id,
        content: message.trim()
      });
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!conversation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Send className="h-5 w-5 text-blue-400" />
            Enviar Mensagem
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enviando mensagem para: <strong>{conversation.meta.sender.name}</strong> ({conversation.meta.sender.phone_number})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
              Mensagem
            </label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || sendMessage.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendMessage.isPending ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
