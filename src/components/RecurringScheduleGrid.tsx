import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { useRecurringSchedules, useDeleteRecurringSchedule, useUpdateRecurringSchedule } from '@/hooks/useRecurringSchedules';
import { useCompanies } from '@/hooks/useCompanies';
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
    if (!clientId) return 'Sem cliente';
    const company = companies.find(c => c.id === clientId);
    return company?.name || 'Cliente não encontrado';
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getDaysString = (daysOfWeek: number[]) => {
    return daysOfWeek
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
      .filter(Boolean)
      .join(', ');
  };

  const handleToggleActive = (schedule: RecurringSchedule) => {
    updateSchedule.mutate({
      id: schedule.id,
      updates: { is_active: !schedule.is_active }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteSchedule.mutate(id);
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum agendamento recorrente cadastrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule) => (
        <Card 
          key={schedule.id} 
          className="bg-gray-800 border-gray-700 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/20 border-l-4"
          style={{
            borderLeftColor: schedule.color || '#3b82f6'
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white/20" 
                  style={{ backgroundColor: schedule.color || '#3b82f6' }}
                ></div>
                <CardTitle className="text-sm font-medium text-white line-clamp-2">
                  {schedule.name}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {schedule.is_active ? (
                  <Badge className="bg-green-900/50 text-green-300 border-green-700">
                    <Power className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-red-900/50 text-red-300 border-red-700">
                    <PowerOff className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span className="font-medium">{schedule.system_name}</span>
                <span className="font-medium">{getCompanyName(schedule.client_id)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{formatTime(schedule.time_hour, schedule.time_minute)}</span>
                <span>•</span>
                <span>{getDaysString(schedule.days_of_week)}</span>
              </div>

              {schedule.location && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Local:</span> {schedule.location}
                </div>
              )}
              
              {schedule.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{schedule.description}</p>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(schedule)}
                className="text-blue-400 border-blue-600 hover:bg-blue-900/20 flex-1"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleActive(schedule)}
                className={`${
                  schedule.is_active 
                    ? 'text-orange-400 border-orange-600 hover:bg-orange-900/20' 
                    : 'text-green-400 border-green-600 hover:bg-green-900/20'
                } flex-1`}
              >
                {schedule.is_active ? (
                  <>
                    <PowerOff className="h-3 w-3 mr-1" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Power className="h-3 w-3 mr-1" />
                    Ativar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(schedule.id)}
                className="text-red-400 border-red-600 hover:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};