import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleForm } from './ScheduleForm';
import { useCreateScheduleItem } from '@/hooks/useScheduleItems';


interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleDialog = ({ open, onOpenChange }: ScheduleDialogProps) => {
  const createScheduleItem = useCreateScheduleItem();

  const handleSubmit = async (data: any) => {
    try {
      await createScheduleItem.mutateAsync(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Agenda</DialogTitle>
          <DialogDescription>
            Crie um novo agendamento para controle de vencimentos.
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
};