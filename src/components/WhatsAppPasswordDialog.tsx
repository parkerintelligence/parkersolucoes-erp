
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppErrorDialog } from './WhatsAppErrorDialog';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    error: any;
  }>({ open: false, error: null });

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

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
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
    try {
      if (!phoneNumber.trim()) {
        toast({
          title: "❌ Número obrigatório",
          description: "Digite o número do WhatsApp para enviar a senha.",
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

      console.log('🔍 Verificando integrações disponíveis...');
      console.log('📋 Integrações encontradas:', integrations);

      const evolutionApiIntegration = integrations?.find(int => 
        int.type === 'evolution_api' && int.is_active
      );
      
      if (!evolutionApiIntegration) {
        console.error('❌ Nenhuma integração Evolution API ativa encontrada');
        toast({
          title: "❌ Evolution API não configurada",
          description: "Configure uma Evolution API ativa no painel administrativo primeiro.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Integração Evolution API encontrada:', {
        id: evolutionApiIntegration.id,
        name: evolutionApiIntegration.name,
        base_url: evolutionApiIntegration.base_url,
        instance_name: evolutionApiIntegration.instance_name,
        hasToken: !!evolutionApiIntegration.api_token
      });

      if (!evolutionApiIntegration.api_token || !evolutionApiIntegration.instance_name) {
        console.error('❌ Configuração incompleta da Evolution API');
        toast({
          title: "❌ Configuração incompleta",
          description: "API Token e Nome da Instância são obrigatórios na configuração da Evolution API.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      
      const formattedPhone = formatPhoneForDisplay(phoneNumber);
      
      console.log('🚀 Enviando via Edge Function para:', formattedPhone);
      
      // Usar edge function como proxy (igual automação e outras integrações)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: evolutionApiIntegration.id,
          phoneNumber: formattedPhone,
          message: formatMessage(),
        }),
      });

      const result = await response.json();
      
      console.log('📥 Resposta da Edge Function:', result);

      if (result.success) {
        toast({
          title: "✅ Senha enviada com sucesso!",
          description: `Senha enviada para ${formattedPhone} via WhatsApp`,
        });
        
        onOpenChange(false);
        setPhoneNumber('');
      } else {
        console.error('❌ Falha no envio:', result.error);
        setErrorDialog({
          open: true,
          error: {
            message: result.error || 'Erro ao enviar mensagem',
            details: result.details || 'Verifique a configuração da Evolution API',
            logs: []
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro crítico no handleSend:', error);
      setErrorDialog({
        open: true,
        error: {
          message: 'Erro crítico no sistema',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          logs: [`Erro crítico: ${error}`]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

      {/* Diálogo de erro */}
      <WhatsAppErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        error={errorDialog.error}
      />
    </>
  );
};
