import { useMemo } from "react";
import { type ActionColumn, type ActionCard } from "@/hooks/useActionPlan";
import { format, differenceInDays, startOfDay, addDays, isPast, isToday, min, max } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectGanttProps {
  columns: ActionColumn[];
  cards: ActionCard[];
}

export function ProjectGantt({ columns, cards }: ProjectGanttProps) {
  const cardsWithDates = cards.filter(c => c.due_date);

  const { ganttStart, ganttEnd, totalDays, dayWidth } = useMemo(() => {
    if (cardsWithDates.length === 0) {
      const today = startOfDay(new Date());
      return { ganttStart: today, ganttEnd: addDays(today, 30), totalDays: 30, dayWidth: 36 };
    }

    const dates = cardsWithDates.map(c => new Date(c.due_date!));
    const createdDates = cardsWithDates.map(c => new Date(c.created_at));
    const allDates = [...dates, ...createdDates, new Date()];

    const earliest = addDays(min(allDates), -3);
    const latest = addDays(max(allDates), 7);
    const days = Math.max(differenceInDays(latest, earliest), 14);

    return { ganttStart: startOfDay(earliest), ganttEnd: latest, totalDays: days, dayWidth: 36 };
  }, [cardsWithDates]);

  const days = useMemo(() =>
    Array.from({ length: totalDays }, (_, i) => addDays(ganttStart, i)),
    [ganttStart, totalDays]
  );

  const priorityColors: Record<string, string> = {
    urgent: 'hsl(var(--destructive))',
    high: '#f97316',
    medium: 'hsl(var(--primary))',
    low: 'hsl(var(--muted-foreground))',
  };

  if (cardsWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Gráfico de Gantt</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Adicione datas de vencimento aos seus cards para visualizar a linha do tempo do projeto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ScrollArea className="w-full">
        <div style={{ minWidth: `${300 + totalDays * dayWidth}px` }}>
          {/* Timeline Header */}
          <div className="flex border-b border-border sticky top-0 bg-card z-10">
            <div className="w-[300px] flex-shrink-0 px-4 py-2 bg-secondary/30 border-r border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Card</span>
            </div>
            <div className="flex">
              {days.map((day, i) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const today = isToday(day);
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 text-center border-r border-border/30 py-2 ${isWeekend ? 'bg-secondary/20' : ''} ${today ? 'bg-primary/10' : ''}`}
                    style={{ width: `${dayWidth}px` }}
                  >
                    <div className="text-[9px] text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-[11px] font-medium ${today ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'dd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows grouped by column */}
          {columns.map(column => {
            const colCards = cardsWithDates
              .filter(c => c.column_id === column.id)
              .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

            if (colCards.length === 0) return null;

            return (
              <div key={column.id}>
                {/* Group header */}
                <div className="flex border-b border-border bg-secondary/10">
                  <div className="w-[300px] flex-shrink-0 px-4 py-2 flex items-center gap-2 border-r border-border">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color || 'hsl(var(--muted))' }} />
                    <span className="text-xs font-semibold text-foreground">{column.name}</span>
                    <Badge variant="secondary" className="text-[9px]">{colCards.length}</Badge>
                  </div>
                  <div style={{ width: `${totalDays * dayWidth}px` }} />
                </div>

                {/* Card rows */}
                {colCards.map(card => {
                  const created = startOfDay(new Date(card.created_at));
                  const due = startOfDay(new Date(card.due_date!));
                  const startOffset = Math.max(differenceInDays(created, ganttStart), 0);
                  const endOffset = differenceInDays(due, ganttStart);
                  const barStart = startOffset;
                  const barWidth = Math.max(endOffset - startOffset + 1, 1);
                  const overdue = isPast(due) && !isToday(due);
                  const barColor = priorityColors[card.priority || 'medium'];

                  return (
                    <div key={card.id} className="flex border-b border-border/30 hover:bg-secondary/10 transition-colors">
                      <div className="w-[300px] flex-shrink-0 px-4 py-2.5 border-r border-border flex items-center gap-2 min-w-0">
                        <span className="text-xs text-foreground truncate font-medium">{card.title}</span>
                        {overdue && <Badge variant="secondary" className="text-[9px] bg-destructive/10 text-destructive flex-shrink-0">Atrasado</Badge>}
                      </div>
                      <div className="relative flex-1" style={{ width: `${totalDays * dayWidth}px` }}>
                        {/* Today line */}
                        {days.findIndex(d => isToday(d)) >= 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                            style={{ left: `${days.findIndex(d => isToday(d)) * dayWidth + dayWidth / 2}px` }}
                          />
                        )}
                        {/* Bar */}
                        <div
                          className="absolute top-2 h-5 rounded-md transition-all shadow-sm"
                          style={{
                            left: `${barStart * dayWidth + 2}px`,
                            width: `${barWidth * dayWidth - 4}px`,
                            backgroundColor: barColor,
                            opacity: overdue ? 0.6 : 0.85,
                          }}
                        >
                          <span className="text-[9px] text-white px-1.5 truncate block leading-5 font-medium">
                            {card.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
