
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface WhatsAppAnnotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annotation: {
    name: string;
    annotation: string;
    company?: string;
    service?: string;
    notes?: string;
  };
}

export const WhatsAppAnnotationDialog = ({ open, onOpenChange, annotation }: WhatsAppAnnotationDialogProps) => {
  const { data: integrations } = useIntegrations();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatMessage = () => {
    let message = `📝 *${annotation.name}*\n\n`;
    
    if (annotation.company) {
      message += `🏢 *Empresa:* ${annotation.company}\n`;
    }
    
    if (annotation.service) {
      message += `⚙️ *Serviço:* ${annotation.service}\n`;
    }
    
    message += `📄 *Anotação:*\n${annotation.annotation}\n`;
    
    if (annotation.notes) {
      message += `\n📌 *Observações:*\n${annotation.notes}\n`;
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

  const normalizeUrl = (baseUrl: string) => {
    // Remove trailing slash if present
    const cleanUrl = baseUrl.replace(/\/$/, '');
    return cleanUrl;
  };

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Digite o número do WhatsApp para enviar a anotação.",
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

    if (!evolutionApiIntegration.api_token) {
      toast({
        title: "Token da API não configurado",
        description: "Configure o token da Evolution API no painel administrativo.",
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
      
      // Normalizar a URL base
      const baseUrl = normalizeUrl(evolutionApiIntegration.base_url);
      const fullUrl = `${baseUrl}/message/sendText/${instanceName}`;
      
      console.log('Tentando enviar anotação para:', cleanPhoneNumber);
      console.log('Instância:', instanceName);
      console.log('URL completa:', fullUrl);
      console.log('Token:', evolutionApiIntegration.api_token ? 'Configurado' : 'Não configurado');

      const requestBody = {
        number: cleanPhoneNumber,
        text: message,
      };

      console.log('Payload da requisição:', requestBody);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiIntegration.api_token,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Status da resposta:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da API:', errorText);
        
        // Tentar com header Authorization como fallback
        if (response.status === 401) {
          console.log('Tentando com header Authorization...');
          const retryResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${evolutionApiIntegration.api_token}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            console.log('Sucesso com Authorization header:', retryResult);
            
            toast({
              title: "✅ Anotação enviada!",
              description: `Anotação enviada com sucesso para ${phoneNumber}`,
            });
            
            onOpenChange(false);
            setPhoneNumber('');
            return;
          } else {
            const retryErrorText = await retryResponse.text();
            console.error('Erro mesmo com Authorization header:', retryErrorText);
          }
        }
        
        throw new Error(`Erro ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log('Resultado do envio:', result);

      toast({
        title: "✅ Anotação enviada!",
        description: `Anotação enviada com sucesso para ${phoneNumber}`,
      });
      
      onOpenChange(false);
      setPhoneNumber('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      let errorMessage = "Não foi possível enviar a anotação. Verifique a configuração da Evolution API.";
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Erro de autenticação. Verifique o token da Evolution API.";
        } else if (error.message.includes('404')) {
          errorMessage = "Endpoint não encontrado. Verifique a URL da Evolution API.";
        } else if (error.message.includes('500')) {
          errorMessage = "Erro interno do servidor da Evolution API.";
        }
      }
      
      toast({
        title: "❌ Erro no envio",
        description: errorMessage,
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
            Enviar Anotação via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Compartilhe esta anotação de forma segura via WhatsApp
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
