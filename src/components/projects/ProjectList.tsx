import { useState, useMemo, useCallback, useEffect } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  CheckSquare, Calendar, Clock, Edit, Trash2, AlertTriangle, ChevronRight, ChevronDown,
  Flag, ArrowUpDown, Plus, Square, CheckCircle2, Circle, MoreHorizontal, ListChecks, GripVertical, User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardDialog, statusConfig } from "@/components/CardDialog";
import { useActionPlan, type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface ProjectListProps {
  columns: ActionColumn[];
  cards: ActionCard[];
  cardItems: ActionCardItem[];
}

const priorityConfig: Record<string, { label: string; dotColor: string; bgColor: string }> = {
  urgent: { label: "Urgente", dotColor: "bg-red-500", bgColor: "bg-red-500/10 text-red-400 border-red-500/20" },
  high: { label: "Alta", dotColor: "bg-orange-500", bgColor: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  medium: { label: "Média", dotColor: "bg-blue-500", bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  low: { label: "Baixa", dotColor: "bg-slate-400", bgColor: "bg-muted text-muted-foreground border-border" },
};
const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

type SortField = 'title' | 'priority' | 'due_date' | 'progress';

export function ProjectList({ columns, cards, cardItems }: ProjectListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(columns.map(c => c.id)));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingCard, setEditingCard] = useState<ActionCard | null>(null);
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Record<string, string>>({});
  const { updateCard, deleteCard, createCard, createCardItem, updateCardItem, deleteCardItem, fetchData } = useActionPlan();
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('user_profiles').select('id, email');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(u => { map[u.id] = u.email; });
        setUsers(map);
      }
    };
    fetchUsers();
  }, []);

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedGroups(next);
  };

  const toggleTask = (id: string) => {
    const next = new Set(expandedTasks);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedTasks(next);
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
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'priority': cmp = (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2); break;
        case 'due_date': cmp = (a.due_date || '9999').localeCompare(b.due_date || '9999'); break;
        case 'progress': cmp = getCardProgress(a.id) - getCardProgress(b.id); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleAddTask = async (columnId: string) => {
    const title = newTaskTitle[columnId]?.trim();
    if (!title) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await createCard({
        title,
        column_id: columnId,
        user_id: user.id,
        position: cards.filter(c => c.column_id === columnId).length,
        color: '#f8fafc',
        priority: 'medium',
      });
      setNewTaskTitle(prev => ({ ...prev, [columnId]: '' }));
    } catch (e) { /* handled by hook */ }
  };

  const handleAddItem = async (cardId: string) => {
    const text = newItemText[cardId]?.trim();
    if (!text) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await createCardItem({
        text,
        card_id: cardId,
        user_id: user.id,
        position: getCardItems(cardId).length,
        is_completed: false,
      });
      setNewItemText(prev => ({ ...prev, [cardId]: '' }));
    } catch (e) { /* handled by hook */ }
  };

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    await updateCardItem(itemId, { is_completed: !isCompleted });
  };

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    const cardId = draggableId;

    // Get cards in destination column sorted
    const destCards = sortCards(cards.filter(c => c.column_id === destColumnId && c.id !== cardId));

    // Build update: new position + possibly new column
    const updates: any = { position: destination.index };
    if (sourceColumnId !== destColumnId) {
      updates.column_id = destColumnId;
    }

    // Update the dragged card
    await updateCard(cardId, updates);

    // Update positions of other cards in destination
    const reorderedDest = [...destCards];
    reorderedDest.splice(destination.index, 0, cards.find(c => c.id === cardId)!);
    
    // Update positions for all cards in affected columns
    const positionUpdates = reorderedDest
      .filter(c => c)
      .map((c, idx) => {
        if (c.id !== cardId && c.position !== idx) {
          return updateCard(c.id, { position: idx });
        }
        return null;
      })
      .filter(Boolean);

    if (sourceColumnId !== destColumnId) {
      // Also update positions in source column
      const sourceCards = sortCards(cards.filter(c => c.column_id === sourceColumnId && c.id !== cardId));
      sourceCards.forEach((c, idx) => {
        if (c.position !== idx) {
          positionUpdates.push(updateCard(c.id, { position: idx }));
        }
      });
    }

    await Promise.all(positionUpdates);

    toast({
      title: sourceColumnId !== destColumnId ? "Tarefa movida" : "Tarefa reordenada",
      description: sourceColumnId !== destColumnId
        ? `Tarefa movida para "${columns.find(c => c.id === destColumnId)?.name}"`
        : "Posição atualizada com sucesso",
    });
  }, [cards, columns, updateCard, sortCards, toast]);

  let globalIdx = 0;

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field && <ArrowUpDown className="h-3 w-3 text-primary" />}
    </button>
  );

  const gridCols = "grid-cols-[24px_40px_1fr_100px_120px_120px_100px_100px_70px_140px_80px]";

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {columns.map(column => {
          const colCards = sortCards(cards.filter(c => c.column_id === column.id));
          const isOpen = expandedGroups.has(column.id);
          const groupProgress = colCards.length > 0
            ? Math.round(colCards.reduce((sum, c) => sum + getCardProgress(c.id), 0) / colCards.length) : 0;
          const groupCompleted = colCards.filter(c => getCardProgress(c.id) === 100).length;

          return (
            <div key={column.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Phase Header */}
              <button
                onClick={() => toggleGroup(column.id)}
                className="w-full flex items-center gap-0 bg-secondary/30 hover:bg-secondary/50 transition-colors border-b border-border"
              >
                <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: column.color || 'hsl(var(--muted))' }} />
                  <span className="font-bold text-sm text-foreground">{column.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">{colCards.length} tarefas</Badge>
                </div>
                <div className="flex items-center gap-5 pr-5">
                  <div className="flex items-center gap-2.5">
                    <Progress value={groupProgress} className="h-2 w-24" />
                    <span className="text-xs font-bold text-muted-foreground min-w-[32px] text-right">{groupProgress}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-green-500" />
                    {groupCompleted}/{colCards.length}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div>
                  {/* Column Header */}
                  <div className={`grid ${gridCols} gap-0 px-4 py-2 bg-secondary/10 border-b border-border text-muted-foreground`}>
                    <span></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">#</span>
                    <SortButton field="title">Tarefa</SortButton>
                    <SortButton field="priority">Prioridade</SortButton>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Status</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Início</span>
                    <SortButton field="due_date">Término</SortButton>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Duração</span>
                    <SortButton field="progress">Progresso</SortButton>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Ações</span>
                  </div>

                  {/* Droppable Task Rows */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[4px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                      >
                        {colCards.map((card, cardIndex) => {
                          globalIdx++;
                          const items = getCardItems(card.id);
                          const completed = items.filter(i => i.is_completed).length;
                          const total = items.length;
                          const progress = getCardProgress(card.id);
                          const p = priorityConfig[card.priority || "medium"] || priorityConfig.medium;
                          const overdue = card.due_date && isPast(new Date(card.due_date)) && !isToday(new Date(card.due_date));
                          const created = new Date(card.created_at);
                          const due = card.due_date ? new Date(card.due_date) : null;
                          const duration = due ? differenceInDays(due, created) + 1 : null;
                          const isExpanded = expandedTasks.has(card.id);
                          const isDone = progress === 100;
                          const currentIdx = globalIdx;

                          return (
                            <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={`border-b border-border/50 last:border-b-0 ${dragSnapshot.isDragging ? 'shadow-lg shadow-primary/10 rounded-lg z-50 opacity-95' : ''}`}
                                >
                                  {/* Main Task Row */}
                                  <div
                                    className={`grid ${gridCols} gap-0 px-4 py-2.5 items-center transition-colors cursor-pointer
                                      ${dragSnapshot.isDragging ? 'bg-primary/10 border border-primary/20 rounded-lg' : overdue && !isDone ? 'bg-red-500/5 hover:bg-red-500/10' : isDone ? 'bg-green-500/5 hover:bg-green-500/8' : currentIdx % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'}
                                    `}
                                    onClick={() => toggleTask(card.id)}
                                  >
                                    {/* Drag Handle */}
                                    <div
                                      {...dragProvided.dragHandleProps}
                                      className="flex items-center justify-center cursor-grab active:cursor-grabbing"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                                    </div>

                                    {/* # */}
                                    <div className="flex items-center gap-1">
                                      {total > 0 ? (
                                        isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : <span className="w-3.5" />}
                                      <span className="text-[10px] text-muted-foreground/60 font-mono">{currentIdx}</span>
                                    </div>

                                    {/* Task Title */}
                                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                      {isDone ? (
                                        <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                                      ) : overdue ? (
                                        <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="h-4.5 w-4.5 text-muted-foreground/40 flex-shrink-0" />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className={`font-semibold text-sm leading-tight truncate ${
                                          isDone ? 'line-through text-muted-foreground' : overdue ? 'text-red-400' : 'text-foreground'
                                        }`}>
                                          {card.title}
                                        </p>
                                        {card.description && (
                                          <p className="text-[11px] text-muted-foreground/60 line-clamp-1 mt-0.5">{card.description}</p>
                                        )}
                                        {total > 0 && (
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <ListChecks className="h-3 w-3 text-muted-foreground/50" />
                                            <span className="text-[10px] text-muted-foreground/60">{completed}/{total} subtarefas</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Priority */}
                                    <div>
                                      <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 border ${p.bgColor}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.dotColor}`} />
                                        {p.label}
                                      </Badge>
                                    </div>

                                    {/* Status */}
                                    <div onClick={e => e.stopPropagation()}>
                                      <Select
                                        value={(card as any).status || 'not_started'}
                                        onValueChange={(value) => updateCard(card.id, { status: value } as any)}
                                      >
                                        <SelectTrigger className="h-6 text-[10px] border-0 bg-transparent p-0 w-auto gap-1 shadow-none focus:ring-0">
                                          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 border cursor-pointer ${statusConfig[(card as any).status || 'not_started']?.color || statusConfig.not_started.color}`}>
                                            {statusConfig[(card as any).status || 'not_started']?.icon} {statusConfig[(card as any).status || 'not_started']?.label}
                                          </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(statusConfig).map(([key, cfg]) => (
                                            <SelectItem key={key} value={key} className="text-xs">
                                              {cfg.icon} {cfg.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                      <span className="text-xs text-muted-foreground">{format(created, "dd/MM/yy")}</span>
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                      {due ? (
                                        <span className={`text-xs font-medium ${overdue && !isDone ? 'text-red-400' : 'text-muted-foreground'}`}>
                                          {format(due, "dd/MM/yy")}
                                        </span>
                                      ) : <span className="text-xs text-muted-foreground/30">—</span>}
                                    </div>

                                    {/* Duration */}
                                    <div>
                                      {duration !== null ? (
                                        <span className="text-xs text-muted-foreground font-mono">{duration}d</span>
                                      ) : <span className="text-xs text-muted-foreground/30">—</span>}
                                    </div>

                                    {/* Progress */}
                                    <div className="flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-300"
                                          style={{
                                            width: `${progress}%`,
                                            backgroundColor: progress === 100 ? '#10b981' : progress > 50 ? '#3b82f6' : progress > 0 ? '#f59e0b' : 'transparent'
                                          }}
                                        />
                                      </div>
                                      <span className={`text-xs font-bold min-w-[32px] text-right ${
                                        isDone ? 'text-green-500' : progress > 0 ? 'text-primary' : 'text-muted-foreground/40'
                                      }`}>
                                        {progress}%
                                      </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingCard(card)}>
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={async () => { const ok = await confirm({ title: "Excluir tarefa", description: "Tem certeza que deseja excluir esta tarefa?" }); if (ok) deleteCard(card.id); }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Expanded: Checklist Items */}
                                  {isExpanded && (
                                    <div className="bg-secondary/20 border-t border-border/30 px-4 py-3">
                                      <div className="ml-16 space-y-1.5">
                                        <div className="flex items-center gap-2 mb-2">
                                          <ListChecks className="h-3.5 w-3.5 text-primary" />
                                          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Subtarefas</span>
                                          <span className="text-[10px] text-muted-foreground">({completed}/{total})</span>
                                        </div>

                                        {items.map(item => (
                                          <div key={item.id} className="flex items-center gap-2.5 group py-1 px-2 rounded-md hover:bg-background/60 transition-colors">
                                            <Checkbox
                                              checked={item.is_completed}
                                              onCheckedChange={() => handleToggleItem(item.id, item.is_completed)}
                                              className="h-4 w-4 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                            />
                                            <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
                                              {item.text}
                                            </span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                              onClick={() => deleteCardItem(item.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}

                                        {/* Add new subtask */}
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                                          <Plus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                          <Input
                                            placeholder="Adicionar subtarefa..."
                                            value={newItemText[card.id] || ''}
                                            onChange={e => setNewItemText(prev => ({ ...prev, [card.id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleAddItem(card.id)}
                                            className="h-7 text-xs bg-background/60 border-border/50 flex-1"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleAddItem(card.id)}
                                            className="h-7 px-2 text-xs text-primary hover:text-primary"
                                            disabled={!newItemText[card.id]?.trim()}
                                          >
                                            Adicionar
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add new task */}
                  <div className="px-4 py-2.5 bg-secondary/10 border-t border-border/30">
                    <div className="flex items-center gap-2 ml-16">
                      <Plus className="h-4 w-4 text-primary/60 flex-shrink-0" />
                      <Input
                        placeholder="Adicionar nova tarefa..."
                        value={newTaskTitle[column.id] || ''}
                        onChange={e => setNewTaskTitle(prev => ({ ...prev, [column.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask(column.id)}
                        className="h-8 text-sm bg-background/60 border-border/50 flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddTask(column.id)}
                        className="h-8 px-3 text-xs bg-primary/90 hover:bg-primary text-primary-foreground"
                        disabled={!newTaskTitle[column.id]?.trim()}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Criar
                      </Button>
                    </div>
                  </div>

                  {colCards.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      Nenhuma tarefa nesta fase — adicione acima
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
          {editingCard && (
            <CardDialog card={editingCard} columns={columns} onSave={async (data) => { await updateCard(editingCard.id, data); setEditingCard(null); }} />
          )}
        </Dialog>
      </div>
    </DragDropContext>
  );
}
