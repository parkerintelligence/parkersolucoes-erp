import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Cog, Search, X, Send, Users } from 'lucide-react';
import {
  useAutomationProcesses, useCreateAutomationProcess, useUpdateAutomationProcess, useDeleteAutomationProcess,
  type AutomationProcess,
} from '@/hooks/useAutomationProcesses';

const SYSTEM_SUGGESTIONS = [
  'WhatsApp', 'GLPI', 'Zabbix', 'Bacula', 'Grafana', 'UniFi',
  'Mikrotik', 'Chatwoot', 'Wasabi', 'FTP', 'Hostinger', 'Guacamole', 'Wazuh',
];

const emptyForm = { name: '', description: '', systems: [] as string[], destination: '', recipient: '', frequency: '', is_active: true, notes: '' };

export const AutomationProcessesPanel = () => {
  const { data: processes = [], isLoading } = useAutomationProcesses();
  const createProcess = useCreateAutomationProcess();
  const updateProcess = useUpdateAutomationProcess();
  const deleteProcess = useDeleteAutomationProcess();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [systemInput, setSystemInput] = useState('');

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: AutomationProcess) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', systems: p.systems || [], destination: p.destination || '', recipient: p.recipient || '', frequency: p.frequency || '', is_active: p.is_active, notes: p.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) { await updateProcess.mutateAsync({ id: editingId, updates: form }); }
    else { await createProcess.mutateAsync(form); }
    setDialogOpen(false);
  };

  const filtered = processes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.systems || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <Cog className="h-4 w-4 text-primary" />
              Processos de Automação
            </CardTitle>
            <Button onClick={openNew} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Novo Processo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-2.5 bg-muted/30 border border-border rounded-lg mb-4">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar processos..." value={search} onChange={e => setSearch(e.target.value)} className="h-7 text-xs bg-card border-border flex-1" />
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center text-xs py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <Cog className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum processo cadastrado</p>
              <p className="text-xs text-muted-foreground">Cadastre seus processos de automação.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Sistemas</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Destino</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Destinatário</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Frequência</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="border-border/50 hover:bg-muted/20">
                      <TableCell className="py-1">
                        <span className="text-xs font-medium text-foreground">{p.name}</span>
                        {p.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>}
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                          {(p.systems || []).map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        {p.destination ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Send className="h-2.5 w-2.5" />{p.destination}</div>
                        ) : <span className="text-xs text-muted-foreground/50">-</span>}
                      </TableCell>
                      <TableCell className="py-1">
                        {p.recipient ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-2.5 w-2.5" />{p.recipient}</div>
                        ) : <span className="text-xs text-muted-foreground/50">-</span>}
                      </TableCell>
                      <TableCell className="py-1 text-xs text-muted-foreground">{p.frequency || '-'}</TableCell>
                      <TableCell className="py-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${p.is_active ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground'}`}>
                          {p.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="h-6 w-6 p-0" title="Editar">
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(p.id)} className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" title="Excluir">
                            <Trash2 className="h-2.5 w-2.5" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? 'Editar Processo' : 'Novo Processo de Automação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Relatório Diário Zabbix" className="bg-background border-border h-8 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o que este processo faz..." className="bg-background border-border text-xs min-h-[60px]" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Sistemas utilizados</Label>
              <div className="flex flex-wrap gap-1 mb-1">
                {form.systems.map(sys => (
                  <Badge key={sys} className="bg-primary text-primary-foreground text-[10px] cursor-pointer hover:bg-primary/80" onClick={() => setForm(prev => ({ ...prev, systems: prev.systems.filter(s => s !== sys) }))}>
                    {sys} <X className="h-2.5 w-2.5 ml-0.5" />
                  </Badge>
                ))}
              </div>
              <Input value={systemInput} onChange={e => setSystemInput(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && systemInput.trim()) {
                  e.preventDefault();
                  if (!form.systems.includes(systemInput.trim())) setForm(prev => ({ ...prev, systems: [...prev.systems, systemInput.trim()] }));
                  setSystemInput('');
                }
              }} placeholder="Digite e pressione Enter" className="bg-background border-border h-8 text-xs" />
              <div className="flex flex-wrap gap-1 mt-1">
                {SYSTEM_SUGGESTIONS.filter(s => !form.systems.includes(s)).slice(0, 8).map(sys => (
                  <Badge key={sys} variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setForm(prev => ({ ...prev, systems: [...prev.systems, sys] }))}>
                    + {sys}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-foreground text-xs">Destino</Label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Ex: WhatsApp, E-mail" className="bg-background border-border h-8 text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-foreground text-xs">Destinatário</Label>
                <Input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} placeholder="Ex: Equipe TI" className="bg-background border-border h-8 text-xs" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Frequência</Label>
              <Input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="Ex: Diário, Semanal" className="bg-background border-border h-8 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-foreground text-xs">Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anotações extras..." className="bg-background border-border text-xs min-h-[50px]" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-foreground text-xs">Processo ativo</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim() || createProcess.isPending || updateProcess.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir processo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteProcess.mutate(deleteId); setDeleteId(null); } }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
