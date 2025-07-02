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

  // O componente agora é renderizado inline dentro da tela Schedule
  // Retornamos null para evitar renderização duplicada
  return null;
};