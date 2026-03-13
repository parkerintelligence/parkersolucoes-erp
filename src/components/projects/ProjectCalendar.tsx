import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ActionCard, type ActionColumn } from "@/hooks/useActionPlan";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, format, isSameMonth, isSameDay, isToday, isPast,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCalendarProps {
  cards: ActionCard[];
  columns: ActionColumn[];
}

export function ProjectCalendar({ cards, columns }: ProjectCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const getCardsForDay = (day: Date) =>
    cards.filter(c => c.due_date && isSameDay(new Date(c.due_date), day));

  const getColumnColor = (columnId: string) =>
    columns.find(c => c.id === columnId)?.color || 'hsl(var(--primary))';

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/20 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map(d => (
          <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const dayCards = getCardsForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <div
              key={i}
              className={`min-h-[100px] border-b border-r border-border/30 p-1.5 transition-colors
                ${!inMonth ? 'bg-secondary/10' : 'hover:bg-secondary/10'}
                ${today ? 'bg-primary/5' : ''}
              `}
            >
              <div className={`text-xs font-medium mb-1 ${today ? 'text-primary' : inMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayCards.slice(0, 3).map(card => {
                  const overdue = isPast(day) && !isToday(day);
                  return (
                    <div
                      key={card.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${overdue ? 'opacity-60' : ''}`}
                      style={{
                        backgroundColor: `${getColumnColor(card.column_id)}20`,
                        color: getColumnColor(card.column_id),
                        borderLeft: `2px solid ${getColumnColor(card.column_id)}`,
                      }}
                      title={card.title}
                    >
                      {card.priority === 'urgent' && <AlertTriangle className="h-2 w-2 inline mr-0.5" />}
                      {card.title}
                    </div>
                  );
                })}
                {dayCards.length > 3 && (
                  <span className="text-[9px] text-muted-foreground pl-1">+{dayCards.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
