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
  X, Save, Building2, Package
} from 'lucide-react';
import {
  useRustDeskConnections,
  useCreateRustDeskConnection,
  useUpdateRustDeskConnection,
  useDeleteRustDeskConnection,
  RustDeskConnection,
} from '@/hooks/useRustDesk';
import { useCompanies } from '@/hooks/useCompanies';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { toast } from '@/hooks/use-toast';

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
  glpi_asset_id: null as number | null,
  glpi_asset_name: '',
};

export const RustDeskPanel = () => {
  const { data: connections = [], isLoading } = useRustDeskConnections();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateRustDeskConnection();
  const updateMutation = useUpdateRustDeskConnection();
  const deleteMutation = useDeleteRustDeskConnection();
  const { confirm } = useConfirmDialog();

  // GLPI inventory via proxy
  const glpiExpanded = useGLPIExpanded();
  const glpiComputers = glpiExpanded.computers?.data || [];

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  

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

  // Group connections by company
  const groupedByCompany = useMemo(() => {
    const groups: Record<string, { name: string; connections: typeof filtered }> = {};
    
    filtered.forEach(conn => {
      const companyId = conn.company_id || '__none__';
      if (!groups[companyId]) {
        const company = companies.find(c => c.id === companyId);
        groups[companyId] = {
          name: company?.name || 'Sem cliente',
          connections: [],
        };
      }
      groups[companyId].connections.push(conn);
    });

    return Object.entries(groups).sort(([aId], [bId]) => {
      if (aId === '__none__') return 1;
      if (bId === '__none__') return -1;
      return 0;
    });
  }, [filtered, companies]);


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
      glpi_asset_id: conn.glpi_asset_id || null,
      glpi_asset_name: conn.glpi_asset_name || '',
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
      glpi_asset_id: form.glpi_asset_id || null,
      glpi_asset_name: form.glpi_asset_name || null,
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
    const confirmed = await confirm({
      title: "Remover conexão",
      description: "Tem certeza que deseja remover esta conexão RustDesk?",
      confirmText: "Remover",
      cancelText: "Cancelar",
      variant: "destructive",
    });
    if (!confirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleConnect = async (conn: RustDeskConnection) => {
    const confirmed = await confirm({
      title: "Conectar ao dispositivo",
      description: `Abrir conexão com "${conn.name}" (ID: ${conn.rustdesk_id})?`,
      confirmText: "Conectar",
      cancelText: "Cancelar",
      variant: "default",
    });

    if (!confirmed) return;

    updateMutation.mutate({ id: conn.id, updates: { last_connected_at: new Date().toISOString() } });

    const clipText = conn.password 
      ? `ID: ${conn.rustdesk_id} | Senha: ${conn.password}`
      : conn.rustdesk_id;
    navigator.clipboard.writeText(clipText).catch(() => {});

    window.location.href = `rustdesk://connection/new/${conn.rustdesk_id}`;
    
    toast({
      title: "🖥️ Abrindo RustDesk",
      description: `ID${conn.password ? ' e senha' : ''} copiado(s). Conectando a "${conn.name}".`,
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

  const selectGlpiAsset = (assetId: string) => {
    if (assetId === 'none') {
      setForm(prev => ({ ...prev, glpi_asset_id: null, glpi_asset_name: '' }));
      return;
    }
    const computer = glpiComputers.find((c: any) => String(c.id) === assetId);
    if (computer) {
      setForm(prev => ({
        ...prev,
        glpi_asset_id: computer.id,
        glpi_asset_name: computer.name,
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-foreground">RustDesk - Conexões</h2>
          <Badge variant="secondary" className="text-xs">{connections.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearch(''); }}
            className="h-8 w-8 p-0"
          >
            <Search className="h-4 w-4" />
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

      {/* Discrete search bar */}
      {showSearch && (
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, ID, hostname, tag..."
            className="h-8 text-sm"
            autoFocus
          />
          {search && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSearch('')}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">
              {editingId ? 'Editar Conexão' : 'Nova Conexão RustDesk'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: PC Recepção - Cliente X"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ID RustDesk *</label>
                <Input
                  value={form.rustdesk_id}
                  onChange={e => setForm(p => ({ ...p, rustdesk_id: e.target.value }))}
                  placeholder="Ex: 123 456 789"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Senha de acesso"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Apelido</label>
                <Input
                  value={form.alias}
                  onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}
                  placeholder="Apelido"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hostname</label>
                <Input
                  value={form.hostname}
                  onChange={e => setForm(p => ({ ...p, hostname: e.target.value }))}
                  placeholder="Nome do computador"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sistema Operacional</label>
                <Select value={form.os_type} onValueChange={v => setForm(p => ({ ...p, os_type: v }))}>
                  <SelectTrigger className="h-8 text-sm">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cliente / Empresa</label>
                <Select value={form.company_id || "none"} onValueChange={v => setForm(p => ({ ...p, company_id: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-sm">
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
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Inventário GLPI (opcional)
                </label>
                <Select 
                  value={form.glpi_asset_id ? String(form.glpi_asset_id) : "none"} 
                  onValueChange={v => selectGlpiAsset(v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Vincular a um ativo GLPI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {glpiComputers.map((comp: any) => (
                      <SelectItem key={comp.id} value={String(comp.id)}>
                        {comp.name}{comp.serial ? ` (${comp.serial})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {glpiComputers.length === 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">Nenhum ativo encontrado. Verifique a conexão com o GLPI.</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Digite e Enter"
                    className="h-8 text-sm"
                  />
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Notas sobre esta conexão..."
                className="min-h-[50px] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
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

      {/* Connections List */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando conexões...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {connections.length === 0 ? 'Nenhuma conexão cadastrada. Clique em "Nova Conexão" para começar.' : 'Nenhuma conexão encontrada.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                    <TableHead className="text-muted-foreground text-xs">ID RustDesk</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Senha</TableHead>
                    <TableHead className="text-muted-foreground text-xs">SO</TableHead>
                    <TableHead className="text-muted-foreground text-xs">GLPI</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Tags</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedByCompany.map(([companyId, group]) => (
                    <>
                      {/* Company header row */}
                      <TableRow key={`group-${companyId}`} className="border-border bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7} className="py-1.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-xs font-semibold text-orange-400">{group.name}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {group.connections.length}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Connection rows */}
                      {group.connections.map(conn => (
                        <TableRow key={conn.id} className="border-border/50 hover:bg-muted/20">
                          <TableCell className="text-foreground font-medium text-sm pl-8">
                            <div>
                              {conn.name}
                              {conn.alias && <span className="text-muted-foreground text-xs ml-1">({conn.alias})</span>}
                            </div>
                            {conn.hostname && <div className="text-xs text-muted-foreground">{conn.hostname}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">
                                {conn.rustdesk_id}
                              </code>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(conn.rustdesk_id, 'ID')}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {conn.password ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-mono text-muted-foreground">
                                  {showPasswords[conn.id] ? conn.password : '••••••'}
                                </span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => togglePassword(conn.id)}>
                                  {showPasswords[conn.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(conn.password!, 'Senha')}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {conn.os_type && (
                              <Badge variant="secondary" className="text-[10px]">
                                {conn.os_type}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {(conn as any).glpi_asset_name ? (
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-blue-400" />
                                <span className="text-xs text-foreground">{(conn as any).glpi_asset_name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {conn.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] text-orange-400 border-orange-500/20">
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
                                className="h-7"
                                onClick={() => handleEdit(conn)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm"
                                className="h-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(conn.id)}
                                disabled={deleteMutation.isPending}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
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
