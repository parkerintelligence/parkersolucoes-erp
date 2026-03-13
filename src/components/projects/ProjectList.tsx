import { useState, useMemo } from "react";
import { CheckSquare, Calendar, Clock, Edit, Trash2, AlertTriangle, ChevronRight, ChevronDown, Flag, Diamond, ArrowUpDown, GripVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan, type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectListProps {
  columns: ActionColumn[];
  cards: ActionCard[];
  cardItems: ActionCardItem[];
}

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
const priorityConfig: Record<string, { label: string; color: string; icon?: string }> = {
  urgent: { label: "Urgente", color: "bg-destructive/15 text-destructive border-destructive/20", icon: "🔴" },
  high: { label: "Alta", color: "bg-orange-500/15 text-orange-500 border-orange-500/20", icon: "🟠" },
  medium: { label: "Média", color: "bg-primary/10 text-primary border-primary/20", icon: "🔵" },
  low: { label: "Baixa", color: "bg-muted text-muted-foreground border-muted", icon: "⚪" },
};

type SortField = 'title' | 'priority' | 'due_date' | 'progress';

export function ProjectList({ columns, cards, cardItems }: ProjectListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(columns.map(c => c.id)));
  const [editingCard, setEditingCard] = useState<ActionCard | null>(null);
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const { updateCard, deleteCard } = useActionPlan();

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedGroups(next);
  };

  const getCardItems = (cardId: string) => cardItems.filter(i => i.card_id === cardId);

  const getCardProgress = (cardId: string) => {
    const items = getCardItems(cardId);
    if (items.length === 0) return 0;
    return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
  };

  const sortCards = (cardsToSort: ActionCard[]) => {
    return [...cardsToSort].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'priority':
          cmp = (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);
          break;
        case 'due_date':
          cmp = (a.due_date || '9999').localeCompare(b.due_date || '9999');
          break;
        case 'progress':
          cmp = getCardProgress(a.id) - getCardProgress(b.id);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  let globalRowIdx = 0;

  const SortHeader = ({ field, children, width }: { field: SortField; children: React.ReactNode; width?: string }) => (
    <TableHead
      className={`text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none ${width || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <ArrowUpDown className="h-3 w-3 text-primary" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      {columns.map(column => {
        const colCards = sortCards(cards.filter(c => c.column_id === column.id));
        const isOpen = expandedGroups.has(column.id);
        const groupProgress = colCards.length > 0
          ? Math.round(colCards.reduce((sum, c) => sum + getCardProgress(c.id), 0) / colCards.length)
          : 0;
        const groupCompleted = colCards.filter(c => getCardProgress(c.id) === 100).length;

        return (
          <div key={column.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            {/* Group Header - Summary Task Row */}
            <button
              onClick={() => toggleGroup(column.id)}
              className="w-full flex items-center gap-0 bg-secondary/40 hover:bg-secondary/60 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: column.color || 'hsl(var(--muted))' }} />
                <span className="font-bold text-xs text-foreground truncate">{column.name}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-muted ml-1">{colCards.length}</Badge>
              </div>
              <div className="flex items-center gap-4 pr-4">
                <div className="flex items-center gap-2">
                  <Progress value={groupProgress} className="h-1.5 w-20" />
                  <span className="text-[10px] font-bold text-muted-foreground min-w-[32px] text-right">{groupProgress}%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {groupCompleted}/{colCards.length} concluídas
                </span>
              </div>
            </button>

            {isOpen && colCards.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent bg-secondary/10">
                    <TableHead className="w-8 text-[10px] text-muted-foreground font-bold">#</TableHead>
                    <TableHead className="w-6"></TableHead>
                    <SortHeader field="title">Tarefa</SortHeader>
                    <SortHeader field="priority" width="w-24">Prioridade</SortHeader>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20">Início</TableHead>
                    <SortHeader field="due_date" width="w-20">Término</SortHeader>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-16">Duração</TableHead>
                    <SortHeader field="progress" width="w-36">% Concluída</SortHeader>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colCards.map(card => {
                    globalRowIdx++;
                    const items = getCardItems(card.id);
                    const completed = items.filter(i => i.is_completed).length;
                    const total = items.length;
                    const progress = getCardProgress(card.id);
                    const p = priorityConfig[card.priority || "medium"] || priorityConfig.medium;
                    const overdue = card.due_date && isPast(new Date(card.due_date)) && !isToday(new Date(card.due_date));
                    const created = new Date(card.created_at);
                    const due = card.due_date ? new Date(card.due_date) : null;
                    const duration = due ? differenceInDays(due, created) + 1 : null;

                    return (
                      <TableRow
                        key={card.id}
                        className={`border-border group transition-colors
                          ${globalRowIdx % 2 === 0 ? 'bg-background' : 'bg-card'}
                          ${overdue ? 'hover:bg-destructive/5' : 'hover:bg-primary/5'}
                          ${progress === 100 ? 'opacity-60' : ''}
                        `}
                      >
                        <TableCell className="py-1.5">
                          <span className="text-[10px] text-muted-foreground/50 font-mono">{globalRowIdx}</span>
                        </TableCell>
                        <TableCell className="py-1.5">
                          {card.priority === 'urgent' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          ) : overdue ? (
                            <Flag className="h-3.5 w-3.5 text-destructive" />
                          ) : progress === 100 ? (
                            <CheckSquare className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: card.color && card.color !== '#f8fafc' ? card.color : 'transparent' }} />
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <div className="min-w-0">
                            <p className={`font-medium text-[11px] truncate ${overdue ? 'text-destructive' : progress === 100 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {card.title}
                            </p>
                            {card.description && (
                              <p className="text-[10px] text-muted-foreground/60 line-clamp-1 mt-0.5">{card.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="outline" className={`text-[9px] font-semibold px-1.5 py-0 border ${p.color}`}>
                            {p.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {format(created, "dd/MM/yy")}
                          </span>
                        </TableCell>
                        <TableCell className="py-1.5">
                          {due ? (
                            <span className={`text-[10px] font-medium ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {format(due, "dd/MM/yy")}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          {duration !== null ? (
                            <span className="text-[10px] text-muted-foreground font-mono">{duration}d</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: progress === 100 ? '#10b981' : progress > 50 ? '#3b82f6' : '#f59e0b'
                                }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold min-w-[28px] text-right ${
                              progress === 100 ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => setEditingCard(card)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => { if (window.confirm("Excluir esta tarefa?")) deleteCard(card.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {isOpen && colCards.length === 0 && (
              <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">
                Nenhuma tarefa nesta fase
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        {editingCard && (
          <CardDialog card={editingCard} onSave={async (data) => { await updateCard(editingCard.id, data); setEditingCard(null); }} />
        )}
      </Dialog>
    </div>
  );
}
