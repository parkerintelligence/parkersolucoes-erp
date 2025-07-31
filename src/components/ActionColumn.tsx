
import React, { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ActionCardComponent } from "@/components/ActionCard";
import { ColumnDialog } from "@/components/ColumnDialog";
import { CardDialog } from "@/components/CardDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const { createCard, updateColumn, deleteColumn } = useActionPlan();

  const handleCreateCard = async (data: any) => {
    try {
      console.log('🎯 Creating card with data:', data);
      await createCard({
        title: data.title,
        description: data.description || "",
        column_id: column.id,
        position: cards.length,
        priority: data.priority || "medium",
        color: data.color || "#f8fafc",
        due_date: data.due_date || null,
      });
      setIsCreateCardOpen(false);
    } catch (error) {
      console.error('❌ Error creating card:', error);
    }
  };

  const handleUpdateColumn = async (data: any) => {
    try {
      await updateColumn(column.id, data);
      setIsEditColumnOpen(false);
    } catch (error) {
      console.error('❌ Error updating column:', error);
    }
  };

  const handleDeleteColumn = async () => {
    setIsDeleting(true);
    try {
      await deleteColumn(column.id);
    } catch (error) {
      console.error('❌ Error deleting column:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-80 flex-shrink-0 bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: column.color }}
            />
            {column.name}
          </CardTitle>
          <div className="flex gap-1">
            <Dialog open={isEditColumnOpen} onOpenChange={setIsEditColumnOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-slate-800">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <ColumnDialog column={column} onSave={handleUpdateColumn} />
            </Dialog>
            <ConfirmationDialog
              title="Excluir Coluna"
              description={
                cards.length > 0 
                  ? `Esta coluna contém ${cards.length} card(s). Tem certeza que deseja excluir a coluna "${column.name}" e todos os seus cards? Esta ação não pode ser desfeita.`
                  : `Tem certeza que deseja excluir a coluna "${column.name}"? Esta ação não pode ser desfeita.`
              }
              onConfirm={handleDeleteColumn}
              confirmText="Excluir"
              variant="destructive"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-slate-800"
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </ConfirmationDialog>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
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
              className="w-full border-dashed border-2 border-slate-600 h-8 text-white hover:bg-slate-800 hover:border-slate-500"
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
