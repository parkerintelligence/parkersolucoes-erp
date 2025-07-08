
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy, CheckCircle } from 'lucide-react';
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatMessage());
    toast({
      title: "Mensagem copiada!",
      description: "A mensagem foi copiada para a área de transferência.",
    });
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
        description: "Configure a Evolution API no painel administrativo primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!evolutionApiIntegration.is_active) {
      toast({
        title: "Evolution API inativa",
        description: "A Evolution API está desativada. Ative-a no painel administrativo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationAny = evolutionApiIntegration as any;
      const instanceName = integrationAny.instance_name || 'main_instance';
      const message = formatMessage();

      // Limpar o número de telefone (remover caracteres especiais)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      console.log('Enviando mensagem para:', cleanPhoneNumber);
      console.log('Instância:', instanceName);
      console.log('URL:', `${evolutionApiIntegration.base_url}/message/sendText/${instanceName}`);

      const response = await fetch(`${evolutionApiIntegration.base_url}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiIntegration.api_token || '',
        },
        body: JSON.stringify({
          number: cleanPhoneNumber,
          text: message,
        }),
      });

      console.log('Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na resposta:', errorData);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Resultado do envio:', result);

      toast({
        title: "✅ Senha enviada!",
        description: `Senha enviada com sucesso para ${phoneNumber}`,
      });
      
      onOpenChange(false);
      setPhoneNumber('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro no envio",
        description: "Não foi possível enviar a senha. Verifique a configuração da Evolution API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar Senha via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Compartilhe esta senha de forma segura via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de número */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">Número do WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: 5511999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-400">
              Digite o número completo com código do país (ex: 5511999999999)
            </p>
          </div>

          {/* Preview da mensagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Preview da mensagem:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            </div>
            <Textarea
              value={formatMessage()}
              readOnly
              rows={8}
              className="resize-none text-xs font-mono bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-slate-600 text-white hover:bg-slate-700"
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
