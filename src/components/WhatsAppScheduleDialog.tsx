import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { data: integrations = [] } = useIntegrations();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filtrar integrações da Evolution API
  const evolutionIntegrations = integrations.filter(integration => 
    integration.type === 'evolution_api' && integration.is_active
  );

  useEffect(() => {
    if (evolutionIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(evolutionIntegrations[0].id);
    }
  }, [evolutionIntegrations, selectedIntegration]);

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

  const handleSendMessage = async () => {
    if (!phoneNumber || !message || !selectedIntegration) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const integration = evolutionIntegrations.find(i => i.id === selectedIntegration);
      
      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      console.log('Enviando mensagem via Evolution API:', {
        url: `${integration.base_url}/message/sendText/${integration.phone_number}`,
        phoneNumber: phoneNumber,
        messageLength: message.length,
        integration: integration.name
      });

      const response = await fetch(`${integration.base_url}/message/sendText/${integration.phone_number}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': integration.api_token || '',
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: message,
        }),
      });

      console.log('Resposta da Evolution API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        toast({
          title: "✅ Mensagem enviada!",
          description: `Mensagem enviada com sucesso para ${phoneNumber}`,
        });
        onOpenChange(false);
        setPhoneNumber('');
        setMessage('');
        setSelectedTemplate('');
      } else {
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Verifique a configuração da Evolution API.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie os dados do agendamento por WhatsApp usando a Evolution API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção da Integração */}
          {evolutionIntegrations.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="integration">Integração Evolution API</Label>
              <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a integração" />
                </SelectTrigger>
                <SelectContent>
                  {evolutionIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name} - {integration.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Nenhuma integração Evolution API configurada. Configure uma integração no painel de administração.
              </p>
            </div>
          )}

          {/* Número de telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número de telefone *</Label>
            <div className="relative">
              <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="5511999999999"
                className="pl-8"
                maxLength={13}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite apenas números (ex: 5511999999999)
            </p>
          </div>

          {/* Modelo de mensagem */}
          <div className="space-y-2">
            <Label htmlFor="template">Modelo de mensagem</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem ou selecione um modelo acima"
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              A mensagem será personalizada com os dados do agendamento
            </p>
          </div>

          {/* Resumo do agendamento */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <h4 className="text-sm font-medium">Dados do agendamento:</h4>
            <p className="text-xs"><strong>Título:</strong> {scheduleItem.title}</p>
            <p className="text-xs"><strong>Empresa:</strong> {scheduleItem.company}</p>
            <p className="text-xs"><strong>Vencimento:</strong> {format(new Date(scheduleItem.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
            <p className="text-xs"><strong>Tipo:</strong> {scheduleItem.type}</p>
            {scheduleItem.description && (
              <p className="text-xs"><strong>Descrição:</strong> {scheduleItem.description}</p>
            )}
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
              onClick={handleSendMessage}
              disabled={isLoading || !phoneNumber || !message || evolutionIntegrations.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};