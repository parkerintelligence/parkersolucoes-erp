import React, { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ActionCard } from "@/hooks/useActionPlan";

interface CardDialogProps {
  card?: ActionCard | null;
  onSave: (data: Partial<ActionCard>) => void;
}

export function CardDialog({ card, onSave }: CardDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "#f8fafc",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    due_date: "",
  });

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description || "",
        color: card.color,
        priority: card.priority as 'low' | 'medium' | 'high' | 'urgent',
        due_date: card.due_date || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        color: "#f8fafc",
        priority: "medium",
        due_date: "",
      });
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.due_date) {
      delete (data as any).due_date;
    }
    onSave(data);
  };

  const colorOptions = [
    { value: "#f8fafc", label: "Branco" },
    { value: "#e0e7ff", label: "Azul Claro" },
    { value: "#fecaca", label: "Vermelho Claro" },
    { value: "#bbf7d0", label: "Verde Claro" },
    { value: "#fef3c7", label: "Amarelo Claro" },
    { value: "#e9d5ff", label: "Roxo Claro" },
    { value: "#fed7aa", label: "Laranja Claro" },
    { value: "#a7f3d0", label: "Esmeralda Claro" },
  ];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {card ? "Editar Card" : "Novo Card"}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título do card"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição do card (opcional)"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="due_date">Data de Vencimento</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>
        
        <div>
          <Label>Cor</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color.value 
                    ? 'border-foreground' 
                    : 'border-muted-foreground/25'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setFormData({ ...formData, color: color.value })}
                title={color.label}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="submit">
            {card ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}