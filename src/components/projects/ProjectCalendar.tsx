import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ActionCard, type ActionColumn, type ActionCardItem } from "@/hooks/useActionPlan";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, format, isSameMonth, isSameDay, isToday, isPast,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCalendarProps {
  cards: ActionCard[];
  columns: ActionColumn[];
  cardItems?: ActionCardItem[];
}

export function ProjectCalendar({ cards, columns, cardItems = [] }: ProjectCalendarProps) {
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

  const getCardProgress = (cardId: string) => {
    const items = cardItems.filter(i => i.card_id === cardId);
    if (items.length === 0) return 0;
    return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
  };

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const cardsThisMonth = cards.filter(c => c.due_date && isSameMonth(new Date(c.due_date), currentMonth));
  const overdueThisMonth = cardsThisMonth.filter(c => isPast(new Date(c.due_date!)) && !isToday(new Date(c.due_date!)));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-bold text-foreground capitalize min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}
            className="h-7 text-[10px] px-2 ml-2">
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{cardsThisMonth.length} tarefas</span>
          {overdueThisMonth.length > 0 && (
            <Badge variant="secondary" className="text-[9px] bg-destructive/10 text-destructive">
              {overdueThisMonth.length} atrasadas
            </Badge>
          )}
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/10">
        {weekDays.map((d, i) => (
          <div key={d} className={`px-2 py-1.5 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider
            ${i >= 5 ? 'text-muted-foreground/50' : ''}
          `}>
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
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={i}
              className={`min-h-[90px] border-b border-r border-border/30 p-1 transition-colors
                ${!inMonth ? 'bg-muted/20' : isWeekend ? 'bg-muted/10' : 'hover:bg-primary/5'}
                ${today ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}
              `}
            >
              <div className={`text-[10px] font-bold mb-0.5 px-0.5 ${
                today ? 'text-primary' : inMonth ? 'text-foreground' : 'text-muted-foreground/30'
              }`}>
                {today && <span className="inline-block w-4 h-4 bg-primary text-primary-foreground rounded-full text-center leading-4 mr-0.5 text-[9px]">{format(day, 'd')}</span>}
                {!today && format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayCards.slice(0, 3).map(card => {
                  const overdue = isPast(day) && !isToday(day);
                  const progress = getCardProgress(card.id);
                  return (
                    <div
                      key={card.id}
                      className={`text-[9px] px-1 py-0.5 rounded truncate font-medium flex items-center gap-0.5 ${overdue ? 'opacity-50' : ''}`}
                      style={{
                        backgroundColor: `${getColumnColor(card.column_id)}15`,
                        color: getColumnColor(card.column_id),
                        borderLeft: `2px solid ${getColumnColor(card.column_id)}`,
                      }}
                      title={`${card.title} (${progress}%)`}
                    >
                      {progress === 100 ? (
                        <CheckCircle2 className="h-2 w-2 flex-shrink-0" />
                      ) : card.priority === 'urgent' ? (
                        <AlertTriangle className="h-2 w-2 flex-shrink-0" />
                      ) : overdue ? (
                        <Flag className="h-2 w-2 flex-shrink-0" />
                      ) : null}
                      <span className="truncate">{card.title}</span>
                    </div>
                  );
                })}
                {dayCards.length > 3 && (
                  <span className="text-[8px] text-muted-foreground pl-1 font-medium">+{dayCards.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
