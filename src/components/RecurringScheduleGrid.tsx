import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Calendar, Edit, Trash2, Power, PowerOff, Building, MapPin } from 'lucide-react';
import { useRecurringSchedules, useDeleteRecurringSchedule, useUpdateRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { Tables } from '@/integrations/supabase/types';

type RecurringSchedule = Tables<'recurring_schedules'>;

interface RecurringScheduleGridProps {
  onEdit: (schedule: RecurringSchedule) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const RecurringScheduleGrid = ({ onEdit }: RecurringScheduleGridProps) => {
  const { data: schedules = [] } = useRecurringSchedules();
  const { data: companies = [] } = useCompanies();
  const deleteSchedule = useDeleteRecurringSchedule();
  const updateSchedule = useUpdateRecurringSchedule();

  const getCompanyName = (clientId: string | null) => {
    if (!clientId) return null;
    return companies.find(c => c.id === clientId)?.name || null;
  };

  const formatTime = (hour: number, minute: number) =>
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const getDaysString = (daysOfWeek: number[]) =>
    daysOfWeek.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).filter(Boolean).join(', ');

  const handleToggleActive = (schedule: RecurringSchedule) => {
    updateSchedule.mutate({ id: schedule.id, updates: { is_active: !schedule.is_active } });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteSchedule.mutate(id);
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Nenhum agendamento recorrente cadastrado</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Nome</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Cliente</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Sistema</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Horário</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Dias</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs h-8 px-3 w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map(schedule => {
              const company = getCompanyName(schedule.client_id);
              return (
                <Tooltip key={schedule.id}>
                  <TooltipTrigger asChild>
                    <TableRow className="border-border hover:bg-muted/30 cursor-default group">
                      <TableCell className="py-1.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: schedule.color || '#3b82f6' }} />
                          <span className="text-xs font-medium text-foreground line-clamp-1">{schedule.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        {company ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground line-clamp-1">{company}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-muted text-muted-foreground">
                          {schedule.system_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <span className="text-xs font-mono text-foreground">
                          {formatTime(schedule.time_hour, schedule.time_minute)}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <span className="text-[10px] text-muted-foreground">{getDaysString(schedule.days_of_week)}</span>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${
                            schedule.is_active
                              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              : 'border-red-500/30 text-red-400 bg-red-500/10'
                          }`}
                        >
                          {schedule.is_active ? <Power className="h-2.5 w-2.5" /> : <PowerOff className="h-2.5 w-2.5" />}
                          {schedule.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(schedule)} className="h-6 w-6 p-0 text-muted-foreground hover:text-primary" title="Editar">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(schedule)}
                            className={`h-6 w-6 p-0 text-muted-foreground ${schedule.is_active ? 'hover:text-amber-400' : 'hover:text-emerald-400'}`}
                            title={schedule.is_active ? 'Pausar' : 'Ativar'}
                          >
                            {schedule.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" title="Excluir">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-sm">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold">{schedule.name}</p>
                      {company && <p><span className="text-muted-foreground">Cliente:</span> {company}</p>}
                      <p><span className="text-muted-foreground">Sistema:</span> {schedule.system_name}</p>
                      <p><span className="text-muted-foreground">Horário:</span> {formatTime(schedule.time_hour, schedule.time_minute)}</p>
                      <p><span className="text-muted-foreground">Dias:</span> {getDaysString(schedule.days_of_week)}</p>
                      {schedule.location && <p><span className="text-muted-foreground">Local:</span> {schedule.location}</p>}
                      {schedule.description && <p><span className="text-muted-foreground">Descrição:</span> {schedule.description}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};
