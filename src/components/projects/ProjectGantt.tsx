import { useMemo, useState, useRef } from "react";
import { type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";
import { format, differenceInDays, startOfDay, addDays, isPast, isToday, min, max, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, isSameMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronDown, Diamond, Flag, AlertTriangle } from "lucide-react";

interface ProjectGanttProps {
  columns: ActionColumn[];
  cards: ActionCard[];
  cardItems?: ActionCardItem[];
}

export function ProjectGantt({ columns, cards, cardItems = [] }: ProjectGanttProps) {
  const cardsWithDates = cards.filter(c => c.due_date);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [nameColWidth] = useState(280);

  const toggleGroup = (id: string) => {
    const next = new Set(collapsedGroups);
    next.has(id) ? next.delete(id) : next.add(id);
    setCollapsedGroups(next);
  };

  const getCardProgress = (cardId: string) => {
    const items = cardItems.filter(i => i.card_id === cardId);
    if (items.length === 0) return 0;
    return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
  };

  const { ganttStart, ganttEnd, totalDays, dayWidth } = useMemo(() => {
    if (cardsWithDates.length === 0) {
      const today = startOfDay(new Date());
      return { ganttStart: addDays(today, -7), ganttEnd: addDays(today, 37), totalDays: 44, dayWidth: 28 };
    }

    const dates = cardsWithDates.map(c => new Date(c.due_date!));
    const createdDates = cardsWithDates.map(c => new Date(c.created_at));
    const allDates = [...dates, ...createdDates, new Date()];

    const earliest = addDays(startOfDay(min(allDates)), -7);
    const latest = addDays(startOfDay(max(allDates)), 14);
    const days = Math.max(differenceInDays(latest, earliest), 30);

    return { ganttStart: earliest, ganttEnd: latest, totalDays: days, dayWidth: 28 };
  }, [cardsWithDates]);

  const days = useMemo(() =>
    Array.from({ length: totalDays }, (_, i) => addDays(ganttStart, i)),
    [ganttStart, totalDays]
  );

  // Group days by month for header
  const months = useMemo(() => {
    const result: { month: string; days: number; startIdx: number }[] = [];
    let currentMonth = '';
    let currentCount = 0;
    let currentStart = 0;

    days.forEach((day, i) => {
      const m = format(day, 'MMM yyyy', { locale: ptBR });
      if (m !== currentMonth) {
        if (currentMonth) result.push({ month: currentMonth, days: currentCount, startIdx: currentStart });
        currentMonth = m;
        currentCount = 1;
        currentStart = i;
      } else {
        currentCount++;
      }
    });
    if (currentMonth) result.push({ month: currentMonth, days: currentCount, startIdx: currentStart });
    return result;
  }, [days]);

  // Group days by week
  const weeks = useMemo(() => {
    const result: { weekNum: string; days: number; startIdx: number }[] = [];
    let currentWeek = '';
    let count = 0;
    let start = 0;

    days.forEach((day, i) => {
      const ws = format(startOfWeek(day, { weekStartsOn: 1 }), 'dd/MM');
      if (ws !== currentWeek) {
        if (currentWeek) result.push({ weekNum: currentWeek, days: count, startIdx: start });
        currentWeek = ws;
        count = 1;
        start = i;
      } else {
        count++;
      }
    });
    if (currentWeek) result.push({ weekNum: currentWeek, days: count, startIdx: start });
    return result;
  }, [days]);

  const priorityColors: Record<string, string> = {
    urgent: 'hsl(var(--destructive))',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#94a3b8',
  };

  const todayIdx = days.findIndex(d => isToday(d));

  let globalRowIdx = 0;

  if (cardsWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Gráfico de Gantt</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Adicione datas de vencimento aos seus cards para visualizar a linha do tempo como no Microsoft Project.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      <ScrollArea className="w-full">
        <div style={{ minWidth: `${nameColWidth + totalDays * dayWidth + 220}px` }}>
          {/* === HEADER ROW 1: Months === */}
          <div className="flex border-b border-border sticky top-0 z-20 bg-secondary/50">
            <div className="flex-shrink-0 border-r border-border bg-secondary/60" style={{ width: `${nameColWidth + 220}px` }}>
              <div className="h-7 flex items-center px-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cronograma do Projeto</span>
              </div>
            </div>
            <div className="flex">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 text-center border-r border-border/40 bg-secondary/40 flex items-center justify-center h-7"
                  style={{ width: `${m.days * dayWidth}px` }}
                >
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* === HEADER ROW 2: Weeks === */}
          <div className="flex border-b border-border sticky top-7 z-20 bg-secondary/30">
            <div className="flex-shrink-0 border-r border-border bg-secondary/40" style={{ width: `${nameColWidth + 220}px` }}>
              <div className="h-6 flex items-center">
                <div className="flex text-[9px] font-semibold text-muted-foreground uppercase tracking-wider w-full">
                  <div className="px-2" style={{ width: '32px' }}>#</div>
                  <div className="px-2 flex-1">Tarefa</div>
                  <div className="px-2 text-center" style={{ width: '60px' }}>Início</div>
                  <div className="px-2 text-center" style={{ width: '60px' }}>Término</div>
                  <div className="px-2 text-center" style={{ width: '40px' }}>Dur.</div>
                  <div className="px-2 text-center" style={{ width: '40px' }}>%</div>
                </div>
              </div>
            </div>
            <div className="flex">
              {days.map((day, i) => {
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                const today = isToday(day);
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 text-center border-r border-border/20 h-6 flex flex-col items-center justify-center
                      ${isWeekend ? 'bg-muted/30' : ''}
                      ${today ? 'bg-primary/15' : ''}
                    `}
                    style={{ width: `${dayWidth}px` }}
                  >
                    <div className={`text-[9px] font-medium ${today ? 'text-primary font-bold' : isWeekend ? 'text-muted-foreground/50' : 'text-muted-foreground/70'}`}>
                      {format(day, 'dd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* === DATA ROWS === */}
          {columns.map(column => {
            const colCards = cardsWithDates
              .filter(c => c.column_id === column.id)
              .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

            if (colCards.length === 0) return null;
            const isCollapsed = collapsedGroups.has(column.id);

            // Summary bar for group
            const groupCreated = min(colCards.map(c => new Date(c.created_at)));
            const groupDue = max(colCards.map(c => new Date(c.due_date!)));
            const groupStartOffset = Math.max(differenceInDays(startOfDay(groupCreated), ganttStart), 0);
            const groupEndOffset = differenceInDays(startOfDay(groupDue), ganttStart);
            const groupBarWidth = Math.max(groupEndOffset - groupStartOffset + 1, 1);
            const groupProgress = colCards.length > 0
              ? Math.round(colCards.reduce((sum, c) => sum + getCardProgress(c.id), 0) / colCards.length)
              : 0;

            return (
              <div key={column.id}>
                {/* Group header row (summary task) */}
                <div
                  className="flex border-b border-border bg-secondary/20 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => toggleGroup(column.id)}
                >
                  <div className="flex-shrink-0 border-r border-border flex items-center" style={{ width: `${nameColWidth + 220}px` }}>
                    <div className="flex items-center w-full text-xs">
                      <div className="px-2 flex items-center justify-center text-muted-foreground" style={{ width: '32px' }}>
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </div>
                      <div className="px-2 flex-1 flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: column.color || 'hsl(var(--muted))' }} />
                        <span className="font-bold text-foreground truncate text-[11px]">{column.name}</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-muted">{colCards.length}</Badge>
                      </div>
                      <div className="px-2 text-center text-muted-foreground text-[10px]" style={{ width: '60px' }}>
                        {format(groupCreated, 'dd/MM', { locale: ptBR })}
                      </div>
                      <div className="px-2 text-center text-muted-foreground text-[10px]" style={{ width: '60px' }}>
                        {format(groupDue, 'dd/MM', { locale: ptBR })}
                      </div>
                      <div className="px-2 text-center text-muted-foreground text-[10px]" style={{ width: '40px' }}>
                        {differenceInDays(groupDue, groupCreated) + 1}d
                      </div>
                      <div className="px-2 text-center font-bold text-[10px]" style={{ width: '40px', color: column.color || 'hsl(var(--primary))' }}>
                        {groupProgress}%
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-1" style={{ width: `${totalDays * dayWidth}px` }}>
                    {/* Weekend shading */}
                    {days.map((day, i) => {
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                      if (!isWeekend) return null;
                      return <div key={i} className="absolute top-0 bottom-0 bg-muted/20" style={{ left: `${i * dayWidth}px`, width: `${dayWidth}px` }} />;
                    })}
                    {/* Today line */}
                    {todayIdx >= 0 && (
                      <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: `${todayIdx * dayWidth + dayWidth / 2}px` }} />
                    )}
                    {/* Summary bar (bracket style) */}
                    <div
                      className="absolute top-1 h-6 flex items-center"
                      style={{ left: `${groupStartOffset * dayWidth + 2}px`, width: `${groupBarWidth * dayWidth - 4}px` }}
                    >
                      {/* Background bar */}
                      <div className="absolute inset-x-0 top-2 h-2 rounded-sm bg-foreground/20" />
                      {/* Progress fill */}
                      <div
                        className="absolute top-2 h-2 rounded-sm left-0"
                        style={{ width: `${groupProgress}%`, backgroundColor: column.color || 'hsl(var(--primary))' }}
                      />
                      {/* Bracket ends */}
                      <div className="absolute left-0 top-1 w-1 h-4 border-l-2 border-t-2 border-b-2 rounded-l-sm" style={{ borderColor: 'hsl(var(--foreground)/0.4)' }} />
                      <div className="absolute right-0 top-1 w-1 h-4 border-r-2 border-t-2 border-b-2 rounded-r-sm" style={{ borderColor: 'hsl(var(--foreground)/0.4)' }} />
                    </div>
                  </div>
                </div>

                {/* Individual task rows */}
                {!isCollapsed && colCards.map((card, cardIdx) => {
                  globalRowIdx++;
                  const created = startOfDay(new Date(card.created_at));
                  const due = startOfDay(new Date(card.due_date!));
                  const startOffset = Math.max(differenceInDays(created, ganttStart), 0);
                  const endOffset = differenceInDays(due, ganttStart);
                  const barStart = startOffset;
                  const barWidth = Math.max(endOffset - startOffset + 1, 1);
                  const overdue = isPast(due) && !isToday(due);
                  const barColor = priorityColors[card.priority || 'medium'];
                  const duration = differenceInDays(due, created) + 1;
                  const progress = getCardProgress(card.id);
                  const isMilestone = duration <= 1;

                  return (
                    <div
                      key={card.id}
                      className={`flex border-b border-border/30 hover:bg-primary/5 transition-colors
                        ${globalRowIdx % 2 === 0 ? 'bg-background' : 'bg-card'}
                      `}
                    >
                      {/* Task info columns */}
                      <div className="flex-shrink-0 border-r border-border flex items-center" style={{ width: `${nameColWidth + 220}px` }}>
                        <div className="flex items-center w-full text-xs h-8">
                          <div className="px-2 text-center text-muted-foreground/60 text-[10px] font-mono" style={{ width: '32px' }}>
                            {globalRowIdx}
                          </div>
                          <div className="px-2 flex-1 flex items-center gap-2 min-w-0 pl-6">
                            {card.priority === 'urgent' && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
                            {isMilestone && <Diamond className="h-3 w-3 text-primary flex-shrink-0" />}
                            <span className={`text-[11px] truncate ${overdue ? 'text-destructive' : 'text-foreground'}`}>
                              {card.title}
                            </span>
                          </div>
                          <div className="px-2 text-center text-muted-foreground text-[10px]" style={{ width: '60px' }}>
                            {format(created, 'dd/MM')}
                          </div>
                          <div className={`px-2 text-center text-[10px] ${overdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`} style={{ width: '60px' }}>
                            {format(due, 'dd/MM')}
                          </div>
                          <div className="px-2 text-center text-muted-foreground text-[10px]" style={{ width: '40px' }}>
                            {duration}d
                          </div>
                          <div className="px-2 text-center text-[10px] font-semibold" style={{ width: '40px', color: progress === 100 ? '#10b981' : barColor }}>
                            {progress}%
                          </div>
                        </div>
                      </div>

                      {/* Gantt bar area */}
                      <div className="relative flex-1 h-8" style={{ width: `${totalDays * dayWidth}px` }}>
                        {/* Weekend shading */}
                        {days.map((day, i) => {
                          const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                          if (!isWeekend) return null;
                          return <div key={i} className="absolute top-0 bottom-0 bg-muted/15" style={{ left: `${i * dayWidth}px`, width: `${dayWidth}px` }} />;
                        })}
                        {/* Today line */}
                        {todayIdx >= 0 && (
                          <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: `${todayIdx * dayWidth + dayWidth / 2}px` }} />
                        )}

                        {isMilestone ? (
                          /* Milestone diamond */
                          <div
                            className="absolute top-1/2 -translate-y-1/2 z-10"
                            style={{ left: `${barStart * dayWidth + dayWidth / 2 - 6}px` }}
                          >
                            <Diamond className="h-4 w-4 fill-current" style={{ color: barColor }} />
                          </div>
                        ) : (
                          /* Task bar */
                          <div
                            className="absolute top-1.5 h-5 rounded-sm transition-all group/bar"
                            style={{
                              left: `${barStart * dayWidth + 2}px`,
                              width: `${barWidth * dayWidth - 4}px`,
                            }}
                          >
                            {/* Background */}
                            <div
                              className="absolute inset-0 rounded-sm"
                              style={{ backgroundColor: barColor, opacity: overdue ? 0.35 : 0.25 }}
                            />
                            {/* Progress fill */}
                            <div
                              className="absolute top-0 left-0 bottom-0 rounded-sm"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: barColor,
                                opacity: overdue ? 0.7 : 0.85,
                              }}
                            />
                            {/* Border */}
                            <div
                              className="absolute inset-0 rounded-sm border"
                              style={{ borderColor: barColor, opacity: 0.5 }}
                            />
                            {/* Label */}
                            {barWidth * dayWidth > 60 && (
                              <span className="absolute inset-0 flex items-center px-2 text-[9px] font-semibold text-foreground truncate z-10">
                                {card.title}
                              </span>
                            )}
                            {/* Overdue flag */}
                            {overdue && (
                              <Flag className="absolute -right-1 -top-1 h-3 w-3 text-destructive z-20" />
                            )}
                          </div>
                        )}
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
