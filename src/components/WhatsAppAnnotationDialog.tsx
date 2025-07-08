
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { EvolutionApiService } from '@/utils/evolutionApiService';

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

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Aceitar números brasileiros: 11 dígitos (DDD + número) ou 13 dígitos (55 + DDD + número)
    return (cleaned.length === 11 || cleaned.length === 13) && 
           (cleaned.length === 13 ? cleaned.startsWith('55') : true);
  };

  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    return cleaned;
  };

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "❌ Número obrigatório",
        description: "Digite o número do WhatsApp para enviar a anotação.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "❌ Número inválido",
        description: "Digite um número válido:\n• 11 dígitos: 11999999999\n• 13 dígitos: 5511999999999",
        variant: "destructive",
      });
      return;
    }

    const evolutionApiIntegration = integrations?.find(int => int.type === 'evolution_api' && int.is_active);
    
    if (!evolutionApiIntegration) {
      toast({
        title: "❌ Evolution API não configurada",
        description: "Configure uma Evolution API ativa no painel administrativo primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!evolutionApiIntegration.api_token) {
      toast({
        title: "❌ Token da API não configurado",
        description: "Configure o token da Evolution API no painel administrativo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const evolutionService = new EvolutionApiService(evolutionApiIntegration);
      const formattedPhone = formatPhoneForDisplay(phoneNumber);
      
      console.log('🚀 Iniciando envio da anotação para:', formattedPhone);
      console.log('📱 Usando instância:', (evolutionApiIntegration as any).instance_name);
      console.log('🌐 URL base:', evolutionApiIntegration.base_url);
      
      const result = await evolutionService.sendMessage(formattedPhone, formatMessage());

      if (result.success) {
        toast({
          title: "✅ Anotação enviada com sucesso!",
          description: `Anotação enviada para ${formattedPhone} via WhatsApp`,
        });
        
        onOpenChange(false);
        setPhoneNumber('');
      } else {
        console.error('❌ Erro detalhado:', result.error);
        toast({
          title: "❌ Falha no envio",
          description: result.error || "Erro desconhecido ao enviar mensagem",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro crítico:', error);
      toast({
        title: "❌ Erro crítico",
        description: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
              placeholder="Ex: 5511999999999 ou 11999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-400">
              Digite o número com ou sem código do país (55). Mínimo 10 dígitos.
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
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
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
