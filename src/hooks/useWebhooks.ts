import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  actions?: WebhookAction[];
}

export interface WebhookAction {
  id: string;
  webhook_id: string;
  user_id: string;
  action_type: 'whatsapp' | 'email';
  destination: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useWebhooks() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: wh, error: whErr } = await supabase
        .from('webhooks' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (whErr) throw whErr;

      const { data: actions, error: actErr } = await supabase
        .from('webhook_actions' as any)
        .select('*');

      if (actErr) throw actErr;

      const webhooksData = (wh || []).map((w: any) => ({
        ...w,
        actions: (actions || []).filter((a: any) => a.webhook_id === w.id),
      }));

      setWebhooks(webhooksData);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (data: { name: string; slug: string; description?: string }) => {
    if (!user) return null;
    try {
      const { data: wh, error } = await supabase
        .from('webhooks' as any)
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      toast.success('Webhook criado com sucesso');
      await fetchWebhooks();
      return wh;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar webhook');
      return null;
    }
  };

  const updateWebhook = async (id: string, data: Partial<Webhook>) => {
    try {
      const { error } = await supabase
        .from('webhooks' as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('Webhook atualizado');
      await fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Webhook excluído');
      await fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir webhook');
    }
  };

  const createAction = async (data: { webhook_id: string; action_type: string; destination: string; message_template?: string }) => {
    if (!user) return null;
    try {
      const { data: action, error } = await supabase
        .from('webhook_actions' as any)
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      toast.success('Ação adicionada');
      await fetchWebhooks();
      return action;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar ação');
      return null;
    }
  };

  const updateAction = async (id: string, data: Partial<WebhookAction>) => {
    try {
      const { error } = await supabase
        .from('webhook_actions' as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('Ação atualizada');
      await fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar ação');
    }
  };

  const deleteAction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_actions' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Ação excluída');
      await fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir ação');
    }
  };

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    try {
      const supabaseUrl = 'https://mpvxppgoyadwukkfoccs.supabase.co';
      const url = `${supabaseUrl}/functions/v1/webhook-receiver/${webhook.slug}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Teste do webhook "${webhook.name}" em ${new Date().toLocaleString('pt-BR')}`, test: true }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const results = data.results || [];
        if (results.length === 0) {
          toast.info(`Webhook "${webhook.name}": ${data.message || 'Nenhuma ação configurada'}`);
        } else {
          const details = results.map((r: any) => {
            const status = r.success ? '✅' : '❌';
            const dest = r.destination || '';
            const err = r.result?.error ? ` - ${r.result.error}` : '';
            return `${status} ${r.action} → ${dest}${err}`;
          }).join('\n');
          
          const allSuccess = results.every((r: any) => r.success);
          if (allSuccess) {
            toast.success(`Webhook "${webhook.name}" testado!\n${details}`, { duration: 8000 });
          } else {
            toast.warning(`Webhook "${webhook.name}" com falhas:\n${details}`, { duration: 10000 });
          }
        }
      } else {
        toast.error(`Erro no teste: ${data.error || response.statusText}`);
      }
    } catch (error: any) {
      toast.error(`Erro ao testar: ${error.message}`);
    }
  };

  return {
    webhooks,
    loading,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    createAction,
    updateAction,
    deleteAction,
    testWebhook,
  };
}
