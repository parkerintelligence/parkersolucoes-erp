import { useState, useCallback, useRef } from 'react';
import { useWebhooks, Webhook, WebhookAction } from '@/hooks/useWebhooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, Plus, Search, RefreshCw, MessageCircle, Mail, ChevronRight, Copy, Pencil, Settings, Trash2, Activity, Check, Filter, History, ChevronLeft, Eraser } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://mpvxppgoyadwukkfoccs.supabase.co';

export default function Webhooks() {
  const { webhooks, loading, fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, createAction, updateAction, deleteAction, testWebhook } = useWebhooks();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email' | 'active'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [webhookDialog, setWebhookDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [editingAction, setEditingAction] = useState<WebhookAction | null>(null);
  const [targetWebhookId, setTargetWebhookId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [actionType, setActionType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [actionDest, setActionDest] = useState('');
  const [actionTemplate, setActionTemplate] = useState('{text}');
  const [lastPayloadKeys, setLastPayloadKeys] = useState<string[]>([]);
  const [lastPayloadSample, setLastPayloadSample] = useState<Record<string, any> | null>(null);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyWebhook, setHistoryWebhook] = useState<Webhook | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const LOGS_PER_PAGE = 5;

  const openHistory = useCallback(async (webhook: Webhook) => {
    setHistoryWebhook(webhook);
    setHistoryDialog(true);
    setHistoryPage(0);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase.from('webhook_logs' as any).select('*').eq('webhook_id', webhook.id).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar histórico: ' + err.message);
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (!historyWebhook) return;
    try {
      const { error } = await supabase.from('webhook_logs' as any).delete().eq('webhook_id', historyWebhook.id);
      if (error) throw error;
      setHistoryLogs([]);
      toast.success('Histórico limpo com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao limpar histórico: ' + err.message);
    }
  }, [historyWebhook]);

  const pagedLogs = historyLogs.slice(historyPage * LOGS_PER_PAGE, (historyPage + 1) * LOGS_PER_PAGE);
  const totalHistoryPages = Math.ceil(historyLogs.length / LOGS_PER_PAGE);

  const filtered = webhooks.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.slug.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active' && !w.is_active) return false;
    if (filter === 'whatsapp' && !w.actions?.some(a => a.action_type === 'whatsapp')) return false;
    if (filter === 'email' && !w.actions?.some(a => a.action_type === 'email')) return false;
    return true;
  });

  const activeCount = webhooks.filter(w => w.is_active).length;
  const whatsappCount = webhooks.filter(w => w.actions?.some(a => a.action_type === 'whatsapp')).length;
  const emailCount = webhooks.filter(w => w.actions?.some(a => a.action_type === 'email')).length;

  const openNewWebhook = () => { setEditingWebhook(null); setFormName(''); setFormSlug(''); setFormDesc(''); setWebhookDialog(true); };
  const openEditWebhook = (w: Webhook) => { setEditingWebhook(w); setFormName(w.name); setFormSlug(w.slug); setFormDesc(w.description || ''); setWebhookDialog(true); };

  const saveWebhook = async () => {
    if (!formName || !formSlug) { toast.error('Nome e slug são obrigatórios'); return; }
    const slug = formSlug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-');
    if (editingWebhook) await updateWebhook(editingWebhook.id, { name: formName, slug, description: formDesc || null } as any);
    else await createWebhook({ name: formName, slug, description: formDesc || undefined });
    setWebhookDialog(false);
  };

  const loadLastPayload = useCallback(async (webhookId: string) => {
    try {
      const { data } = await supabase.from('webhook_logs' as any).select('request_body').eq('webhook_id', webhookId).eq('is_test', false).order('created_at', { ascending: false }).limit(1);
      const body = (data as any)?.[0]?.request_body;
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        setLastPayloadKeys(Object.keys(body)); setLastPayloadSample(body);
      } else {
        const { data: anyLog } = await supabase.from('webhook_logs' as any).select('request_body').eq('webhook_id', webhookId).order('created_at', { ascending: false }).limit(1);
        const anyBody = (anyLog as any)?.[0]?.request_body;
        if (anyBody && typeof anyBody === 'object') { setLastPayloadKeys(Object.keys(anyBody)); setLastPayloadSample(anyBody); }
        else { setLastPayloadKeys([]); setLastPayloadSample(null); }
      }
    } catch { setLastPayloadKeys([]); setLastPayloadSample(null); }
  }, []);

  const openNewAction = (webhookId: string) => { setEditingAction(null); setTargetWebhookId(webhookId); setActionType('whatsapp'); setActionDest(''); setActionTemplate('{text}'); loadLastPayload(webhookId); setActionDialog(true); };
  const openEditAction = (action: WebhookAction) => { setEditingAction(action); setTargetWebhookId(action.webhook_id); setActionType(action.action_type); setActionDest(action.destination); setActionTemplate(action.message_template || '{text}'); loadLastPayload(action.webhook_id); setActionDialog(true); };

  const insertPlaceholder = (key: string) => {
    const placeholder = `{${key}}`;
    const textarea = templateRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = actionTemplate.substring(0, start) + placeholder + actionTemplate.substring(end);
      setActionTemplate(newValue);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + placeholder.length, start + placeholder.length); }, 0);
    } else {
      setActionTemplate(prev => prev + placeholder);
    }
  };

  const saveAction = async () => {
    if (!actionDest) { toast.error('Destino é obrigatório'); return; }
    if (editingAction) await updateAction(editingAction.id, { action_type: actionType, destination: actionDest, message_template: actionTemplate } as any);
    else if (targetWebhookId) await createAction({ webhook_id: targetWebhookId, action_type: actionType, destination: actionDest, message_template: actionTemplate });
    setActionDialog(false);
  };

  const handleDelete = async () => { if (deleteDialog) { await deleteWebhook(deleteDialog); setDeleteDialog(null); } };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copiado!'); };
  const getWebhookUrl = (slug: string) => `${SUPABASE_URL}/functions/v1/webhook-receiver/${slug}`;

  const getActionBadges = (actions?: WebhookAction[]) => Array.from(new Set(actions?.filter(a => a.is_active).map(a => a.action_type) || []));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Webhooks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Receba dados externos e dispare ações automáticas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchWebhooks} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={openNewWebhook} className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Novo Webhook
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Total", value: webhooks.length, icon: Zap, color: "text-primary" },
          { label: "Ativos", value: activeCount, icon: Check, color: "text-green-500" },
          { label: "WhatsApp", value: whatsappCount, icon: MessageCircle, color: "text-blue-500" },
          { label: "Email", value: emailCount, icon: Mail, color: "text-purple-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou slug..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {(['all', 'whatsapp', 'email', 'active'] as const).map(f => (
            <Button key={f} variant="ghost" size="sm" onClick={() => setFilter(f)}
              className={`h-7 px-2.5 gap-1 rounded-md text-[11px] ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {f === 'all' && <><Filter className="h-3.5 w-3.5" /><span className="hidden sm:inline">Todos</span></>}
              {f === 'whatsapp' && <><MessageCircle className="h-3.5 w-3.5" /><span className="hidden sm:inline">WhatsApp</span></>}
              {f === 'email' && <><Mail className="h-3.5 w-3.5" /><span className="hidden sm:inline">Email</span></>}
              {f === 'active' && <><Check className="h-3.5 w-3.5" /><span className="hidden sm:inline">Ativos</span></>}
            </Button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Webhooks Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Carregando webhooks...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50">
          <CardContent className="flex flex-col items-center">
            <Zap className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Nenhum webhook encontrado</h3>
            <p className="text-xs text-muted-foreground mb-4">Crie seu primeiro webhook para começar.</p>
            <Button size="sm" onClick={openNewWebhook} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Criar Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <Zap className="h-4 w-4 text-primary" />
              Endpoints Configurados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                    <TableHead className="text-muted-foreground text-xs">URL / Slug</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Tipo</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(w => (
                    <Collapsible key={w.id} open={expandedId === w.id} onOpenChange={open => setExpandedId(open ? w.id : null)} asChild>
                      <>
                        <TableRow className="border-border/50 hover:bg-muted/20">
                          <TableCell className="py-1">
                            <span className="text-xs font-medium text-foreground">{w.name}</span>
                            {w.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{w.description}</p>}
                          </TableCell>
                          <TableCell className="py-1">
                            <div className="flex items-center gap-1">
                              <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">/{w.slug}</code>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(getWebhookUrl(w.slug))}>
                                <Copy className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-1">
                            <div className="flex gap-0.5">
                              {getActionBadges(w.actions).map(type => (
                                <Badge key={type} variant="outline" className={`text-[10px] px-1.5 py-0 ${type === 'email' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'}`}>
                                  {type === 'email' ? <Mail className="h-2.5 w-2.5 mr-0.5" /> : <MessageCircle className="h-2.5 w-2.5 mr-0.5" />}
                                  {type === 'email' ? 'Email' : 'WA'}
                                </Badge>
                              ))}
                              {(!w.actions || w.actions.length === 0) && <span className="text-[11px] text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell className="py-1">
                            <Switch checked={w.is_active} onCheckedChange={checked => updateWebhook(w.id, { is_active: checked } as any)} />
                          </TableCell>
                          <TableCell className="py-1 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => openHistory(w)} title="Histórico"><History className="h-2.5 w-2.5" /></Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => testWebhook(w.id)} title="Testar"><Activity className="h-2.5 w-2.5" /></Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => openEditWebhook(w)} title="Editar"><Pencil className="h-2.5 w-2.5" /></Button>
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="Configurar Ações"><Settings className="h-2.5 w-2.5" /></Button>
                              </CollapsibleTrigger>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog(w.id)} title="Excluir"><Trash2 className="h-2.5 w-2.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div className="px-4 pb-4 pt-2 bg-muted/10 border-t border-border">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-foreground">Ações de <span className="text-primary">{w.name}</span></span>
                                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono max-w-[250px] truncate text-muted-foreground">{getWebhookUrl(w.slug)}</code>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(getWebhookUrl(w.slug))}><Copy className="h-2.5 w-2.5" /></Button>
                                  </div>
                                  <Button size="sm" onClick={() => openNewAction(w.id)} className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Plus className="h-3 w-3 mr-1" />Adicionar Ação
                                  </Button>
                                </div>
                                <div className="space-y-1.5">
                                  {w.actions && w.actions.length > 0 ? w.actions.map(action => (
                                    <div key={action.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded ${action.action_type === 'email' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                          {action.action_type === 'email' ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-foreground">
                                            {action.action_type === 'email' ? 'Email' : 'WhatsApp'} → {action.destination}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground">{action.message_template === '{text}' ? '{text}' : 'template personalizado'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Switch checked={action.is_active} onCheckedChange={checked => updateAction(action.id, { is_active: checked } as any)} />
                                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => openEditAction(action)}><Pencil className="h-2.5 w-2.5" /></Button>
                                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => deleteAction(action.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                                      </div>
                                    </div>
                                  )) : (
                                    <p className="text-xs text-muted-foreground text-center py-3">Nenhuma ação configurada.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Dialog */}
      <Dialog open={webhookDialog} onOpenChange={setWebhookDialog}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Nome *</Label>
              <Input value={formName} onChange={e => { setFormName(e.target.value); if (!editingWebhook) setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')); }} placeholder="Ex: SQL Master" className="bg-background border-border h-8 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Slug (URL) *</Label>
              <Input value={formSlug} onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="Ex: sqlmaster" className="bg-background border-border h-8 text-xs" />
              <p className="text-[10px] text-muted-foreground">URL: {getWebhookUrl(formSlug || 'meu-webhook')}</p>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Descrição</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição opcional" rows={2} className="bg-background border-border text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setWebhookDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveWebhook} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingWebhook ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingAction ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Tipo</Label>
              <Select value={actionType} onValueChange={v => setActionType(v as any)}>
                <SelectTrigger className="bg-background border-border h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp"><div className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</div></SelectItem>
                  <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />Email</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">{actionType === 'email' ? 'Email de destino' : 'Número do WhatsApp'}</Label>
              <Input value={actionDest} onChange={e => setActionDest(e.target.value)} placeholder={actionType === 'email' ? 'email@exemplo.com' : '5511999999999'} className="bg-background border-border h-8 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Template da mensagem</Label>
              <Textarea ref={templateRef} value={actionTemplate} onChange={e => setActionTemplate(e.target.value)} placeholder="Use {text} para o conteúdo recebido" rows={4} className="bg-background border-border text-xs" />
              <p className="text-[10px] text-muted-foreground">Use <code className="bg-muted px-1 rounded">{'{text}'}</code> para conteúdo completo ou placeholders específicos.</p>
            </div>

            {lastPayloadKeys.length > 0 && (
              <div className="border border-border rounded-lg p-3 bg-muted/20">
                <p className="text-xs font-semibold text-foreground mb-2">📦 Campos do último payload (clique para inserir):</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {lastPayloadKeys.map(key => (
                    <Button key={key} type="button" variant="outline" size="sm" className="h-6 text-[10px] font-mono px-1.5 hover:bg-primary hover:text-primary-foreground" onClick={() => insertPlaceholder(key)}>
                      {`{${key}}`}
                    </Button>
                  ))}
                </div>
                {lastPayloadSample && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-[11px]">Ver payload completo</summary>
                    <pre className="mt-1 bg-muted rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all text-[10px] text-foreground">{JSON.stringify(lastPayloadSample, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}
            {lastPayloadKeys.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">💡 Envie uma requisição para visualizar campos disponíveis.</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setActionDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveAction} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingAction ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Tem certeza que deseja excluir este webhook e todas as suas ações? Esta ação não pode ser desfeita.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm">
              <History className="h-4 w-4 text-primary" />
              Histórico - {historyWebhook?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">Últimas requisições recebidas por este webhook</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">{historyLogs.length} registro(s)</span>
            <Button variant="outline" size="sm" onClick={clearHistory} disabled={historyLogs.length === 0} className="h-7 text-xs text-destructive hover:bg-destructive/10">
              <Eraser className="h-3 w-3 mr-1" />Limpar
            </Button>
          </div>

          <ScrollArea className="max-h-[50vh]">
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Carregando...</p>
            ) : historyLogs.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pagedLogs.map((log: any) => {
                  const body = log.request_body || {};
                  const resp = log.response_data || {};
                  const results = resp.results || [];
                  const isSuccess = log.status === 'success';
                  return (
                    <div key={log.id} className="border border-border/50 rounded-lg p-3 hover:bg-muted/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isSuccess ? 'border-green-500/30 text-green-400' : 'border-destructive/30 text-destructive'}`}>
                            {isSuccess ? '✅ Sucesso' : '❌ Erro'}
                          </Badge>
                          {log.is_test && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Teste</Badge>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Payload:</p>
                        <pre className="text-[10px] bg-muted/30 rounded p-2 overflow-x-auto max-h-20 whitespace-pre-wrap break-all text-foreground">{JSON.stringify(body, null, 2)}</pre>
                      </div>
                      {results.length > 0 && (
                        <div className="mt-1.5">
                          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Resultados:</p>
                          <div className="space-y-0.5">
                            {results.map((r: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                                <span>{r.success ? '✅' : '❌'}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">{r.action}</Badge>
                                <span className="text-muted-foreground">→ {r.destination}</span>
                                {r.instance && <span className="text-muted-foreground/70">({r.instance})</span>}
                                {!r.success && r.error && <span className="text-destructive">{r.error}</span>}
                                {!r.success && r.result?.error && <span className="text-destructive">{r.result.error}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.max(0, p - 1))} disabled={historyPage === 0} className="h-7 text-xs">
                <ChevronLeft className="h-3 w-3 mr-1" />Anterior
              </Button>
              <span className="text-[10px] text-muted-foreground">Página {historyPage + 1} de {totalHistoryPages}</span>
              <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.min(totalHistoryPages - 1, p + 1))} disabled={historyPage >= totalHistoryPages - 1} className="h-7 text-xs">
                Próximo<ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
