import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface ScheduleItem {
  id: string;
  title: string;
  company: string;
  type: string;
  status: string;
  due_date: string;
  description?: string;
}

interface ScheduleSummaryProps {
  items: ScheduleItem[];
}

export const ScheduleSummary = ({ items }: ScheduleSummaryProps) => {
  const pendingCount = items.filter(item => item.status === 'pending').length;
  
  const criticalCount = items.filter(item => {
    if (item.status !== 'pending') return false;
    const daysUntil = differenceInDays(new Date(item.due_date), new Date());
    return daysUntil <= 30;
  }).length;

  return (
    <div className="fixed top-20 right-6 z-10 space-y-2 w-64">
      {/* Pendentes */}
      <Card className="border-blue-200 bg-blue-900 text-white shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <div>
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-blue-100">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Críticos */}
      <Card className="border-red-200 bg-red-600 text-white shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <p className="text-lg font-bold">{criticalCount}</p>
              <p className="text-xs text-red-100">Críticos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <Card className="border-green-200 bg-green-600 text-white shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <div>
              <p className="text-lg font-bold">{items.length}</p>
              <p className="text-xs text-green-100">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};