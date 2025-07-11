import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Edit,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Play,
  TestTube,
  RefreshCcw,
  Settings,
  Send
} from 'lucide-react';
import { useZabbixWebhooks, ZabbixWebhook, useSendWhatsAppMessage } from '@/hooks/useZabbixWebhooks';
import { useToast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';

const triggerTypeLabels = {
  'problem_created': 'Problema Criado',
  'problem_resolved': 'Problema Resolvido',
  'host_down': 'Host Indisponível',
  'host_up': 'Host Disponível'
};

const severityLabels = {
  '0': 'Não Classificado',
  '1': 'Informação',
  '2': 'Aviso',
  '3': 'Médio',
  '4': 'Alto',
  '5': 'Desastre'
};

export const ZabbixWebhookManagerSimple = () => {
  const { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook, toggleWebhook } = useZabbixWebhooks();
  const { data: integrations = [] } = useIntegrations();
  const { toast } = useToast();
  const sendWhatsAppMessage = useSendWhatsAppMessage();

  // Função para simular 3 incidentes do Zabbix
  const simulateZabbixIncidents = async () => {
    const incidents = [
      {
        alert_name: "High CPU usage on Zabbix server",
        severity: "Average",
        host: "Zabbix server",
        trigger_type: "problem_created",
        status: "PROBLEM",
        item_value: "85%",
        trigger_url: "https://monitoramento.parkersolucoes.com.br/zabbix/tr_events.php?triggerid=1001",
        event_date: new Date().toISOString()
      },
      {
        alert_name: "Disk space low on SRVDB001",
        severity: "High", 
        host: "DREAM PARK - SRVDB001",
        trigger_type: "problem_created",
        status: "PROBLEM",
        item_value: "92% used",
        trigger_url: "https://monitoramento.parkersolucoes.com.br/zabbix/tr_events.php?triggerid=1002",
        event_date: new Date().toISOString()
      },
      {
        alert_name: "Service unavailable",
        severity: "Disaster",
        host: "GLOBAL PARK - SRVDB003", 
        trigger_type: "problem_created",
        status: "PROBLEM",
        item_value: "Service down",
        trigger_url: "https://monitoramento.parkersolucoes.com.br/zabbix/tr_events.php?triggerid=1003",
        event_date: new Date().toISOString()
      }
    ];

    for (const incident of incidents) {
      try {
        console.log('Simulando incidente:', incident);
        const response = await fetch('https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/zabbix-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(incident)
        });
        
        const result = await response.json();
        console.log('Resposta do webhook:', result);
        
        toast({
          title: "Incidente Simulado",
          description: `${incident.alert_name} enviado para webhooks ativos`,
          duration: 3000,
        });
        
        // Aguardar 1 segundo entre envios
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Erro ao simular incidente:', error);
        toast({
          title: "Erro na Simulação",
          description: `Falha ao enviar ${incident.alert_name}`,
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // Função para testar um webhook específico
  const testSingleWebhook = async (webhook: any) => {
    const testIncident = {
      alert_name: `[TESTE] High memory usage on test server`,
      severity: "Warning",
      host: "Test Server",
      trigger_type: webhook.trigger_type || "problem_created",
      status: "PROBLEM",
      item_value: "78% used",
      trigger_url: "https://monitoramento.parkersolucoes.com.br/zabbix/tr_events.php?triggerid=9999",
      event_date: new Date().toISOString(),
      webhook_test: true
    };

    try {
      console.log('Testando webhook:', webhook.name, 'com dados:', testIncident);
      
      const response = await fetch('https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/zabbix-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testIncident)
      });
      
      const result = await response.json();
      console.log('Resposta do teste de webhook:', result);
      
      toast({
        title: "Teste de Webhook",
        description: `Webhook "${webhook.name}" testado com sucesso`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast({
        title: "Erro no Teste",
        description: `Falha ao testar webhook "${webhook.name}"`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<ZabbixWebhook | null>(null);

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    trigger_type: 'problem_created' as const,
    whatsapp_number: '',
    message: '',
    is_active: true,
    severity_filter: [] as string[],
    host_groups: '',
    time_restrictions: {
      enabled: false,
      start_time: '09:00',
      end_time: '18:00',
      weekdays_only: false
    }
  });

  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const evolutionIntegration = integrations.find(i => i.type === 'evolution_api' && i.is_active);

  const handleCreateWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.whatsapp_number.trim() || !newWebhook.message.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createWebhook.mutateAsync({
        name: newWebhook.name,
        trigger_type: newWebhook.trigger_type,
        actions: {
          create_glpi_ticket: false,
          send_whatsapp: true,
          whatsapp_number: newWebhook.whatsapp_number,
          glpi_entity_id: 0,
          custom_message: newWebhook.message
        },
        is_active: newWebhook.is_active
      });

      setNewWebhook({
        name: '',
        trigger_type: 'problem_created',
        whatsapp_number: '',
        message: '',
        is_active: true,
        severity_filter: [],
        host_groups: '',
        time_restrictions: {
          enabled: false,
          start_time: '09:00',
          end_time: '18:00',
          weekdays_only: false
        }
      });
      setIsCreating(false);

      toast({
        title: "Sucesso",
        description: "Webhook criado com sucesso!",
      });
    } catch (error) {
      console.error('Create webhook error:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar webhook",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWebhook = async () => {
    if (!editingWebhook) return;

    try {
      await updateWebhook.mutateAsync(editingWebhook);
      setEditingWebhook(null);
      
      toast({
        title: "Sucesso",
        description: "Webhook atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Update webhook error:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar webhook",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este webhook?')) {
      try {
        await deleteWebhook.mutateAsync(id);
        toast({
          title: "Sucesso",
          description: "Webhook removido com sucesso!",
        });
      } catch (error) {
        console.error('Delete webhook error:', error);
        toast({
          title: "Erro",
          description: "Falha ao remover webhook",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    const webhook = webhooks.find(w => w.id === id);
    if (webhook) {
      try {
        await toggleWebhook.mutateAsync({ ...webhook, is_active: isActive });
        toast({
          title: "Sucesso",
          description: `Webhook ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
        });
      } catch (error) {
        console.error('Toggle webhook error:', error);
        toast({
          title: "Erro",
          description: "Falha ao alterar status do webhook",
          variant: "destructive",
        });
      }
    }
  };

  const handleTestWebhook = async (webhook: ZabbixWebhook) => {
    if (!evolutionIntegration) {
      toast({
        title: "Erro",
        description: "Evolution API não configurada",
        variant: "destructive",
      });
      return;
    }

    setTestingWebhook(webhook.id);
    
    try {
      const testMessage = `🧪 Teste de Webhook\n\nNome: ${webhook.name}\nTipo: ${triggerTypeLabels[webhook.trigger_type as keyof typeof triggerTypeLabels]}\nData: ${new Date().toLocaleString('pt-BR')}\n\nEste é um teste automático do webhook.`;
      
      await sendWhatsAppMessage.mutateAsync({
        phoneNumber: (webhook.actions as any)?.whatsapp_number || '',
        message: testMessage
      });

      // Atualizar contador de testes
      await supabase
        .from('zabbix_webhooks')
        .update({
          trigger_count: (webhook.trigger_count || 0) + 1,
          last_triggered: new Date().toISOString()
        })
        .eq('id', webhook.id);

      toast({
        title: "Teste enviado!",
        description: "Mensagem de teste enviada com sucesso.",
      });
    } catch (error) {
      console.error('Test webhook error:', error);
      toast({
        title: "Erro no teste",
        description: "Falha ao enviar mensagem de teste",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCcw className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Carregando webhooks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Integração */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            Status da Integração WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-green-400" />
              <div>
                <div className="font-medium text-white">Evolution API (WhatsApp)</div>
                <div className="text-sm text-slate-400">Para envio de notificações</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {evolutionIntegration ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400">Configurado</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">Não configurado</span>
                </>
              )}
            </div>
          </div>
          
          {!evolutionIntegration && (
            <div className="mt-4 p-3 bg-amber-900/20 border border-amber-600 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Configuração necessária</span>
              </div>
              <p className="text-sm text-amber-300 mt-1">
                Configure a integração Evolution API no painel de administração para usar os webhooks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Webhooks */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Webhook className="h-5 w-5" />
                Webhooks do Zabbix
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure notificações automáticas via WhatsApp para eventos do Zabbix
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Webhook</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Configure uma notificação automática para eventos do Zabbix
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Nome do Webhook</Label>
                    <Input
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Alertas Críticos"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Tipo de Evento</Label>
                    <Select value={newWebhook.trigger_type} onValueChange={(value: any) => setNewWebhook(prev => ({ ...prev, trigger_type: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Object.entries(triggerTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-white">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Número do WhatsApp</Label>
                    <Input
                      value={newWebhook.whatsapp_number}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                      placeholder="5511999999999"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Mensagem</Label>
                    <Textarea
                      value={newWebhook.message}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="🚨 Alerta Zabbix: {problem_name} no host {host_name}"
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Variáveis: {'{problem_name}, {host_name}, {severity}, {timestamp}'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateWebhook} 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={createWebhook.isPending}
                    >
                      {createWebhook.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
              <Button 
                onClick={simulateZabbixIncidents}
                variant="outline"
                className="bg-orange-600 hover:bg-orange-700 border-orange-500 text-white"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Simular 3 Incidentes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 mx-auto mb-4 text-slate-500" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum webhook configurado</h3>
              <p className="text-slate-400">
                Crie seu primeiro webhook para receber notificações do Zabbix.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => {
                const actions = webhook.actions as any;
                return (
                  <div key={webhook.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white">{webhook.name}</h3>
                        <Badge className={webhook.is_active ? "bg-green-900/20 text-green-400 border-green-600" : "bg-red-900/20 text-red-400 border-red-600"}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-400 border-slate-600">
                          {triggerTypeLabels[webhook.trigger_type as keyof typeof triggerTypeLabels]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testSingleWebhook(webhook)}
                          disabled={testingWebhook === webhook.id || !evolutionIntegration}
                          className="bg-green-600 border-green-500 text-white hover:bg-green-500"
                        >
                          {testingWebhook === webhook.id ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWebhook(webhook)}
                          className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="bg-red-600 border-red-500 text-white hover:bg-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">WhatsApp:</span>
                        <br />
                        <span className="text-slate-300 font-mono">{actions?.whatsapp_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Execuções:</span>
                        <br />
                        <span className="text-slate-300">{webhook.trigger_count}</span>
                      </div>
                    </div>
                    {actions?.custom_message && (
                      <div className="mt-3 p-2 bg-slate-800 rounded text-sm">
                        <span className="text-slate-400">Mensagem:</span>
                        <br />
                        <span className="text-slate-300">{actions.custom_message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Webhook</DialogTitle>
          </DialogHeader>
          {editingWebhook && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Nome do Webhook</Label>
                <Input
                  value={editingWebhook.name}
                  onChange={(e) => setEditingWebhook(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Tipo de Evento</Label>
                <Select 
                  value={editingWebhook.trigger_type} 
                  onValueChange={(value: any) => setEditingWebhook(prev => prev ? ({ ...prev, trigger_type: value }) : null)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(triggerTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-white">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Número do WhatsApp</Label>
                <Input
                  value={(editingWebhook.actions as any)?.whatsapp_number || ''}
                  onChange={(e) => setEditingWebhook(prev => prev ? ({ 
                    ...prev, 
                    actions: { ...prev.actions as any, whatsapp_number: e.target.value }
                  }) : null)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Mensagem</Label>
                <Textarea
                  value={(editingWebhook.actions as any)?.custom_message || ''}
                  onChange={(e) => setEditingWebhook(prev => prev ? ({ 
                    ...prev, 
                    actions: { ...prev.actions as any, custom_message: e.target.value }
                  }) : null)}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateWebhook} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={updateWebhook.isPending}
                >
                  {updateWebhook.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => setEditingWebhook(null)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};