import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Server, Save, X, Shield, Globe } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface Props {
  onClose: () => void;
}

export const RustDeskServerConfig = ({ onClose }: Props) => {
  const { data: integrations = [] } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();

  const existing = integrations.find(i => i.type === 'rustdesk');

  const [form, setForm] = useState({
    name: 'RustDesk Server',
    base_url: '',
    api_token: '',
    username: '',
    password: '',
    is_active: true,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || 'RustDesk Server',
        base_url: existing.base_url || '',
        api_token: existing.api_token || '',
        username: existing.username || '',
        password: existing.password || '',
        is_active: existing.is_active ?? true,
      });
    }
  }, [existing]);

  const handleSave = async () => {
    if (!form.base_url) {
      toast({ title: "URL obrigatória", description: "Informe a URL do servidor RustDesk.", variant: "destructive" });
      return;
    }

    try {
      if (existing) {
        await updateIntegration.mutateAsync({
          id: existing.id,
          updates: {
            ...form,
            type: 'rustdesk',
          },
        });
      } else {
        await createIntegration.mutateAsync({
          ...form,
          type: 'rustdesk',
          is_global: true,
        } as any);
      }
      toast({ title: "Servidor salvo!", description: "Configuração do servidor RustDesk salva com sucesso." });
    } catch (error) {
      console.error('Erro ao salvar servidor:', error);
    }
  };

  return (
    <Card className="bg-slate-800 border-orange-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Server className="h-5 w-5 text-orange-400" />
              Configuração do Servidor RustDesk
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure seu servidor RustDesk próprio (hbbs/hbbr) para conexões seguras
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              <Globe className="h-3 w-3 inline mr-1" />
              URL do Servidor / Web Client
            </label>
            <Input
              value={form.base_url}
              onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))}
              placeholder="https://rustdesk.meuservidor.com"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">URL do servidor hbbs ou do web client RustDesk</p>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              <Shield className="h-3 w-3 inline mr-1" />
              Chave Pública (Key)
            </label>
            <Input
              value={form.api_token}
              onChange={e => setForm(p => ({ ...p, api_token: e.target.value }))}
              placeholder="Chave pública do servidor"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Chave pública para verificação de conexão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Usuário API (opcional)</label>
            <Input
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="admin"
              className="bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Senha API (opcional)</label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Senha da API"
              className="bg-slate-900 border-slate-600 text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
          <div>
            <p className="text-sm text-white">Servidor ativo</p>
            <p className="text-xs text-slate-400">Habilitar uso do servidor próprio para conexões</p>
          </div>
          <Switch
            checked={form.is_active}
            onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))}
          />
        </div>

        {existing && (
          <div className="flex items-center gap-2">
            <Badge className={existing.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
              {existing.is_active ? 'Configurado e Ativo' : 'Configurado mas Inativo'}
            </Badge>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={createIntegration.isPending || updateIntegration.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar Servidor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
