import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleTypeForm } from './ScheduleTypeForm';
import { useCreateScheduleType, CreateScheduleTypeData } from '@/hooks/useScheduleTypes';

interface ScheduleTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleTypeDialog = ({ open, onOpenChange }: ScheduleTypeDialogProps) => {
  const createScheduleType = useCreateScheduleType();

  const handleSubmit = async (data: CreateScheduleTypeData) => {
    try {
      await createScheduleType.mutateAsync(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Tipo de Agenda</DialogTitle>
          <DialogDescription>
            Crie um novo tipo para categorizar seus agendamentos.
          </DialogDescription>
        </DialogHeader>
        <ScheduleTypeForm 
          onSubmit={handleSubmit} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};