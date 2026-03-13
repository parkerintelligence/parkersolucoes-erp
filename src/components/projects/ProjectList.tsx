import { useState } from "react";
import { CheckSquare, Calendar, Clock, Edit, Trash2, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan, type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectListProps {
  columns: ActionColumn[];
  cards: ActionCard[];
  cardItems: ActionCardItem[];
}

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgente", color: "bg-destructive text-destructive-foreground" },
  high: { label: "Alta", color: "bg-orange-500/20 text-orange-400" },
  medium: { label: "Média", color: "bg-primary/15 text-primary" },
  low: { label: "Baixa", color: "bg-muted text-muted-foreground" },
};

export function ProjectList({ columns, cards, cardItems }: ProjectListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(columns.map(c => c.id)));
  const [editingCard, setEditingCard] = useState<ActionCard | null>(null);
  const { updateCard, deleteCard } = useActionPlan();

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedGroups(next);
  };

  const getCardItems = (cardId: string) => cardItems.filter(i => i.card_id === cardId);

  return (
    <div className="space-y-4">
      {columns.map(column => {
        const colCards = cards
          .filter(c => c.column_id === column.id)
          .sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2));
        const isOpen = expandedGroups.has(column.id);

        return (
          <div key={column.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => toggleGroup(column.id)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || 'hsl(var(--muted))' }} />
              <span className="font-semibold text-sm text-foreground">{column.name}</span>
              <Badge variant="secondary" className="text-[10px]">{colCards.length}</Badge>
            </button>

            {isOpen && colCards.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="text-muted-foreground text-xs">Título</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-24">Prioridade</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-28">Vencimento</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-28">Progresso</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colCards.map(card => {
                    const items = getCardItems(card.id);
                    const completed = items.filter(i => i.is_completed).length;
                    const total = items.length;
                    const progress = total > 0 ? (completed / total) * 100 : 0;
                    const p = priorityConfig[card.priority || "medium"] || priorityConfig.medium;
                    const overdue = card.due_date && isPast(new Date(card.due_date)) && !isToday(new Date(card.due_date));

                    return (
                      <TableRow key={card.id} className="border-border hover:bg-secondary/20 group">
                        <TableCell>
                          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: card.color && card.color !== '#f8fafc' ? card.color : 'transparent' }} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-foreground">{card.title}</p>
                            {card.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{card.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${p.color}`}>{p.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {card.due_date ? (
                            <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(card.due_date), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {total > 0 ? (
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="h-1.5 w-16" />
                              <span className="text-[10px] text-muted-foreground">{completed}/{total}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => setEditingCard(card)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => { if (window.confirm("Excluir?")) deleteCard(card.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
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
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum card nesta coluna
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
