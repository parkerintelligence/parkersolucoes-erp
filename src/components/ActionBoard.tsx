import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ActionColumn as ActionColumnComponent } from "@/components/ActionColumn";
import { ColumnDialog } from "@/components/ColumnDialog";
import { useActionPlan, type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";

interface ActionBoardProps {
  boardId: string;
  columns: ActionColumn[];
  cards: ActionCard[];
  cardItems: ActionCardItem[];
}

export function ActionBoard({ boardId, columns, cards, cardItems }: ActionBoardProps) {
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const { createColumn } = useActionPlan();

  const handleCreateColumn = async (data: any) => {
    await createColumn({
      ...data,
      board_id: boardId,
      position: columns.length,
    });
    setIsCreateColumnOpen(false);
  };

  const getCardsForColumn = (columnId: string) => {
    return cards.filter(card => card.column_id === columnId);
  };

  const getItemsForCard = (cardId: string) => {
    return cardItems.filter(item => item.card_id === cardId);
  };

  const boardColumns = columns.filter(col => col.board_id === boardId);

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
      {boardColumns.map((column) => (
        <ActionColumnComponent
          key={column.id}
          column={column}
          cards={getCardsForColumn(column.id)}
          cardItems={cardItems}
          getItemsForCard={getItemsForCard}
        />
      ))}
      
      {/* Add Column Button */}
      <div className="flex-shrink-0">
        <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-12 w-72 border-dashed border-2 border-slate-600/50 hover:border-blue-500/50 hover:bg-slate-700/50 transition-colors shadow-sm bg-slate-800 text-slate-300 hover:text-white"
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