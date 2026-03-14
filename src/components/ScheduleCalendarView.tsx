import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, MapPin, Building, Settings, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useRecurringSchedules, useDeleteRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
import { RecurringScheduleDialog } from './RecurringScheduleDialog';
import { RecurringScheduleGrid } from './RecurringScheduleGrid';
import { ScheduleServicesDialog } from './ScheduleServicesDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { getContrastColor } from '@/utils/colorUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;
type Company = Tables<'companies'>;

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_OF_WEEK_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const formatTime = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// ─── Shared helpers ───────────────────────────────────────
const useCompanyHelpers = (companies: Company[]) => {
  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return null;
    return companies.find(c => c.id === clientId)?.name || null;
  };
  return { getCompanyName };
};

// ─── Weekly View (redesigned) ─────────────────────────────
interface WeeklyViewProps {
  schedules: RecurringSchedule[];
  companies: Company[];
  onEdit: (schedule: RecurringSchedule) => void;
  onDelete: (id: string) => void;
}

const WeeklyView = ({ schedules, companies, onEdit }: WeeklyViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { getCompanyName } = useCompanyHelpers(companies);

  const getWeekDates = (date: Date) => {
    const week = [];
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);
  const today = new Date().toDateString();

  const navigateWeek = (dir: 'prev' | 'next') => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentWeek(d);
  };

  const goToday = () => setCurrentWeek(new Date());

  const getSchedulesForDay = (dayOfWeek: number) =>
    schedules
      .filter(s => s.is_active && s.days_of_week?.includes(dayOfWeek))
      .sort((a, b) => (a.time_hour * 60 + a.time_minute) - (b.time_hour * 60 + b.time_minute));

  // Find time range for the timeline
  const allActiveSchedules = schedules.filter(s => s.is_active);
  const minHour = allActiveSchedules.length > 0
    ? Math.max(0, Math.min(...allActiveSchedules.map(s => s.time_hour)) - 1)
    : 7;
  const maxHour = allActiveSchedules.length > 0
    ? Math.min(23, Math.max(...allActiveSchedules.map(s => s.time_hour)) + 1)
    : 18;

  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Visualização Semanal
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')} className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday} className="h-7 text-xs px-2">
              Hoje
            </Button>
            <span className="text-xs font-medium text-muted-foreground mx-1 min-w-[140px] text-center">
              {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')} className="h-7 w-7 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day headers */}
            <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
              <div className="p-2" /> {/* time gutter */}
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === today;
                const daySchedules = getSchedulesForDay(i);
                return (
                  <div
                    key={i}
                    className={cn(
                      "p-2 text-center border-l border-border",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{DAYS_OF_WEEK[i]}</div>
                    <div className={cn(
                      "text-lg font-bold",
                      isToday ? "text-primary" : "text-foreground"
                    )}>
                      {date.getDate()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{daySchedules.length} agenda{daySchedules.length !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="relative">
              {hours.map(hour => {
                return (
                  <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)] min-h-[44px] border-b border-border/30">
                    {/* Hour label */}
                    <div className="py-1 text-right pr-1.5 text-[10px] text-muted-foreground font-mono border-r border-border/50">
                      {hour.toString().padStart(2, '0')}:00
                    </div>

                    {/* Day cells */}
                    {weekDates.map((date, dayIndex) => {
                      const isToday = date.toDateString() === today;
                      const daySchedules = getSchedulesForDay(dayIndex)
                        .filter(s => s.time_hour === hour);

                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "border-l border-border/30 px-0.5 py-0.5",
                            isToday && "bg-primary/[0.03]"
                          )}
                        >
                          {daySchedules.map(schedule => {
                            const company = getCompanyName(schedule.client_id);
                            return (
                              <div
                                key={schedule.id}
                                onClick={() => onEdit(schedule)}
                                className="rounded px-1.5 py-1 mb-0.5 cursor-pointer transition-all hover:brightness-95 hover:shadow-sm border text-left"
                                style={{
                                  backgroundColor: (schedule.color || '#3b82f6') + '18',
                                  borderColor: (schedule.color || '#3b82f6') + '40',
                                  borderLeftWidth: '3px',
                                  borderLeftColor: schedule.color || '#3b82f6',
                                }}
                              >
                                <div className="text-[10px] font-semibold text-foreground truncate leading-tight">
                                  {schedule.name}
                                </div>
                                <div className="text-[9px] text-muted-foreground leading-tight mt-0.5 truncate">
                                  {formatTime(schedule.time_hour, schedule.time_minute)}
                                  {company ? ` · ${company}` : ''}
                                  {schedule.system_name ? ` · ${schedule.system_name}` : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Daily Schedule Panel ─────────────────────────────────
interface DailySchedulePanelProps {
  schedules: RecurringSchedule[];
  companies: Company[];
  onEdit: (schedule: RecurringSchedule) => void;
}

const DailySchedulePanel = ({ schedules, companies, onEdit }: DailySchedulePanelProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { getCompanyName } = useCompanyHelpers(companies);

  const selectedDateDayOfWeek = selectedDate.getDay();
  const todaySchedules = schedules
    .filter(s => s.is_active && s.days_of_week?.includes(selectedDateDayOfWeek))
    .sort((a, b) => (a.time_hour * 60 + a.time_minute) - (b.time_hour * 60 + b.time_minute));

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            {isToday ? 'Hoje' : format(selectedDate, 'dd/MM/yyyy')}
            <span className="text-sm font-normal text-muted-foreground">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </span>
            <Badge variant="secondary" className="text-[10px]">{todaySchedules.length}</Badge>
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {format(selectedDate, 'dd/MM')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {todaySchedules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nenhum agendamento para {isToday ? 'hoje' : 'esta data'}.
          </div>
        ) : (
          <div className="space-y-1.5">
            {todaySchedules.map(schedule => {
              const company = getCompanyName(schedule.client_id);
              return (
                <div
                  key={schedule.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-all border border-transparent hover:border-border"
                  onClick={() => onEdit(schedule)}
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: schedule.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{schedule.name}</span>
                      {schedule.system_name && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{schedule.system_name}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {company && (
                        <span className="flex items-center gap-1"><Building className="h-3 w-3" />{company}</span>
                      )}
                      {schedule.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{schedule.location}</span>
                      )}
                      {schedule.description && (
                        <span className="truncate max-w-[200px]">{schedule.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-mono text-foreground flex-shrink-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatTime(schedule.time_hour, schedule.time_minute)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Monthly View ─────────────────────────────────────────
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MonthlyViewProps {
  schedules: RecurringSchedule[];
  companies: Company[];
  onEdit: (schedule: RecurringSchedule) => void;
}

const MonthlyView = ({ schedules, companies, onEdit }: MonthlyViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { getCompanyName } = useCompanyHelpers(companies);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prev = new Date(firstDay);
      prev.setDate(prev.getDate() - (i + 1));
      days.push({ date: prev, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth);
  const today = new Date().toDateString();

  const navigateMonth = (dir: 'prev' | 'next') => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
    setCurrentMonth(d);
  };

  const getSchedulesForDay = (date: Date) => {
    const dow = date.getDay();
    return schedules.filter(s => s.is_active && s.days_of_week?.includes(dow));
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Visualização Mensal
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground mx-1 min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} className="h-7 w-7 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="p-2 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
              {day}
            </div>
          ))}
          {monthDays.map((day, index) => {
            const daySchedules = getSchedulesForDay(day.date);
            const isT = day.date.toDateString() === today;
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[72px] p-1 bg-card text-xs",
                  !day.isCurrentMonth && "opacity-40",
                  isT && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-right text-[11px] mb-0.5 pr-0.5",
                  isT ? "font-bold text-primary" : "text-muted-foreground"
                )}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {daySchedules.slice(0, 3).map(schedule => (
                    <div
                      key={schedule.id}
                      className="rounded px-1 py-0.5 cursor-pointer hover:opacity-80 truncate text-[10px] font-medium"
                      style={{
                        backgroundColor: (schedule.color || '#3b82f6') + '25',
                        color: schedule.color || '#3b82f6',
                        borderLeft: `2px solid ${schedule.color || '#3b82f6'}`,
                      }}
                      onClick={() => onEdit(schedule)}
                      title={`${schedule.name} - ${formatTime(schedule.time_hour, schedule.time_minute)}${getCompanyName(schedule.client_id) ? ' | ' + getCompanyName(schedule.client_id) : ''}`}
                    >
                      {formatTime(schedule.time_hour, schedule.time_minute)} {schedule.name}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{daySchedules.length - 3}
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

// ─── Main Component ───────────────────────────────────────
export const ScheduleCalendarView = () => {
  const { data: schedules = [], isLoading } = useRecurringSchedules();
  const { data: companies = [] } = useCompanies();
  const deleteSchedule = useDeleteRecurringSchedule();
  const { confirm } = useConfirmDialog();

  const [showDialog, setShowDialog] = useState(false);
  const [showServicesDialog, setShowServicesDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [activeView, setActiveView] = useState<'week' | 'month' | 'list'>('week');

  const { getCompanyName } = useCompanyHelpers(companies as Company[]);

  const handleEdit = (schedule: RecurringSchedule) => {
    setEditingSchedule(schedule);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Excluir agendamento',
      description: 'Tem certeza que deseja excluir este agendamento recorrente?',
    });
    if (ok) deleteSchedule.mutate(id);
  };

  const getDayNames = (days: number[]) => days.map(d => DAYS_OF_WEEK[d]).join(', ');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
          {(['week', 'month', 'list'] as const).map(v => (
            <Button
              key={v}
              variant={activeView === v ? 'default' : 'ghost'}
              onClick={() => setActiveView(v)}
              size="sm"
              className="h-7 text-xs px-3"
            >
              {v === 'week' ? 'Semana' : v === 'month' ? 'Mês' : 'Lista'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowServicesDialog(true)} variant="outline" size="sm" className="h-8 text-xs">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Sistemas/Serviços
          </Button>
          <Button onClick={() => { setEditingSchedule(null); setShowDialog(true); }} size="sm" className="h-8 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Daily panel (compact, always visible) */}
      <DailySchedulePanel
        schedules={schedules}
        companies={companies as Company[]}
        onEdit={handleEdit}
      />

      {/* Views */}
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
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-base">Lista de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Sistema</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Horário</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Dias</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Local</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => {
                  const company = getCompanyName(schedule.client_id);
                  return (
                    <TableRow key={schedule.id} className="border-border hover:bg-muted/30">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: schedule.color || '#3b82f6' }} />
                          <span className="text-sm font-medium text-foreground">{schedule.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{company || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{schedule.system_name || '—'}</TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-foreground">
                          {formatTime(schedule.time_hour, schedule.time_minute)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{getDayNames(schedule.days_of_week || [])}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{schedule.location || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={schedule.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {schedule.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(schedule)} className="h-7 w-7 p-0">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(schedule.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {schedules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum agendamento encontrado.
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
