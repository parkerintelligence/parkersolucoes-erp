
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy, X } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface WhatsAppPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: {
    name: string;
    username: string;
    password: string;
    url?: string;
    company?: string;
    service?: string;
    notes?: string;
  };
}

export const WhatsAppPasswordDialog = ({ open, onOpenChange, password }: WhatsAppPasswordDialogProps) => {
  const { data: integrations } = useIntegrations();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatMessage = () => {
    let message = `🔐 *${password.name}*\n\n`;
    
    if (password.company) {
      message += `🏢 *Empresa:* ${password.company}\n`;
    }
    
    if (password.service) {
      message += `⚙️ *Serviço:* ${password.service}\n`;
    }
    
    if (password.url) {
      message += `🌐 *URL:* ${password.url}\n`;
    }
    
    message += `👤 *Usuário:* ${password.username}\n`;
    message += `🔑 *Senha:* ${password.password}\n`;
    
    if (password.notes) {
      message += `\n📌 *Observações:*\n${password.notes}\n`;
    }
    
    message += `\n🕒 Compartilhado em: ${new Date().toLocaleString('pt-BR')}`;
    
    return message;
  };

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Digite o número do WhatsApp para enviar a senha.",
        variant: "destructive",
      });
      return;
    }

    const evolutionApiIntegration = integrations?.find(int => int.type === 'evolution_api');
    
    if (!evolutionApiIntegration) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a Evolution API no painel administrativo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationAny = evolutionApiIntegration as any;
      const instanceName = integrationAny.instance_name || 'main_instance';
      const message = formatMessage();

      const response = await fetch(`${evolutionApiIntegration.base_url}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiIntegration.api_token || '',
        },
        body: JSON.stringify({
          number: phoneNumber.replace(/\D/g, ''),
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }

      toast({
        title: "✅ Senha enviada!",
        description: `Senha enviada para ${phoneNumber}`,
      });
      
      onOpenChange(false);
      setPhoneNumber('');
    } catch (error) {
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar a senha via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar Senha via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Compartilhe esta senha via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de número */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: 5511999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              Digite o número completo com código do país (ex: 5511999999999)
            </p>
          </div>

          {/* Preview da mensagem */}
          <div className="space-y-2">
            <Label>Preview da mensagem:</Label>
            <Textarea
              value={formatMessage()}
              readOnly
              rows={8}
              className="resize-none text-xs font-mono"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || !phoneNumber.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                'Enviando...'
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
