import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const MikrotikAdminConfig = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [integration, setIntegration] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "Winbox",
    base_url: "",
    username: "",
    password: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      loadIntegration();
    }
  }, [user]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("type", "mikrotik")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIntegration(data);
        setFormData({
          name: data.name || "Winbox",
          base_url: data.base_url || "",
          username: data.username || "",
          password: data.password || "",
          is_active: data.is_active ?? true,
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar integração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de salvar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const integrationData = {
        user_id: user?.id,
        type: "mikrotik",
        name: formData.name,
        base_url: formData.base_url,
        username: formData.username,
        password: formData.password,
        is_active: formData.is_active,
      };

      if (integration) {
        const { error } = await supabase
          .from("integrations")
          .update(integrationData)
          .eq("id", integration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert(integrationData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso",
      });

      loadIntegration();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!integration) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", integration.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso",
      });

      setIntegration(null);
      setFormData({
        name: "Winbox",
        base_url: "",
        username: "",
        password: "",
        is_active: true,
      });
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração Winbox (MikroTik)</CardTitle>
        <CardDescription>
          Configure o acesso ao webfig do MikroTik RouterOS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Integração</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Winbox"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_url">URL de Acesso (WebFig)</Label>
          <Input
            id="base_url"
            value={formData.base_url}
            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            placeholder="http://192.168.88.1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Usuário</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="admin"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Integração Ativa</Label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Configuração
          </Button>
          {integration && (
            <Button
              onClick={handleDelete}
              disabled={saving}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
