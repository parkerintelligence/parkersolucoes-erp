
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { ScheduleItem } from '@/hooks/useScheduleItems';
import { getContrastColor } from '@/utils/colorUtils';

interface ScheduleGridProps {
  items: ScheduleItem[];
  onUpdate: (id: string, updates: Partial<ScheduleItem>) => void;
  onDelete: (id: string) => void;
}

export const ScheduleGrid = ({ items, onUpdate, onDelete }: ScheduleGridProps) => {
  const getBackgroundColor = (item: ScheduleItem) => {
    const today = new Date();
    const dueDate = new Date(item.due_date);
    
    if (item.status === 'completed') return 'bg-green-50 border-green-200';
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Vencidos ou menos de 30 dias - vermelho
    if (diffDays <= 30) return 'bg-red-50 border-red-200';
    
    // Mais de 30 dias - verde
    return 'bg-green-50 border-green-200';
  };

  const getStatusColor = (item: ScheduleItem) => {
    const today = new Date();
    const dueDate = new Date(item.due_date);
    
    if (item.status === 'completed') return 'bg-green-900/50 text-green-300 border-green-700';
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-900/50 text-red-300 border-red-700';
    if (diffDays <= 30) return 'bg-orange-900/50 text-orange-300 border-orange-700';
    
    return 'bg-green-900/50 text-green-300 border-green-700';
  };

  const getStatusText = (item: ScheduleItem) => {
    const today = new Date();
    const dueDate = new Date(item.due_date);
    
    if (item.status === 'completed') return 'Concluído';
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    if (diffDays <= 30) return `${diffDays} dias`;
    
    return 'No prazo';
  };

  const typeLabels = {
    certificate: 'Certificado',
    license: 'Licença',
    system_update: 'Sistema'
  };

  const typeIcons = {
    certificate: Clock,
    license: Calendar,
    system_update: AlertTriangle
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum agendamento cadastrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = typeIcons[item.type] || Calendar; // Fallback para Calendar se o tipo não existir
        return (
        <Card 
          key={item.id} 
          className="border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
          style={{
            backgroundColor: item.color || '#3b82f6',
            color: getContrastColor(item.color || '#3b82f6'),
            borderColor: item.color || '#3b82f6'
          }}
        >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white/20" 
                    style={{ backgroundColor: item.color || '#3b82f6' }}
                  ></div>
                  <Icon className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-sm font-medium text-white line-clamp-2">
                    {item.title}
                  </CardTitle>
                </div>
                <Badge className={`${getStatusColor(item)} border`}>
                  {getStatusText(item)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="font-medium">{typeLabels[item.type] || item.type || 'Geral'}</span>
                  <span className="font-medium">{item.company}</span>
                </div>
                <div className="text-xs text-gray-400">
                  <span className="font-medium">Vencimento:</span> {new Date(item.due_date).toLocaleDateString('pt-BR')}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(item.id, {})}
                  className="text-blue-400 border-blue-600 hover:bg-blue-900/20 flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 border-red-600 hover:bg-red-900/20 flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
