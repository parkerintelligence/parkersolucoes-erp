
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Edit, 
  Settings, 
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Play
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface ZabbixWebhook {
  id: string;
  name: string;
  trigger_type: 'problem_created' | 'problem_resolved' | 'host_down' | 'host_up';
  actions: {
    create_glpi_ticket?: boolean;
    send_whatsapp?: boolean;
    whatsapp_number?: string;
    glpi_entity_id?: number;
    custom_message?: string;
  };
  is_active: boolean;
  created_at: Date;
  last_triggered?: Date;
  trigger_count: number;
}

export const ZabbixWebhookManager = () => {
  const [webhooks, setWebhooks] = useState<ZabbixWebhook[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<ZabbixWebhook | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    trigger_type: 'problem_created' as const,
    actions: {
      create_glpi_ticket: false,
      send_whatsapp: false,
      whatsapp_number: '',
      glpi_entity_id: 0,
      custom_message: ''
    },
    is_active: true
  });

  const triggerTypeLabels = {
    'problem_created': 'Problema Criado',
    'problem_resolved': 'Problema Resolvido', 
    'host_down': 'Host Indisponível',
    'host_up': 'Host Disponível'
  };

  const handleCreateWebhook = () => {
    if (!newWebhook.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o webhook.",
        variant: "destructive"
      });
      return;
    }

    const webhook: ZabbixWebhook = {
      id: Date.now().toString(),
      ...newWebhook,
      created_at: new Date(),
      trigger_count: 0
    };

    setWebhooks(prev => [...prev, webhook]);
    setNewWebhook({
      name: '',
      trigger_type: 'problem_created',
      actions: {
        create_glpi_ticket: false,
        send_whatsapp: false,
        whatsapp_number: '',
        glpi_entity_id: 0,
        custom_message: ''
      },
      is_active: true
    });
    setIsCreating(false);

    toast({
      title: "✅ Webhook criado!",
      description: "O webhook foi configurado com sucesso."
    });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Webhook removido",
      description: "O webhook foi removido com sucesso."
    });
  };

  const handleToggleWebhook = (id: string, isActive: boolean) => {
    setWebhooks(prev => prev.map(w => 
      w.id === id ? { ...w, is_active: isActive } : w
    ));
  };

  const handleTestWebhook = async (id: string) => {
    setTestingWebhook(id);
    
    try {
      // Simular teste do webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "✅ Teste realizado!",
        description: "O webhook foi testado com sucesso."
      });
    } catch (error) {
      toast({
        title: "❌ Erro no teste",
        description: "Falha ao testar o webhook.",
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Webhook className="h-5 w-5" />
            Webhooks e Automações
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure ações automáticas baseadas em eventos do Zabbix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-400">
              {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configurado{webhooks.length !== 1 ? 's' : ''}
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Novo Webhook</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Configure as ações que serão executadas automaticamente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="webhook-name" className="text-gray-200">Nome do Webhook</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Notificar problemas críticos"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-gray-200">Tipo de Trigger</Label>
                    <Select value={newWebhook.trigger_type} onValueChange={(value: any) => setNewWebhook(prev => ({ ...prev, trigger_type: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {Object.entries(triggerTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-white">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-gray-200 text-lg">Ações</Label>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-white">Criar Chamado GLPI</div>
                          <div className="text-sm text-gray-400">Gera automaticamente um chamado no GLPI</div>
                        </div>
                      </div>
                      <Switch
                        checked={newWebhook.actions.create_glpi_ticket}
                        onCheckedChange={(checked) => 
                          setNewWebhook(prev => ({
                            ...prev,
                            actions: { ...prev.actions, create_glpi_ticket: checked }
                          }))
                        }
                      />
                    </div>

                    {newWebhook.actions.create_glpi_ticket && (
                      <div className="ml-8 space-y-2">
                        <Label className="text-gray-200">ID da Entidade GLPI</Label>
                        <Input
                          type="number"
                          value={newWebhook.actions.glpi_entity_id}
                          onChange={(e) => setNewWebhook(prev => ({
                            ...prev,
                            actions: { ...prev.actions, glpi_entity_id: parseInt(e.target.value) || 0 }
                          }))}
                          placeholder="0"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="font-medium text-white">Enviar WhatsApp</div>
                          <div className="text-sm text-gray-400">Envia notificação via WhatsApp</div>
                        </div>
                      </div>
                      <Switch
                        checked={newWebhook.actions.send_whatsapp}
                        onCheckedChange={(checked) => 
                          setNewWebhook(prev => ({
                            ...prev,
                            actions: { ...prev.actions, send_whatsapp: checked }
                          }))
                        }
                      />
                    </div>

                    {newWebhook.actions.send_whatsapp && (
                      <div className="ml-8 space-y-2">
                        <Label className="text-gray-200">Número do WhatsApp</Label>
                        <Input
                          value={newWebhook.actions.whatsapp_number}
                          onChange={(e) => setNewWebhook(prev => ({
                            ...prev,
                            actions: { ...prev.actions, whatsapp_number: e.target.value }
                          }))}
                          placeholder="5511999999999"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Label className="text-gray-200">Mensagem Personalizada</Label>
                        <Textarea
                          value={newWebhook.actions.custom_message}
                          onChange={(e) => setNewWebhook(prev => ({
                            ...prev,
                            actions: { ...prev.actions, custom_message: e.target.value }
                          }))}
                          placeholder="🚨 Alerta Zabbix: {problem_name} no host {host_name}"
                          className="bg-gray-700 border-gray-600 text-white"
                          rows={3}
                        />
                        <p className="text-xs text-gray-400">
                          Variáveis disponíveis: {'{problem_name}, {host_name}, {severity}, {timestamp}'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateWebhook} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Webhook
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum webhook configurado</p>
              <p className="text-sm">Crie webhooks para automatizar ações baseadas em eventos do Zabbix</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Trigger</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Execuções</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id} className="border-gray-700 hover:bg-gray-800/30">
                    <TableCell className="font-medium text-gray-200">{webhook.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-600">
                        {triggerTypeLabels[webhook.trigger_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {webhook.actions.create_glpi_ticket && (
                          <Badge variant="outline" className="bg-purple-900/20 text-purple-400 border-purple-600">
                            GLPI
                          </Badge>
                        )}
                        {webhook.actions.send_whatsapp && (
                          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-600">
                            WhatsApp
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                        />
                        {webhook.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{webhook.trigger_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={testingWebhook === webhook.id}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingWebhook(webhook)}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
