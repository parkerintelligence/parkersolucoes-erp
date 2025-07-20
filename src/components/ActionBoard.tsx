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
    try {
      console.log('🎯 Creating column with data:', {
        ...data,
        board_id: boardId,
        position: columns.length,
      });
      
      await createColumn({
        ...data,
        board_id: boardId,
        position: columns.length,
      });
      setIsCreateColumnOpen(false);
    } catch (error) {
      console.error('❌ Error creating column:', error);
    }
  };

  const getCardsForColumn = (columnId: string) => {
    return cards.filter(card => card.column_id === columnId);
  };

  const getItemsForCard = (cardId: string) => {
    return cardItems.filter(item => item.card_id === cardId);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map((column) => (
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
              className="h-12 w-64 border-dashed border-2 hover:border-primary"
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