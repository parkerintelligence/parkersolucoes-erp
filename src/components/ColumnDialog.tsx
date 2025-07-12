import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ActionColumn } from "@/hooks/useActionPlan";

interface ColumnDialogProps {
  column?: ActionColumn | null;
  onSave: (data: Partial<ActionColumn>) => void;
}

export function ColumnDialog({ column, onSave }: ColumnDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    color: "#64748b",
  });

  useEffect(() => {
    if (column) {
      setFormData({
        name: column.name,
        color: column.color,
      });
    } else {
      setFormData({
        name: "",
        color: "#64748b",
      });
    }
  }, [column]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const colorOptions = [
    { value: "#64748b", label: "Slate" },
    { value: "#3b82f6", label: "Azul" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#10b981", label: "Verde" },
    { value: "#f59e0b", label: "Amarelo" },
    { value: "#8b5cf6", label: "Roxo" },
    { value: "#f97316", label: "Laranja" },
    { value: "#06b6d4", label: "Ciano" },
  ];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {column ? "Editar Coluna" : "Nova Coluna"}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome da coluna"
            required
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
          <Button 
            type="submit"
            disabled={!formData.name.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {column ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}