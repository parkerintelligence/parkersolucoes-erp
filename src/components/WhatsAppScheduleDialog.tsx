
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, User, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EvolutionApiService } from '@/utils/evolutionApiService';
import { WhatsAppErrorDialog } from './WhatsAppErrorDialog';

interface ScheduleItem {
  id: string;
  title: string;
  company: string;
  type: string;
  status: string;
  due_date: string;
  description?: string;
}

interface WhatsAppScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleItem: ScheduleItem;
}

// Modelos de mensagem predefinidos
const MESSAGE_TEMPLATES = [
  {
    id: 'reminder',
    name: 'Lembrete de Vencimento',
    content: `🔔 *Lembrete Importante*

Olá! Esperamos que esteja tudo bem.

Gostaríamos de lembrá-lo sobre o vencimento próximo:

📋 *Agendamento:* {title}
🏢 *Empresa:* {company}
📅 *Vencimento:* {dueDate}
📝 *Tipo:* {type}
📄 *Descrição:* {description}

Entre em contato conosco caso precise de alguma assistência.

Atenciosamente,
Equipe de Suporte`
  },
  {
    id: 'urgent',
    name: 'Vencimento Urgente',
    content: `🚨 *URGENTE - Vencimento Próximo*

Atenção! Identificamos um item com vencimento crítico:

📋 *Agendamento:* {title}
🏢 *Empresa:* {company}
📅 *Vencimento:* {dueDate}
📝 *Tipo:* {type}
📄 *Descrição:* {description}

⚠️ É necessária ação imediata para evitar problemas.

Entre em contato urgentemente: [seu telefone]

Equipe de Suporte`
  },
  {
    id: 'followup',
    name: 'Acompanhamento',
    content: `📋 *Acompanhamento de Agendamento*

Olá! Entramos em contato para acompanhar o item:

📋 *Agendamento:* {title}
🏢 *Empresa:* {company}
📅 *Vencimento:* {dueDate}
📝 *Tipo:* {type}
📄 *Descrição:* {description}

Precisam de alguma assistência? Estamos aqui para ajudar!

Atenciosamente,
Equipe de Suporte`
  }
];

export const WhatsAppScheduleDialog = ({ open, onOpenChange, scheduleItem }: WhatsAppScheduleDialogProps) => {
  const { data: integrations } = useIntegrations();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    error: any;
  }>({ open: false, error: null });

  // Filtrar integrações da Evolution API
  const evolutionIntegrations = integrations?.filter(integration => 
    integration.type === 'evolution_api' && integration.is_active
  ) || [];

  useEffect(() => {
    if (selectedTemplate) {
      const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        const processedMessage = template.content
          .replace('{title}', scheduleItem.title)
          .replace('{company}', scheduleItem.company)
          .replace('{dueDate}', format(new Date(scheduleItem.due_date), 'dd/MM/yyyy', { locale: ptBR }))
          .replace('{type}', scheduleItem.type)
          .replace('{description}', scheduleItem.description || 'N/A');
        
        setMessage(processedMessage);
      }
    }
  }, [selectedTemplate, scheduleItem]);

  const formatMessage = () => {
    return message || `📋 *${scheduleItem.title}*

🏢 *Empresa:* ${scheduleItem.company}
📅 *Vencimento:* ${format(new Date(scheduleItem.due_date), 'dd/MM/yyyy', { locale: ptBR })}
📝 *Tipo:* ${scheduleItem.type}
${scheduleItem.description ? `📄 *Descrição:* ${scheduleItem.description}` : ''}

🕒 Compartilhado em: ${new Date().toLocaleString('pt-BR')}`;
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
          description: "Digite o número do WhatsApp para enviar a mensagem.",
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

      const evolutionApiIntegration = evolutionIntegrations[0];
      
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

      // Validar se api_token e instance_name existem
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
      
      // Usar a integração completa diretamente
      const evolutionService = new EvolutionApiService(evolutionApiIntegration);
      const formattedPhone = formatPhoneForDisplay(phoneNumber);
      
      console.log('🚀 Iniciando envio da mensagem para:', formattedPhone);
      
      const result = await evolutionService.sendMessage(formattedPhone, formatMessage());

      if (result.success) {
        toast({
          title: "✅ Mensagem enviada com sucesso!",
          description: `Mensagem enviada para ${formattedPhone} via WhatsApp`,
        });
        
        onOpenChange(false);
        setPhoneNumber('');
        setMessage('');
        setSelectedTemplate('');
      } else {
        console.error('❌ Falha no envio:', result.error);
        setErrorDialog({
          open: true,
          error: result.error
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Enviar via WhatsApp
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Compartilhe os dados do agendamento de forma segura via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status da Evolution API */}
            {evolutionIntegrations.length > 0 ? (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-sm text-green-300">
                  ✅ Evolution API configurada: {evolutionIntegrations[0].name}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-300">
                  ⚠️ Nenhuma integração Evolution API configurada. Configure uma integração no painel de administração.
                </p>
              </div>
            )}

            {/* Campo de número */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Número do WhatsApp</Label>
              <div className="relative">
                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: 5511999999999 ou 11999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-8 font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o número com ou sem código do país (55). Mínimo 10 dígitos.
              </p>
            </div>

            {/* Modelo de mensagem */}
            <div className="space-y-2">
              <Label htmlFor="template" className="text-foreground">Modelo de mensagem</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  {MESSAGE_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="text-foreground hover:bg-muted">
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview da mensagem */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Preview da mensagem:</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-muted-foreground border-border hover:bg-secondary"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <Textarea
                value={formatMessage()}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem ou selecione um modelo acima"
                rows={8}
                className="resize-none text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                A mensagem será personalizada com os dados do agendamento
              </p>
            </div>

            {/* Resumo do agendamento */}
            <div className="p-3 bg-secondary rounded-lg space-y-1 border border-border">
              <h4 className="text-sm font-medium text-foreground">Dados do agendamento:</h4>
              <p className="text-xs text-muted-foreground"><strong>Título:</strong> {scheduleItem.title}</p>
              <p className="text-xs text-muted-foreground"><strong>Empresa:</strong> {scheduleItem.company}</p>
              <p className="text-xs text-muted-foreground"><strong>Vencimento:</strong> {format(new Date(scheduleItem.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p className="text-xs text-muted-foreground"><strong>Tipo:</strong> {scheduleItem.type}</p>
              {scheduleItem.description && (
                <p className="text-xs text-muted-foreground"><strong>Descrição:</strong> {scheduleItem.description}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-border text-foreground hover:bg-secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !phoneNumber.trim() || evolutionIntegrations.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
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
