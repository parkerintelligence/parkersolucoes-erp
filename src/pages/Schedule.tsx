
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ScheduleGrid } from '@/components/ScheduleGrid';
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
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-slate-600">Carregando agendamentos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
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

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{pendingCount}</p>
                  <p className="text-sm text-blue-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
                  <p className="text-sm text-red-600">Críticos (≤30 dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{scheduleItems.length}</p>
                  <p className="text-sm text-green-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Grid de Agendamentos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Agendamentos</h2>
          <ScheduleGrid 
            items={scheduleItems}
            onUpdate={handleUpdateScheduleItem}
            onDelete={handleDeleteScheduleItem}
          />
        </div>
        
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
    </Layout>
  );
};

export default Schedule;
