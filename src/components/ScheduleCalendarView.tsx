import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, MapPin, Building, Settings, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { useRecurringSchedules, useDeleteRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
import { RecurringScheduleDialog } from './RecurringScheduleDialog';
import { RecurringScheduleGrid } from './RecurringScheduleGrid';
import { ScheduleServicesDialog } from './ScheduleServicesDialog';
import type { Tables } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;
type Company = Tables<'companies'>;

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Cores das empresas baseadas no CSS
const COMPANY_COLORS = [
  'hsl(var(--company-color-1))',
  'hsl(var(--company-color-2))',
  'hsl(var(--company-color-3))',
  'hsl(var(--company-color-4))',
  'hsl(var(--company-color-5))',
  'hsl(var(--company-color-6))',
  'hsl(var(--company-color-7))',
  'hsl(var(--company-color-8))',
  'hsl(var(--company-color-9))',
  'hsl(var(--company-color-10))',
];

interface DailySchedulePanelProps {
  schedules: RecurringSchedule[];
  companies: Company[];
  onEdit: (schedule: RecurringSchedule) => void;
}

const DailySchedulePanel = ({ schedules, companies, onEdit }: DailySchedulePanelProps) => {
  const today = new Date();
  const todayDayOfWeek = today.getDay();

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'N/A';
  };

  const getCompanyColor = (clientId: string | null) => {
    if (!clientId) return COMPANY_COLORS[0];
    const companyIndex = companies.findIndex(c => c.id === clientId);
    return companyIndex >= 0 ? COMPANY_COLORS[companyIndex % COMPANY_COLORS.length] : COMPANY_COLORS[0];
  };

  const todaySchedules = schedules
    .filter(schedule => schedule.is_active && schedule.days_of_week?.includes(todayDayOfWeek))
    .sort((a, b) => {
      const timeA = a.time_hour * 60 + a.time_minute;
      const timeB = b.time_hour * 60 + b.time_minute;
      return timeA - timeB;
    });

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-6 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CalendarDays className="h-5 w-5" />
          Agendamentos de Hoje ({today.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long' 
          })})
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-gray-800">
        {todaySchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento para hoje.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {todaySchedules.map((schedule) => {
              const companyName = getCompanyName(schedule.client_id);
              const companyColor = getCompanyColor(schedule.client_id);
              
              return (
                <div
                  key={schedule.id}
                  className="p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-all bg-gray-800 border border-gray-600"
                  onClick={() => onEdit(schedule)}
                >
                  <div className="flex items-center justify-between mb-2">
                     <div className="font-semibold text-lg text-white flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full border-2 border-white/20" style={{ backgroundColor: schedule.color || '#3b82f6' }}></div>
                       {schedule.name}
                     </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-300">
                      <Clock className="h-4 w-4" />
                      {formatTime(schedule.time_hour, schedule.time_minute)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-300">
                    {companyName !== 'N/A' && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {companyName}
                      </div>
                    )}
                    {schedule.system_name && (
                      <div className="flex items-center gap-1">
                        <span>📱</span>
                        {schedule.system_name}
                      </div>
                    )}
                    {schedule.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {schedule.location}
                      </div>
                    )}
                  </div>
                  
                  {schedule.description && (
                    <div className="mt-2 text-sm text-gray-400">
                      {schedule.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface WeeklyViewProps {
  schedules: RecurringSchedule[];
  companies: Company[];
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

  const getCompanyColor = (clientId: string | null) => {
    if (!clientId) return COMPANY_COLORS[0];
    const companyIndex = companies.findIndex(c => c.id === clientId);
    return companyIndex >= 0 ? COMPANY_COLORS[companyIndex % COMPANY_COLORS.length] : COMPANY_COLORS[0];
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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            Visualização Semanal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')} className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-300">
              {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {' '}
              {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')} className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-gray-800">
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const daySchedules = getSchedulesForDay(index);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`p-3 border rounded-lg ${isToday ? 'bg-blue-900/30 border-blue-600' : 'bg-gray-700 border-gray-600'}`}>
                <div className="text-center mb-2">
                  <div className="text-sm font-medium text-gray-300">{DAYS_OF_WEEK[index]}</div>
                  <div className={`text-xs ${isToday ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                    {date.getDate()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {daySchedules.map((schedule) => {
                    const companyName = getCompanyName(schedule.client_id);
                    const companyColor = getCompanyColor(schedule.client_id);
                    
                    return (
                      <div
                        key={schedule.id}
                        className="p-2 rounded border text-xs cursor-pointer hover:bg-gray-600 transition-all bg-gray-800 border-gray-600"
                        onClick={() => onEdit(schedule)}
                      >
                         <div className="font-medium truncate text-white flex items-center gap-1">
                           <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: schedule.color || '#3b82f6' }}></div>
                           {schedule.name}
                         </div>
                        <div className="text-gray-300">
                          {formatTime(schedule.time_hour, schedule.time_minute)}
                        </div>
                        {companyName !== 'N/A' && (
                          <div className="text-gray-400 truncate flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {companyName}
                          </div>
                        )}
                        {schedule.system_name && (
                          <div className="text-gray-400 truncate">
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
  companies: Company[];
  onEdit: (schedule: RecurringSchedule) => void;
}

const MonthlyView = ({ schedules, companies, onEdit }: MonthlyViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'N/A';
  };

  const getCompanyColor = (clientId: string | null) => {
    if (!clientId) return COMPANY_COLORS[0];
    const companyIndex = companies.findIndex(c => c.id === clientId);
    return companyIndex >= 0 ? COMPANY_COLORS[companyIndex % COMPANY_COLORS.length] : COMPANY_COLORS[0];
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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            Visualização Mensal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-300">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-gray-800">
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-300">
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
                className={`min-h-[80px] p-1 border rounded text-xs border-gray-600 ${
                  day.isCurrentMonth 
                    ? isToday 
                      ? 'bg-blue-900/30 border-blue-600' 
                      : 'bg-gray-700'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                <div className={`text-center mb-1 ${isToday ? 'font-bold text-blue-400' : day.isCurrentMonth ? 'text-gray-300' : 'text-gray-500'}`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map((schedule) => {
                    const companyName = getCompanyName(schedule.client_id);
                    const companyColor = getCompanyColor(schedule.client_id);
                    
                    return (
                      <div
                        key={schedule.id}
                        className="p-1 rounded cursor-pointer hover:bg-gray-600 transition-all bg-gray-800 border border-gray-600"
                        onClick={() => onEdit(schedule)}
                      >
                         <div className="truncate font-medium text-white flex items-center gap-1">
                           <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: schedule.color || '#3b82f6' }}></div>
                           {schedule.name}
                         </div>
                        {companyName !== 'N/A' && (
                          <div className="truncate text-xs text-gray-400">
                            {companyName}
                          </div>
                        )}
                        {schedule.system_name && (
                          <div className="truncate text-xs text-gray-400">
                            📱 {schedule.system_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {daySchedules.length > 2 && (
                    <div className="text-center text-gray-400">
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
  const [showServicesDialog, setShowServicesDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [activeView, setActiveView] = useState<'week' | 'month' | 'list'>('week');

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'N/A';
  };

  const getCompanyColor = (clientId: string | null) => {
    if (!clientId) return COMPANY_COLORS[0];
    const companyIndex = companies.findIndex(c => c.id === clientId);
    return companyIndex >= 0 ? COMPANY_COLORS[companyIndex % COMPANY_COLORS.length] : COMPANY_COLORS[0];
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
            onClick={() => setShowServicesDialog(true)} 
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

      {/* Quadro diário sempre visível */}
      <DailySchedulePanel 
        schedules={schedules}
        companies={companies as Company[]}
        onEdit={handleEdit} 
      />

      {activeView === 'week' && (
        <WeeklyView 
          schedules={schedules}
          companies={companies as Company[]}
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      )}

      {activeView === 'month' && (
        <MonthlyView 
          schedules={schedules}
          companies={companies as Company[]}
          onEdit={handleEdit}
        />
      )}

      {activeView === 'list' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">Sistema</TableHead>
                  <TableHead className="text-gray-300">Horário</TableHead>
                  <TableHead className="text-gray-300">Dias</TableHead>
                  <TableHead className="text-gray-300">Local</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => {
                  const companyColor = getCompanyColor(schedule.client_id);
                  
                  return (
                    <TableRow 
                      key={schedule.id}
                      className="hover:bg-gray-700 border-gray-700"
                    >
                      <TableCell className="font-medium text-white">{schedule.name}</TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full border-2 border-white/20" style={{ backgroundColor: schedule.color || '#3b82f6' }}></div>
                           <span className="text-gray-300">{getCompanyName(schedule.client_id)}</span>
                         </div>
                       </TableCell>
                      <TableCell className="text-gray-300">{schedule.system_name}</TableCell>
                      <TableCell className="flex items-center gap-1 text-gray-300">
                        <Clock className="h-4 w-4" />
                        {formatTime(schedule.time_hour, schedule.time_minute)}
                      </TableCell>
                      <TableCell className="text-gray-300">{getDayNames(schedule.days_of_week || [])}</TableCell>
                      <TableCell>
                        {schedule.location && (
                          <div className="flex items-center gap-1 text-gray-300">
                            <MapPin className="h-4 w-4" />
                            {schedule.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={schedule.is_active ? 'default' : 'secondary'} className={schedule.is_active ? 'bg-green-800 text-green-100' : 'bg-gray-700 text-gray-300'}>
                          {schedule.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)} className="bg-blue-800 hover:bg-blue-700 text-white border-blue-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-red-800 hover:bg-red-700 text-white border-red-700"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {schedules.length === 0 && (
              <div className="text-center py-8 text-gray-400">
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
      
      <ScheduleServicesDialog
        open={showServicesDialog}
        onOpenChange={setShowServicesDialog}
      />
    </div>
  );
};