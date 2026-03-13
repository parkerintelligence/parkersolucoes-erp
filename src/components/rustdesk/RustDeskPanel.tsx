import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Monitor, Plus, Search, Edit, Trash2, ExternalLink, Eye, EyeOff, Copy,
  Server, Settings, X, Save, Tag
} from 'lucide-react';
import {
  useRustDeskConnections,
  useCreateRustDeskConnection,
  useUpdateRustDeskConnection,
  useDeleteRustDeskConnection,
  RustDeskConnection,
} from '@/hooks/useRustDesk';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useCompanies } from '@/hooks/useCompanies';
import { toast } from '@/hooks/use-toast';
import { RustDeskServerConfig } from './RustDeskServerConfig';

const EMPTY_FORM = {
  name: '',
  rustdesk_id: '',
  password: '',
  alias: '',
  company_id: '',
  hostname: '',
  os_type: '',
  notes: '',
  tags: [] as string[],
};

export const RustDeskPanel = () => {
  const { data: connections = [], isLoading } = useRustDeskConnections();
  const { data: integrations = [] } = useIntegrations();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateRustDeskConnection();
  const updateMutation = useUpdateRustDeskConnection();
  const deleteMutation = useDeleteRustDeskConnection();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showServerConfig, setShowServerConfig] = useState(false);

  // Get RustDesk server config from integrations
  const rustdeskIntegration = integrations.find(i => i.type === 'rustdesk' && i.is_active);

  const filtered = useMemo(() => {
    if (!search) return connections;
    const s = search.toLowerCase();
    return connections.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.rustdesk_id.toLowerCase().includes(s) ||
      c.alias?.toLowerCase().includes(s) ||
      c.hostname?.toLowerCase().includes(s) ||
      c.tags?.some(t => t.toLowerCase().includes(s))
    );
  }, [connections, search]);

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return '-';
    return companies.find(c => c.id === companyId)?.name || '-';
  };

  const handleEdit = (conn: RustDeskConnection) => {
    setForm({
      name: conn.name,
      rustdesk_id: conn.rustdesk_id,
      password: conn.password || '',
      alias: conn.alias || '',
      company_id: conn.company_id || '',
      hostname: conn.hostname || '',
      os_type: conn.os_type || '',
      notes: conn.notes || '',
      tags: conn.tags || [],
    });
    setEditingId(conn.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.rustdesk_id) {
      toast({ title: "Campos obrigatórios", description: "Nome e ID do RustDesk são obrigatórios.", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      company_id: form.company_id || null,
    } as any;

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, updates: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleConnect = (conn: RustDeskConnection) => {
    // Update last_connected_at
    updateMutation.mutate({ id: conn.id, updates: { last_connected_at: new Date().toISOString() } });

    // Build rustdesk:// URI to open the desktop client directly
    // Format: rustdesk://connection/new/ID?password=PASS&relay=HBBR&key=KEY
    let rustdeskUri = `rustdesk://connection/new/${conn.rustdesk_id}`;
    const params = new URLSearchParams();
    
    if (conn.password) {
      params.set('password', conn.password);
    }
    
    // Add server config params if available
    if (rustdeskIntegration) {
      if (rustdeskIntegration.base_url) {
        params.set('relay', rustdeskIntegration.base_url);
      }
      if (rustdeskIntegration.api_token) {
        params.set('key', rustdeskIntegration.api_token);
      }
    }
    
    const paramString = params.toString();
    if (paramString) {
      rustdeskUri += `?${paramString}`;
    }

    // Copy ID to clipboard for easy paste in RustDesk
    navigator.clipboard.writeText(conn.rustdesk_id).catch(() => {});

    // Open via URI scheme (launches RustDesk desktop app)
    window.location.href = rustdeskUri;
    
    toast({
      title: "🖥️ Abrindo RustDesk",
      description: `Conectando a "${conn.name}" (ID: ${conn.rustdesk_id}). ID copiado para a área de transferência.`,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.` });
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="space-y-4">
      {/* Server Config */}
      {showServerConfig && (
        <RustDeskServerConfig onClose={() => setShowServerConfig(false)} />
      )}

      {/* Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-orange-400" />
                RustDesk - Conexões Remotas
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gerencie suas conexões RustDesk e acesse máquinas remotamente
                {rustdeskIntegration && (
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <Server className="h-3 w-3 mr-1" />
                    Servidor próprio configurado
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Settings className="h-4 w-4 mr-1" />
                Servidor
              </Button>
              <Button
                size="sm"
                onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(!showForm); }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Conexão
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">
              {editingId ? 'Editar Conexão' : 'Nova Conexão RustDesk'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Nome *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: PC Recepção - Cliente X"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">ID RustDesk *</label>
                <Input
                  value={form.rustdesk_id}
                  onChange={e => setForm(p => ({ ...p, rustdesk_id: e.target.value }))}
                  placeholder="Ex: 123 456 789"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Senha</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Senha de acesso"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Apelido</label>
                <Input
                  value={form.alias}
                  onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}
                  placeholder="Apelido para a máquina"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Hostname</label>
                <Input
                  value={form.hostname}
                  onChange={e => setForm(p => ({ ...p, hostname: e.target.value }))}
                  placeholder="Nome do computador"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Sistema Operacional</label>
                <Select value={form.os_type} onValueChange={v => setForm(p => ({ ...p, os_type: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Cliente / Empresa</label>
                <Select value={form.company_id || "none"} onValueChange={v => setForm(p => ({ ...p, company_id: v === "none" ? "" : v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Digite e pressione Enter"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.tags.map(tag => (
                      <Badge key={tag} className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        {tag}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Observações</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Notas sobre esta conexão..."
                className="bg-slate-900 border-slate-600 text-white min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, ID, hostname, tag..."
              className="bg-slate-900 border-slate-600 text-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Carregando conexões...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {connections.length === 0 ? 'Nenhuma conexão cadastrada. Clique em "Nova Conexão" para começar.' : 'Nenhuma conexão encontrada.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Nome</TableHead>
                    <TableHead className="text-slate-400">ID RustDesk</TableHead>
                    <TableHead className="text-slate-400">Senha</TableHead>
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">SO</TableHead>
                    <TableHead className="text-slate-400">Tags</TableHead>
                    <TableHead className="text-slate-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(conn => (
                    <TableRow key={conn.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        <div>
                          {conn.name}
                          {conn.alias && <span className="text-slate-400 text-xs ml-1">({conn.alias})</span>}
                        </div>
                        {conn.hostname && <div className="text-xs text-slate-500">{conn.hostname}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded text-sm">
                            {conn.rustdesk_id}
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(conn.rustdesk_id, 'ID')}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {conn.password ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-300 text-sm font-mono">
                              {showPasswords[conn.id] ? conn.password : '••••••'}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                              onClick={() => togglePassword(conn.id)}>
                              {showPasswords[conn.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                              onClick={() => copyToClipboard(conn.password!, 'Senha')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{getCompanyName(conn.company_id)}</TableCell>
                      <TableCell>
                        {conn.os_type && (
                          <Badge className="bg-slate-600/30 text-slate-300 border-slate-600/50 text-xs">
                            {conn.os_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {conn.tags?.map(tag => (
                            <Badge key={tag} className="bg-orange-500/10 text-orange-300 border-orange-500/20 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleConnect(conn)}
                            className="h-7 bg-orange-600 hover:bg-orange-700 text-white text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Conectar
                          </Button>
                          <Button variant="outline" size="sm"
                            className="h-7 border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => handleEdit(conn)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm"
                            className="h-7 border-slate-600 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDelete(conn.id)}
                            disabled={deleteMutation.isPending}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
