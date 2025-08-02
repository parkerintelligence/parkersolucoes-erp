import React from "react";
import { Calendar, Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan, type ActionCard, type ActionCardItem } from "@/hooks/useActionPlan";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActionCardProps {
  card: ActionCard;
  items: ActionCardItem[];
}

export function ActionCardComponent({ card, items }: ActionCardProps) {
  const [isEditCardOpen, setIsEditCardOpen] = React.useState(false);
  const [newItemText, setNewItemText] = React.useState("");
  const [isAddingItem, setIsAddingItem] = React.useState(false);
  
  const { 
    updateCard, 
    deleteCard, 
    createCardItem, 
    updateCardItem, 
    deleteCardItem 
  } = useActionPlan();

  const handleUpdateCard = async (data: any) => {
    await updateCard(card.id, data);
    setIsEditCardOpen(false);
  };

  const handleDeleteCard = async () => {
    if (window.confirm("Tem certeza que deseja excluir este card?")) {
      await deleteCard(card.id);
    }
  };

  const handleToggleItem = async (item: ActionCardItem) => {
    await updateCardItem(item.id, {
      is_completed: !item.is_completed
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteCardItem(itemId);
  };

  const handleAddItem = async () => {
    if (newItemText.trim()) {
      await createCardItem({
        card_id: card.id,
        text: newItemText.trim(),
        position: items.length,
        user_id: card.user_id,
      });
      setNewItemText("");
      setIsAddingItem(false);
    }
  };

  const completedItems = items.filter(item => item.is_completed).length;
  const totalItems = items.length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Média';
    }
  };

  return (
    <Card className="w-full border-l-4 bg-slate-700/90 border-slate-500" style={{ borderLeftColor: card.color }}>
      <CardHeader className="pb-1 pt-2 px-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight text-white">{card.title}</h4>
          <div className="flex gap-1">
            <Dialog open={isEditCardOpen} onOpenChange={setIsEditCardOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-300 hover:text-white hover:bg-slate-600">
                  <Edit className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <CardDialog card={card} onSave={handleUpdateCard} />
            </Dialog>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={handleDeleteCard}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {card.description && (
          <p className="text-xs text-slate-300 mt-1">{card.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 px-3 pb-2 space-y-1">
        {/* Priority and Due Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getPriorityColor(card.priority)} text-white`}
          >
            {getPriorityLabel(card.priority)}
          </Badge>
          
          {card.due_date && (
            <Badge variant="outline" className="text-xs text-slate-300 border-slate-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(card.due_date), "dd/MM", { locale: ptBR })}
            </Badge>
          )}
          
          {totalItems > 0 && (
            <Badge variant="outline" className="text-xs text-slate-300 border-slate-500">
              {completedItems}/{totalItems}
            </Badge>
          )}
        </div>

        {/* Card Items */}
        {items.length > 0 && (
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group">
                <Checkbox
                  checked={item.is_completed}
                  onCheckedChange={() => handleToggleItem(item)}
                  className="h-3 w-3 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span 
                  className={`text-xs flex-1 ${
                    item.is_completed 
                      ? 'line-through text-slate-400' 
                      : 'text-slate-200'
                  }`}
                >
                  {item.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Item */}
        {isAddingItem ? (
          <div className="flex gap-2">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Digite o item..."
              className="h-6 text-xs bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') {
                  setIsAddingItem(false);
                  setNewItemText("");
                }
              }}
              autoFocus
            />
            <Button size="sm" className="h-6 px-2 bg-blue-600 hover:bg-blue-700" onClick={handleAddItem}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-6 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-600"
            onClick={() => setIsAddingItem(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar item
          </Button>
        )}
      </CardContent>
    </Card>
  );
}