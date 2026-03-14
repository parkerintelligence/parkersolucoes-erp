import { useState } from 'react';
import { ScheduleTable } from '@/components/ScheduleTable';
import { ScheduleDialog } from '@/components/ScheduleDialog';
import { ScheduleTypeDialog } from '@/components/ScheduleTypeDialog';
import { ScheduleCalendarView } from '@/components/ScheduleCalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Clock, CalendarDays, Target, AlertTriangle } from 'lucide-react';
import { useScheduleItems, useUpdateScheduleItem, useDeleteScheduleItem } from '@/hooks/useScheduleItems';

const Schedule = () => {
  const { data: scheduleItems = [], isLoading } = useScheduleItems();
  const updateScheduleItem = useUpdateScheduleItem();
  const deleteScheduleItem = useDeleteScheduleItem();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  const handleUpdateScheduleItem = (id: string, updates: Parameters<typeof updateScheduleItem.mutate>[0]['updates']) => {
    updateScheduleItem.mutate({ id, updates });
  };

  const handleDeleteScheduleItem = (id: string) => {
    deleteScheduleItem.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  const pendingCount = scheduleItems.filter(item => item.status === 'pending').length;
  const criticalCount = scheduleItems.filter(item => {
    const today = new Date();
    const dueDate = new Date(item.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && item.status === 'pending';
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Agenda
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie agendamentos recorrentes e agenda de vencimentos
          </p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="calendar" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Agendamentos Recorrentes
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="h-3.5 w-3.5" />
            Agenda de Vencimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <ScheduleCalendarView />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowTypeDialog(true)} variant="outline" size="sm" className="h-8 text-xs">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Gerenciar Sistemas/Serviços
            </Button>
            <Button onClick={() => setShowScheduleDialog(true)} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo Agendamento
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: scheduleItems.length, icon: Target, color: "text-primary" },
              { label: "Pendentes", value: pendingCount, icon: Clock, color: "text-amber-500" },
              { label: "Críticos (<7 dias)", value: criticalCount, icon: AlertTriangle, color: "text-destructive" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
                <div className="min-w-0">
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Table */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Agenda de Vencimentos
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Controle de certificados, licenças e atualizações — passe o mouse para detalhes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleTable items={scheduleItems} onUpdate={handleUpdateScheduleItem} onDelete={handleDeleteScheduleItem} />
            </CardContent>
          </Card>

          <ScheduleDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog} />
          <ScheduleTypeDialog open={showTypeDialog} onOpenChange={setShowTypeDialog} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Schedule;
