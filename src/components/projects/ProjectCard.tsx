import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Calendar, Edit, Trash2, Plus, CheckSquare, MessageSquare, Clock, ArrowRight, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan, type ActionCard, type ActionCardItem, type ActionColumn } from "@/hooks/useActionPlan";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCardProps {
  card: ActionCard;
  items: ActionCardItem[];
  columns: ActionColumn[];
  onMoveCard: (cardId: string, newColumnId: string) => void;
}

export function ProjectCard({ card, items, columns, onMoveCard }: ProjectCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { updateCard, deleteCard, createCardItem, updateCardItem, deleteCardItem } = useActionPlan();
  const { confirm } = useConfirmDialog();

  const handleUpdateCard = async (data: any) => {
    await updateCard(card.id, data);
    setIsEditOpen(false);
  };

  const handleDeleteCard = async () => {
    if (window.confirm("Excluir este card?")) await deleteCard(card.id);
  };

  const handleToggleItem = async (item: ActionCardItem) => {
    await updateCardItem(item.id, { is_completed: !item.is_completed });
  };

  const handleAddItem = async () => {
    if (newItemText.trim()) {
      await createCardItem({ card_id: card.id, text: newItemText.trim(), position: items.length, user_id: card.user_id });
      setNewItemText("");
    }
  };

  const completedItems = items.filter(i => i.is_completed).length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const priorityConfig: Record<string, { label: string; color: string; icon?: boolean }> = {
    urgent: { label: "Urgente", color: "bg-destructive text-destructive-foreground", icon: true },
    high: { label: "Alta", color: "bg-orange-500/20 text-orange-400" },
    medium: { label: "Média", color: "bg-primary/15 text-primary" },
    low: { label: "Baixa", color: "bg-muted text-muted-foreground" },
  };

  const priority = priorityConfig[card.priority || "medium"] || priorityConfig.medium;

  const getDueDateInfo = () => {
    if (!card.due_date) return null;
    const date = new Date(card.due_date);
    const overdue = isPast(date) && !isToday(date);
    const today = isToday(date);
    const daysLeft = differenceInDays(date, new Date());

    return {
      text: format(date, "dd MMM", { locale: ptBR }),
      overdue,
      today,
      daysLeft,
      className: overdue ? "text-destructive bg-destructive/10" : today ? "text-warning bg-warning/10" : "text-muted-foreground bg-secondary",
    };
  };

  const dueInfo = getDueDateInfo();

  return (
    <Card
      className="group border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-md hover:shadow-primary/5"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-3 space-y-2.5">
        {/* Top row: Priority + Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className={`text-[10px] font-medium px-1.5 py-0 ${priority.color}`}>
              {priority.icon && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
              {priority.label}
            </Badge>
            {card.color && card.color !== '#f8fafc' && (
              <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: card.color }} />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowRight className="h-3.5 w-3.5 mr-2" /> Mover para
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {columns.filter(c => c.id !== card.column_id).map(col => (
                    <DropdownMenuItem key={col.id} onClick={() => onMoveCard(card.id, col.id)}>
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: col.color || 'hsl(var(--muted))' }} />
                      {col.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteCard} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm text-foreground leading-tight">{card.title}</h4>

        {/* Description preview */}
        {card.description && !isExpanded && (
          <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
        )}
        {card.description && isExpanded && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{card.description}</p>
        )}

        {/* Progress bar for checklist */}
        {totalItems > 0 && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {completedItems}/{totalItems}
              </span>
              <span className="text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Expanded: Checklist items */}
        {isExpanded && items.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group/item py-0.5">
                <Checkbox
                  checked={item.is_completed}
                  onCheckedChange={() => handleToggleItem(item)}
                  className="h-3.5 w-3.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className={`text-xs flex-1 ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {item.text}
                </span>
                <Button
                  variant="ghost" size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCardItem(item.id)}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Expanded: Add item */}
        {isExpanded && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            {isAddingItem ? (
              <div className="flex gap-1.5">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Novo item..."
                  className="h-7 text-xs bg-background border-border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                    if (e.key === 'Escape') { setIsAddingItem(false); setNewItemText(""); }
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-7 px-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddItem}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost" size="sm"
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsAddingItem(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar item
              </Button>
            )}
          </div>
        )}

        {/* Footer: Due date + meta */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {dueInfo && (
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${dueInfo.className}`}>
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                {dueInfo.text}
                {dueInfo.overdue && " (atrasado)"}
              </Badge>
            )}
          </div>
          {totalItems > 0 && !isExpanded && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              {completedItems}/{totalItems}
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <CardDialog card={card} onSave={handleUpdateCard} />
      </Dialog>
    </Card>
  );
}
