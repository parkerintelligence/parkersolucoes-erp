import { useState, useCallback } from 'react';
import { useWebhooks, Webhook, WebhookAction } from '@/hooks/useWebhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Plus, Search, RefreshCw, MessageCircle, Mail, ChevronRight, Copy, Pencil, Settings, Trash2, Activity, List, LayoutGrid, Check, Filter, History, ChevronLeft, Eraser } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://mpvxppgoyadwukkfoccs.supabase.co';

export default function Webhooks() {
  const { webhooks, loading, fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, createAction, updateAction, deleteAction, testWebhook } = useWebhooks();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email' | 'active'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialogs
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [editingAction, setEditingAction] = useState<WebhookAction | null>(null);
  const [targetWebhookId, setTargetWebhookId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [actionType, setActionType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [actionDest, setActionDest] = useState('');
  const [actionTemplate, setActionTemplate] = useState('{text}');

  const filtered = webhooks.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.slug.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active' && !w.is_active) return false;
    if (filter === 'whatsapp' && !w.actions?.some(a => a.action_type === 'whatsapp')) return false;
    if (filter === 'email' && !w.actions?.some(a => a.action_type === 'email')) return false;
    return true;
  });

  const activeCount = webhooks.filter(w => w.is_active).length;

  const openNewWebhook = () => {
    setEditingWebhook(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setWebhookDialog(true);
  };

  const openEditWebhook = (w: Webhook) => {
    setEditingWebhook(w);
    setFormName(w.name);
    setFormSlug(w.slug);
    setFormDesc(w.description || '');
    setWebhookDialog(true);
  };

  const saveWebhook = async () => {
    if (!formName || !formSlug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }
    const slug = formSlug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-');
    if (editingWebhook) {
      await updateWebhook(editingWebhook.id, { name: formName, slug, description: formDesc || null } as any);
    } else {
      await createWebhook({ name: formName, slug, description: formDesc || undefined });
    }
    setWebhookDialog(false);
  };

  const openNewAction = (webhookId: string) => {
    setEditingAction(null);
    setTargetWebhookId(webhookId);
    setActionType('whatsapp');
    setActionDest('');
    setActionTemplate('{text}');
    setActionDialog(true);
  };

  const openEditAction = (action: WebhookAction) => {
    setEditingAction(action);
    setTargetWebhookId(action.webhook_id);
    setActionType(action.action_type);
    setActionDest(action.destination);
    setActionTemplate(action.message_template || '{text}');
    setActionDialog(true);
  };

  const saveAction = async () => {
    if (!actionDest) {
      toast.error('Destino é obrigatório');
      return;
    }
    if (editingAction) {
      await updateAction(editingAction.id, { action_type: actionType, destination: actionDest, message_template: actionTemplate } as any);
    } else if (targetWebhookId) {
      await createAction({ webhook_id: targetWebhookId, action_type: actionType, destination: actionDest, message_template: actionTemplate });
    }
    setActionDialog(false);
  };

  const handleDelete = async () => {
    if (deleteDialog) {
      await deleteWebhook(deleteDialog);
      setDeleteDialog(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const getWebhookUrl = (slug: string) => `${SUPABASE_URL}/functions/v1/webhook-receiver/${slug}`;

  const getActionBadges = (actions?: WebhookAction[]) => {
    const types = new Set(actions?.filter(a => a.is_active).map(a => a.action_type) || []);
    return Array.from(types);
  };

  const getCategoryLabel = (actions?: WebhookAction[]) => {
    const types = getActionBadges(actions);
    if (types.includes('whatsapp') && types.includes('email')) return 'WHATSAPP + EMAIL';
    if (types.includes('whatsapp')) return 'WHATSAPP';
    if (types.includes('email')) return 'EMAIL';
    return 'SEM AÇÕES';
  };

  // Group webhooks by category
  const grouped = filtered.reduce((acc, w) => {
    const cat = getCategoryLabel(w.actions);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(w);
    return acc;
  }, {} as Record<string, Webhook[]>);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Zap className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
            <p className="text-sm text-muted-foreground">Receba dados externos e dispare ações automáticas (WhatsApp / Email)</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-sm px-3 py-1">
          <Zap className="h-3 w-3 mr-1" />
          {activeCount} ativo{activeCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-semibold text-foreground text-sm">Endpoints Configurados</p>
              <p className="text-xs text-muted-foreground">{filtered.length} de {webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''} · {activeCount} ativo{activeCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'whatsapp', 'email', 'active'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f === 'all' && <><Filter className="h-3 w-3 mr-1" />Todos</>}
                {f === 'whatsapp' && <><MessageCircle className="h-3 w-3 mr-1" />WhatsApp</>}
                {f === 'email' && <><Mail className="h-3 w-3 mr-1" />Email</>}
                {f === 'active' && <><Check className="h-3 w-3 mr-1" />Ativos</>}
              </Button>
            ))}
            <div className="flex border border-border rounded-md">
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-r-none px-2" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="rounded-l-none px-2" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" size="sm" onClick={fetchWebhooks} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Atualizar
            </Button>
            <Button size="sm" onClick={openNewWebhook} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" />Novo Webhook
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, slug, descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhum webhook encontrado</p>
          <Button onClick={openNewWebhook} className="mt-4">
            <Plus className="h-4 w-4 mr-1" />Criar primeiro webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {category}
                </div>
                <span className="text-xs text-muted-foreground">{items.length} endpoint{items.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-2">URL / Slug</div>
                  <div className="col-span-2">Ações</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Operações</div>
                </div>

                {items.map(w => (
                  <Collapsible key={w.id} open={expandedId === w.id} onOpenChange={open => setExpandedId(open ? w.id : null)}>
                    <div className="border-b border-border last:border-b-0">
                      {/* Row */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                        <div className="col-span-3">
                          <p className="font-bold text-foreground text-sm">{w.name}</p>
                          <p className="text-xs text-muted-foreground">{w.description || w.name}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">/{w.slug}</code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(`/${w.slug}`)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="col-span-2 flex gap-1">
                          {getActionBadges(w.actions).map(type => (
                            <Badge key={type} variant="outline" className={`text-xs ${type === 'email' ? 'border-green-500/50 text-green-500' : 'border-blue-500/50 text-blue-500'}`}>
                              {type === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <MessageCircle className="h-3 w-3 mr-1" />}
                              {type === 'email' ? 'Email' : 'WA'}
                            </Badge>
                          ))}
                          {(!w.actions || w.actions.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <div className="col-span-2">
                          <Switch
                            checked={w.is_active}
                            onCheckedChange={checked => updateWebhook(w.id, { is_active: checked } as any)}
                          />
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => testWebhook(w.id)} title="Testar">
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEditWebhook(w)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Ações">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteDialog(w.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Actions */}
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-1 bg-muted/20 border-t border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-semibold text-foreground">Ações de <span className="text-blue-500">{w.name}</span></span>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono max-w-[300px] truncate">{getWebhookUrl(w.slug)}</code>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(getWebhookUrl(w.slug))}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button size="sm" onClick={() => openNewAction(w.id)} className="bg-green-600 hover:bg-green-700 text-white">
                              <Plus className="h-4 w-4 mr-1" />Adicionar Ação
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {w.actions && w.actions.length > 0 ? w.actions.map(action => (
                              <div key={action.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded ${action.action_type === 'email' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {action.action_type === 'email' ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {action.action_type === 'email' ? 'Email' : 'WhatsApp'} → {action.destination}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{action.message_template === '{text}' ? '{text}' : 'template personalizado'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={action.is_active}
                                    onCheckedChange={checked => updateAction(action.id, { is_active: checked } as any)}
                                  />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEditAction(action)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteAction(action.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )) : (
                              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação configurada. Adicione uma ação para disparar WhatsApp ou Email.</p>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Webhook Dialog */}
      <Dialog open={webhookDialog} onOpenChange={setWebhookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={formName} onChange={e => { setFormName(e.target.value); if (!editingWebhook) setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')); }} placeholder="Ex: SQL Master" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={formSlug} onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="Ex: sqlmaster" />
              <p className="text-xs text-muted-foreground mt-1">URL: {getWebhookUrl(formSlug || 'meu-webhook')}</p>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição opcional" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialog(false)}>Cancelar</Button>
            <Button onClick={saveWebhook}>{editingWebhook ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAction ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={actionType} onValueChange={v => setActionType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</div></SelectItem>
                  <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{actionType === 'email' ? 'Email de destino' : 'Número do WhatsApp'}</Label>
              <Input
                value={actionDest}
                onChange={e => setActionDest(e.target.value)}
                placeholder={actionType === 'email' ? 'email@exemplo.com' : '5511999999999'}
              />
            </div>
            <div>
              <Label>Template da mensagem</Label>
              <Textarea
                value={actionTemplate}
                onChange={e => setActionTemplate(e.target.value)}
                placeholder="Use {text} para o conteúdo recebido"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">Use <code className="bg-muted px-1 rounded">{'{text}'}</code> para inserir o conteúdo do webhook</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(false)}>Cancelar</Button>
            <Button onClick={saveAction}>{editingAction ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este webhook e todas as suas ações? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
