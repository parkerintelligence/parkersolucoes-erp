
import { useState } from 'react';
import { ScheduleTable } from '@/components/ScheduleTable';
import { ScheduleDialog } from '@/components/ScheduleDialog';
import { ScheduleTypeDialog } from '@/components/ScheduleTypeDialog';
import { ScheduleCalendarView } from '@/components/ScheduleCalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Settings, Clock, CalendarDays } from 'lucide-react';
import { useScheduleItems, useUpdateScheduleItem, useDeleteScheduleItem } from '@/hooks/useScheduleItems';

const Schedule = () => {
  const {
    data: scheduleItems = [],
    isLoading
  } = useScheduleItems();
  const updateScheduleItem = useUpdateScheduleItem();
  const deleteScheduleItem = useDeleteScheduleItem();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  const handleUpdateScheduleItem = (id: string, updates: Parameters<typeof updateScheduleItem.mutate>[0]['updates']) => {
    updateScheduleItem.mutate({
      id,
      updates
    });
  };

  const handleDeleteScheduleItem = (id: string) => {
    deleteScheduleItem.mutate(id);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando agenda...</div>
      </div>;
  }

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-50">Agenda</h1>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Agendamentos Recorrentes
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Agenda de Vencimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <ScheduleCalendarView />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowTypeDialog(true)} variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar Sistemas/Serviços
            </Button>
            <Button onClick={() => setShowScheduleDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardContent className="p-4 bg-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{scheduleItems.length}</p>
                    <p className="text-sm text-blue-600">Total de Agendamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4 bg-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{scheduleItems.filter(item => item.status === 'pending').length}</p>
                    <p className="text-sm text-blue-600">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4 bg-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{scheduleItems.filter(item => {
                      const today = new Date();
                      const dueDate = new Date(item.due_date);
                      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 7 && item.status === 'pending';
                    }).length}</p>
                    <p className="text-sm text-blue-600">Críticos (&lt;7 dias)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Table */}
          <Card className="border-blue-200">
            <CardHeader className="bg-gray-900">
              <CardTitle className="text-slate-50">Agenda de Vencimentos</CardTitle>
              <CardDescription className="text-slate-50">Controle de certificados, licenças e atualizações</CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-900">
              <ScheduleTable items={scheduleItems} onUpdate={handleUpdateScheduleItem} onDelete={handleDeleteScheduleItem} />
            </CardContent>
          </Card>
          
          {/* Dialogs */}
          <ScheduleDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog} />
          <ScheduleTypeDialog open={showTypeDialog} onOpenChange={setShowTypeDialog} />
        </TabsContent>
      </Tabs>
    </div>;
};

export default Schedule;
