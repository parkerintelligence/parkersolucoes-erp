import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';

interface ScheduleItem {
  id: string;
  title: string;
  company: string;
  type: string;
  status: string;
  due_date: string;
  description?: string;
}

interface GLPITicketConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleItem: ScheduleItem;
}

const URGENCY_OPTIONS = [
  { value: 1, label: 'Muito baixa' },
  { value: 2, label: 'Baixa' },
  { value: 3, label: 'Média' },
  { value: 4, label: 'Alta' },
  { value: 5, label: 'Muito alta' },
];

const IMPACT_OPTIONS = [
  { value: 1, label: 'Muito baixo' },
  { value: 2, label: 'Baixo' },
  { value: 3, label: 'Médio' },
  { value: 4, label: 'Alto' },
  { value: 5, label: 'Muito alto' },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Muito baixa' },
  { value: 2, label: 'Baixa' },
  { value: 3, label: 'Média' },
  { value: 4, label: 'Alta' },
  { value: 5, label: 'Muito alta' },
];

export const GLPITicketConfirmDialog = ({ open, onOpenChange, scheduleItem }: GLPITicketConfirmDialogProps) => {
  const { createTicket } = useGLPIExpanded();
  
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntilDue = getDaysUntilDue(scheduleItem.due_date);
  const isUrgent = daysUntilDue <= 7;

  const [ticketData, setTicketData] = useState({
    name: `Agendamento: ${scheduleItem.title}`,
    content: `Empresa: ${scheduleItem.company}\nTipo: ${scheduleItem.type}\nVencimento: ${format(new Date(scheduleItem.due_date), 'dd/MM/yyyy', { locale: ptBR })}\nDescrição: ${scheduleItem.description || 'N/A'}`,
    urgency: isUrgent ? 5 : 3,
    impact: 3,
    priority: isUrgent ? 5 : 3,
    status: 1,
    type: 1,
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTicket = async () => {
    setIsCreating(true);
    try {
      await createTicket.mutateAsync(ticketData);
      toast({
        title: "✅ Ticket criado com sucesso!",
        description: "O ticket foi criado no GLPI e você pode acompanhar o progresso.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "❌ Erro ao criar ticket",
        description: "Não foi possível criar o ticket no GLPI. Verifique a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Criar Ticket GLPI
          </DialogTitle>
          <DialogDescription>
            Confirme e edite os dados antes de criar o ticket no GLPI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alerta para tickets urgentes */}
          {isUrgent && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">
                Item com vencimento crítico ({daysUntilDue} dias). Configurado como alta prioridade.
              </p>
            </div>
          )}

          {/* Dados do agendamento */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <h4 className="text-sm font-medium">Dados do agendamento:</h4>
            <p className="text-xs"><strong>Empresa:</strong> {scheduleItem.company}</p>
            <p className="text-xs"><strong>Tipo:</strong> {scheduleItem.type}</p>
            <p className="text-xs"><strong>Vencimento:</strong> {format(new Date(scheduleItem.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
            {scheduleItem.description && (
              <p className="text-xs"><strong>Descrição:</strong> {scheduleItem.description}</p>
            )}
          </div>

          {/* Título do ticket */}
          <div className="space-y-2">
            <Label htmlFor="ticket-title">Título do Ticket</Label>
            <Input
              id="ticket-title"
              value={ticketData.name}
              onChange={(e) => setTicketData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Título do ticket"
            />
          </div>

          {/* Descrição do ticket */}
          <div className="space-y-2">
            <Label htmlFor="ticket-content">Descrição do Ticket</Label>
            <Textarea
              id="ticket-content"
              value={ticketData.content}
              onChange={(e) => setTicketData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Descrição detalhada do ticket"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Configurações do ticket */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgência</Label>
              <Select value={ticketData.urgency.toString()} onValueChange={(value) => setTicketData(prev => ({ ...prev, urgency: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impacto</Label>
              <Select value={ticketData.impact.toString()} onValueChange={(value) => setTicketData(prev => ({ ...prev, impact: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={ticketData.priority.toString()} onValueChange={(value) => setTicketData(prev => ({ ...prev, priority: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={isCreating || !ticketData.name || !ticketData.content}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>Criando...</>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Criar Ticket
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};