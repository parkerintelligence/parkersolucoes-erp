import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, MapPin, Building, Settings, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRecurringSchedules, useDeleteRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
import { RecurringScheduleDialog } from './RecurringScheduleDialog';
import { ScheduleTypeDialog } from './ScheduleTypeDialog';
import type { Tables } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;
type Company = Tables<'companies'>;

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface WeeklyViewProps {
  schedules: RecurringSchedule[];
  companies: any[];
  onEdit: (schedule: RecurringSchedule) => void;
  onDelete: (id: string) => void;
}

const WeeklyView = ({ schedules, companies, onEdit, onDelete }: WeeklyViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'N/A';
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Domingo como primeiro dia

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);

  const getSchedulesForDay = (dayOfWeek: number) => {
    return schedules.filter(schedule => 
      schedule.is_active && schedule.days_of_week?.includes(dayOfWeek)
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visualização Semanal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {' '}
              {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const daySchedules = getSchedulesForDay(index);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`p-3 border rounded-lg ${isToday ? 'bg-primary/5 border-primary' : 'bg-muted/30'}`}>
                <div className="text-center mb-2">
                  <div className="text-sm font-medium">{DAYS_OF_WEEK[index]}</div>
                  <div className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {date.getDate()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {daySchedules.map((schedule) => {
                    const companyName = getCompanyName(schedule.client_id);
                    
                    return (
                      <div
                        key={schedule.id}
                        className="p-2 bg-background rounded border text-xs cursor-pointer hover:bg-accent"
                        onClick={() => onEdit(schedule)}
                      >
                        <div className="font-medium truncate">{schedule.name}</div>
                        <div className="text-muted-foreground">
                          {formatTime(schedule.time_hour, schedule.time_minute)}
                        </div>
                        {companyName !== 'N/A' && (
                          <div className="text-muted-foreground truncate flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {companyName}
                          </div>
                        )}
                        {schedule.system_name && (
                          <div className="text-muted-foreground truncate">
                            📱 {schedule.system_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface MonthlyViewProps {
  schedules: RecurringSchedule[];
  companies: any[];
  onEdit: (schedule: RecurringSchedule) => void;
}

const MonthlyView = ({ schedules, companies, onEdit }: MonthlyViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'N/A';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias do mês anterior para completar a primeira semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(prevDate.getDate() - (i + 1));
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Dias do próximo mês para completar a última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const getSchedulesForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return schedules.filter(schedule => 
      schedule.is_active && schedule.days_of_week?.includes(dayOfWeek)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visualização Mensal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Dias do mês */}
          {monthDays.map((day, index) => {
            const daySchedules = getSchedulesForDay(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border rounded text-xs ${
                  day.isCurrentMonth 
                    ? isToday 
                      ? 'bg-primary/5 border-primary' 
                      : 'bg-background'
                    : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className={`text-center mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map((schedule) => {
                    const companyName = getCompanyName(schedule.client_id);
                    
                    return (
                      <div
                        key={schedule.id}
                        className="p-1 bg-accent rounded cursor-pointer hover:bg-accent/80"
                        onClick={() => onEdit(schedule)}
                      >
                        <div className="truncate font-medium">{schedule.name}</div>
                        {companyName !== 'N/A' && (
                          <div className="truncate text-xs text-muted-foreground">
                            {companyName}
                          </div>
                        )}
                        {schedule.system_name && (
                          <div className="truncate text-xs text-muted-foreground">
                            📱 {schedule.system_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {daySchedules.length > 2 && (
                    <div className="text-center text-muted-foreground">
                      +{daySchedules.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const ScheduleCalendarView = () => {
  const { data: schedules = [], isLoading } = useRecurringSchedules();
  const { data: companies = [] } = useCompanies();
  const deleteSchedule = useDeleteRecurringSchedule();
  
  const [showDialog, setShowDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [activeView, setActiveView] = useState<'week' | 'month' | 'list'>('week');

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'N/A';
  };

  const handleEdit = (schedule: RecurringSchedule) => {
    setEditingSchedule(schedule);
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteSchedule.mutate(id);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getDayNames = (days: number[]) => {
    return days.map(day => DAYS_OF_WEEK[day]).join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant={activeView === 'week' ? 'default' : 'outline'} 
            onClick={() => setActiveView('week')}
            size="sm"
          >
            Semana
          </Button>
          <Button 
            variant={activeView === 'month' ? 'default' : 'outline'} 
            onClick={() => setActiveView('month')}
            size="sm"
          >
            Mês
          </Button>
          <Button 
            variant={activeView === 'list' ? 'default' : 'outline'} 
            onClick={() => setActiveView('list')}
            size="sm"
          >
            Lista
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTypeDialog(true)} 
            variant="outline"
          >
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Sistemas/Serviços
          </Button>
          <Button onClick={() => { setEditingSchedule(null); setShowDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {activeView === 'week' && (
        <WeeklyView 
          schedules={schedules}
          companies={companies}
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      )}

      {activeView === 'month' && (
        <MonthlyView 
          schedules={schedules}
          companies={companies}
          onEdit={handleEdit}
        />
      )}

      {activeView === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>
                      {getCompanyName(schedule.client_id)}
                    </TableCell>
                    <TableCell>{schedule.system_name}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(schedule.time_hour, schedule.time_minute)}
                    </TableCell>
                    <TableCell>{getDayNames(schedule.days_of_week || [])}</TableCell>
                    <TableCell>
                      {schedule.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {schedule.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {schedules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento encontrado. Crie seu primeiro agendamento!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <RecurringScheduleDialog 
        isOpen={showDialog}
        onOpenChange={setShowDialog}
        editingSchedule={editingSchedule}
      />
      
      <ScheduleTypeDialog 
        open={showTypeDialog} 
        onOpenChange={setShowTypeDialog} 
      />
    </div>
  );
};