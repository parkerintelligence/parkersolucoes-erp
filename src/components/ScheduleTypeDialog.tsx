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
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Novo Tipo de Agenda</DialogTitle>
          <DialogDescription className="text-gray-400">
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