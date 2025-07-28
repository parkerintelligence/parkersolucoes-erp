import { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ActionCardComponent } from "@/components/ActionCard";
import { ColumnDialog } from "@/components/ColumnDialog";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan, type ActionColumn, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";

interface ActionColumnProps {
  column: ActionColumn;
  cards: ActionCard[];
  cardItems: ActionCardItem[];
  getItemsForCard: (cardId: string) => ActionCardItem[];
}

export function ActionColumn({ column, cards, cardItems, getItemsForCard }: ActionColumnProps) {
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
  const { createCard, updateColumn, deleteColumn } = useActionPlan();

  const handleCreateCard = async (data: any) => {
    await createCard({
      ...data,
      column_id: column.id,
      position: cards.length,
    });
    setIsCreateCardOpen(false);
  };

  const handleUpdateColumn = async (data: any) => {
    await updateColumn(column.id, data);
    setIsEditColumnOpen(false);
  };

  const handleDeleteColumn = async () => {
    if (window.confirm("Tem certeza que deseja excluir esta coluna e todos os seus cards?")) {
      await deleteColumn(column.id);
    }
  };

  return (
    <Card className="w-80 flex-shrink-0 bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium" style={{ color: column.color }}>
            {column.name}
          </CardTitle>
          <div className="flex gap-1">
            <Dialog open={isEditColumnOpen} onOpenChange={setIsEditColumnOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <ColumnDialog column={column} onSave={handleUpdateColumn} />
            </Dialog>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={handleDeleteColumn}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {cards.map((card) => (
          <ActionCardComponent
            key={card.id}
            card={card}
            items={getItemsForCard(card.id)}
          />
        ))}
        
        <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full border-dashed border-2 border-muted-foreground/25 h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Card
            </Button>
          </DialogTrigger>
          <CardDialog onSave={handleCreateCard} />
        </Dialog>
      </CardContent>
    </Card>
  );
}