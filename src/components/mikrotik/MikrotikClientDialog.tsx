import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface MikrotikClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  onSuccess: () => void;
}

export const MikrotikClientDialog = ({ open, onOpenChange, client, onSuccess }: MikrotikClientDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    username: '',
    password: '',
    is_active: true,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        base_url: client.base_url || '',
        username: client.username || '',
        password: client.password || '',
        is_active: client.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        base_url: '',
        username: '',
        password: '',
        is_active: true,
      });
    }
  }, [client, open]);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.name || !formData.base_url || !formData.username || !formData.password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        type: 'mikrotik',
        user_id: user.id,
      };

      let error;
      if (client) {
        const { error: updateError } = await supabase
          .from('integrations')
          .update(payload)
          .eq('id', client.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('integrations')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: client ? 'Cliente atualizado com sucesso' : 'Cliente adicionado com sucesso',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cliente',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'} MikroTik</DialogTitle>
          <DialogDescription>
            {client ? 'Atualize as informações do cliente' : 'Adicione um novo cliente MikroTik'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              placeholder="Ex: Escritório Central"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="base_url">URL da API *</Label>
            <Input
              id="base_url"
              placeholder="http://192.168.1.1:8999"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Usuário *</Label>
            <Input
              id="username"
              placeholder="admin"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Cliente Ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
