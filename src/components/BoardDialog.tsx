import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type ActionBoard } from "@/hooks/useActionPlan";

interface BoardDialogProps {
  board?: ActionBoard | null;
  onSave: (data: Partial<ActionBoard>) => void;
}

export function BoardDialog({ board, onSave }: BoardDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name,
        description: board.description || "",
        color: board.color,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
      });
    }
  }, [board]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Azul" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#10b981", label: "Verde" },
    { value: "#f59e0b", label: "Amarelo" },
    { value: "#8b5cf6", label: "Roxo" },
    { value: "#f97316", label: "Laranja" },
    { value: "#06b6d4", label: "Ciano" },
    { value: "#84cc16", label: "Lima" },
  ];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {board ? "Editar Quadro" : "Novo Quadro"}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do quadro"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição do quadro (opcional)"
            rows={3}
          />
        </div>
        
        <div>
          <Label>Cor</Label>
          <div className="flex gap-2 mt-2">
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
            {board ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}