import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ScheduleTable } from '@/components/ScheduleTable';
import { ScheduleSummary } from '@/components/ScheduleSummary';
import { ScheduleDialog } from '@/components/ScheduleDialog';
import { ScheduleTypeDialog } from '@/components/ScheduleTypeDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, Plus, Settings } from 'lucide-react';
import { useScheduleItems, useUpdateScheduleItem, useDeleteScheduleItem } from '@/hooks/useScheduleItems';

const Schedule = () => {
  const { isAuthenticated } = useAuth();
  const { data: scheduleItems = [], isLoading } = useScheduleItems();
  const updateScheduleItem = useUpdateScheduleItem();
  const deleteScheduleItem = useDeleteScheduleItem();
  
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleUpdateScheduleItem = (id: string, updates: Parameters<typeof updateScheduleItem.mutate>[0]['updates']) => {
    updateScheduleItem.mutate({ id, updates });
  };

  const handleDeleteScheduleItem = (id: string) => {
    deleteScheduleItem.mutate(id);
  };

  const pendingCount = scheduleItems.filter(item => item.status === 'pending').length;
  const overdueCount = scheduleItems.filter(item => {
    const today = new Date();
    const dueDate = new Date(item.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && item.status === 'pending';
  }).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600">Carregando agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Resumo compacto no canto superior direito */}
      <ScheduleSummary items={scheduleItems} />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Agenda de Vencimentos
          </h1>
          <p className="text-slate-600">Gerencie certificados, licenças e atualizações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTypeDialog(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Novo Tipo
          </Button>
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Agenda
          </Button>
        </div>
      </div>

      {/* Tabela de Agendamentos */}
      <ScheduleTable 
        items={scheduleItems}
        onUpdate={handleUpdateScheduleItem}
        onDelete={handleDeleteScheduleItem}
      />
      
      {/* Dialogs */}
      <ScheduleDialog 
        open={showScheduleDialog} 
        onOpenChange={setShowScheduleDialog} 
      />
      <ScheduleTypeDialog 
        open={showTypeDialog} 
        onOpenChange={setShowTypeDialog} 
      />
    </div>
  );
};

export default Schedule;