
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ScheduleItem } from '@/pages/Schedule';

interface ScheduleListProps {
  items: ScheduleItem[];
  onUpdate: (id: string, updates: Partial<ScheduleItem>) => void;
  onDelete: (id: string) => void;
}

export const ScheduleList = ({ items, onUpdate, onDelete }: ScheduleListProps) => {
  const sortedItems = items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getStatusColor = (item: ScheduleItem) => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    
    if (item.status === 'completed') return 'bg-green-100 text-green-800';
    if (dueDate < today) return 'bg-red-100 text-red-800';
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'bg-yellow-100 text-yellow-800';
    
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (item: ScheduleItem) => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    
    if (item.status === 'completed') return 'Concluído';
    if (dueDate < today) return 'Vencido';
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    if (diffDays <= 7) return `${diffDays} dias`;
    
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

  const handleComplete = (id: string) => {
    onUpdate(id, { status: 'completed' });
    toast({
      title: "Item concluído!",
      description: "O agendamento foi marcado como concluído.",
    });
  };

  const handleDelete = (id: string, title: string) => {
    onDelete(id);
    toast({
      title: "Item removido!",
      description: `"${title}" foi removido da agenda.`,
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum agendamento cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {sortedItems.map((item) => {
        const Icon = typeIcons[item.type];
        return (
          <Card key={item.id} className="border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <CardTitle className="text-sm font-medium text-slate-900">
                    {item.title}
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(item)}>
                  {getStatusText(item)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{typeLabels[item.type]}</span>
                  <span>{item.company}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500">{item.description}</p>
                )}
                <div className="flex gap-2 pt-2">
                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(item.id)}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Concluir
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
