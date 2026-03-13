import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Plus, MoreHorizontal, Settings, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectCard } from "./ProjectCard";
import { ColumnDialog } from "@/components/ColumnDialog";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan, type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";

interface ProjectKanbanProps {
  boardId: string;
  columns: ActionColumn[];
  cards: ActionCard[];
  cardItems: ActionCardItem[];
}

export function ProjectKanban({ boardId, columns, cards, cardItems }: ProjectKanbanProps) {
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [createCardColumnId, setCreateCardColumnId] = useState<string | null>(null);
  const { createColumn, updateColumn, deleteColumn, createCard, updateCard } = useActionPlan();
  const { confirm } = useConfirmDialog();

  const handleCreateColumn = async (data: any) => {
    await createColumn({ ...data, board_id: boardId, position: columns.length });
    setIsCreateColumnOpen(false);
  };

  const handleCreateCard = async (columnId: string, data: any) => {
    const columnCards = cards.filter(c => c.column_id === columnId);
    await createCard({ ...data, column_id: columnId, position: columnCards.length });
    setCreateCardColumnId(null);
  };

  const handleDeleteColumn = async (id: string) => {
    if (window.confirm("Excluir esta coluna e todos os seus cards?")) {
      await deleteColumn(id);
    }
  };

  const handleMoveCard = async (cardId: string, newColumnId: string) => {
    await updateCard(cardId, { column_id: newColumnId });
  };

  const getCardsForColumn = (columnId: string) =>
    cards.filter(c => c.column_id === columnId);

  const getItemsForCard = (cardId: string) =>
    cardItems.filter(i => i.card_id === cardId);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {columns.map((column) => {
        const colCards = getCardsForColumn(column.id);
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-[300px] sm:w-[320px] flex flex-col bg-card/50 rounded-xl border border-border"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color || 'hsl(var(--muted-foreground))' }} />
                <h3 className="font-semibold text-sm text-foreground truncate">{column.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                  {colCards.length}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingColumnId(column.id)}>
                    <Settings className="h-3.5 w-3.5 mr-2" /> Editar Coluna
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteColumn(column.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Coluna
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-380px)]">
              <div className="p-3 space-y-2.5">
                {colCards.map((card) => (
                  <ProjectCard
                    key={card.id}
                    card={card}
                    items={getItemsForCard(card.id)}
                    columns={columns}
                    onMoveCard={handleMoveCard}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Add Card */}
            <div className="p-3 border-t border-border/50">
              <Dialog
                open={createCardColumnId === column.id}
                onOpenChange={(open) => setCreateCardColumnId(open ? column.id : null)}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-dashed border-border/50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar Card
                  </Button>
                </DialogTrigger>
                <CardDialog onSave={(data) => handleCreateCard(column.id, data)} />
              </Dialog>
            </div>

            {/* Edit Column Dialog */}
            <Dialog
              open={editingColumnId === column.id}
              onOpenChange={(open) => !open && setEditingColumnId(null)}
            >
              <ColumnDialog
                column={column}
                onSave={async (data) => { await updateColumn(column.id, data); setEditingColumnId(null); }}
              />
            </Dialog>
          </div>
        );
      })}

      {/* Add Column */}
      <div className="flex-shrink-0">
        <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-12 w-[300px] sm:w-[320px] border-dashed border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Coluna
            </Button>
          </DialogTrigger>
          <ColumnDialog onSave={handleCreateColumn} />
        </Dialog>
      </div>
    </div>
  );
}
