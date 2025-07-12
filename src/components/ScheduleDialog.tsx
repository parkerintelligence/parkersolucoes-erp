import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleForm } from './ScheduleForm';
import { useCreateScheduleItem, useUpdateScheduleItem } from '@/hooks/useScheduleItems';

interface ScheduleItem {
  id: string;
  title: string;
  company: string;
  type: string;
  status: string;
  due_date: string;
  description?: string;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: ScheduleItem | null;
  onUpdate?: (id: string, updates: Partial<ScheduleItem>) => void;
}

export const ScheduleDialog = ({ open, onOpenChange, editingItem, onUpdate }: ScheduleDialogProps) => {
  const createScheduleItem = useCreateScheduleItem();
  const updateScheduleItem = useUpdateScheduleItem();

  const handleSubmit = async (data: any, createGLPITicket?: boolean) => {
    try {
      if (editingItem) {
        await updateScheduleItem.mutateAsync({ id: editingItem.id, updates: data });
        onUpdate?.(editingItem.id, data);
      } else {
        const result = await createScheduleItem.mutateAsync(data);
        
        // Se solicitado, criar chamado no GLPI
        if (createGLPITicket && result) {
          // Aqui poderia implementar a criação do chamado no GLPI
          // usando a data de vencimento como referência
          console.log('Criando chamado no GLPI para:', data);
        }
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">{editingItem ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {editingItem ? 'Edite o agendamento.' : 'Crie um novo agendamento para controle de vencimentos.'}
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm onSubmit={handleSubmit} initialData={editingItem} />
      </DialogContent>
    </Dialog>
  );
};