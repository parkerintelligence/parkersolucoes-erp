import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ActionCard, type ActionColumn } from "@/hooks/useActionPlan";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface CardDialogProps {
  card?: ActionCard | null;
  columns?: ActionColumn[];
  onSave: (data: Partial<ActionCard>) => void;
}

export const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  not_started: { label: "Não Iniciada", color: "bg-muted text-muted-foreground border-border", icon: "⏳" },
  in_progress: { label: "Em Andamento", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "🔄" },
  on_hold: { label: "Pausada", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: "⏸️" },
  review: { label: "Em Revisão", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: "🔍" },
  completed: { label: "Concluída", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: "✅" },
  cancelled: { label: "Cancelada", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "❌" },
};

export function CardDialog({ card, columns, onSave }: CardDialogProps) {
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "#f8fafc",
    priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
    due_date: "",
    column_id: "",
    status: "not_started",
    assigned_to: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('user_profiles').select('id, email');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description || "",
        color: card.color || "#f8fafc",
        priority: (card.priority as 'low' | 'medium' | 'high' | 'urgent') || "medium",
        due_date: card.due_date || "",
        column_id: card.column_id || "",
        status: (card as any).status || "not_started",
        assigned_to: (card as any).assigned_to || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        color: "#3b82f6",
        priority: "medium",
        due_date: "",
        column_id: columns?.[0]?.id || "",
        status: "not_started",
        assigned_to: "",
      });
    }
  }, [card, columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...formData };
    if (!data.due_date) delete data.due_date;
    if (!data.column_id) delete data.column_id;
    if (!data.assigned_to || data.assigned_to === 'none') data.assigned_to = null;
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
          {card ? "Editar Tarefa" : "Nova Tarefa"}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título da tarefa"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição da tarefa (opcional)"
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
                <SelectItem value="low">🟢 Baixa</SelectItem>
                <SelectItem value="medium">🔵 Média</SelectItem>
                <SelectItem value="high">🟠 Alta</SelectItem>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee */}
        <div>
          <Label>Responsável</Label>
          <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Nenhum</span>
              </SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    {u.email}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="due_date">Data de Vencimento</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {/* Column/Phase Selector */}
          {columns && columns.length > 0 && (
            <div>
              <Label>Fase</Label>
              <Select value={formData.column_id} onValueChange={(value) => setFormData({ ...formData, column_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fase" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color || 'hsl(var(--muted))' }} />
                        {col.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
