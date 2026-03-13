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
import { Plus, Pencil, Trash2, Cog, Search, X, Send, Users, Monitor } from 'lucide-react';
import {
  useAutomationProcesses,
  useCreateAutomationProcess,
  useUpdateAutomationProcess,
  useDeleteAutomationProcess,
  type AutomationProcess,
} from '@/hooks/useAutomationProcesses';

const SYSTEM_OPTIONS = [
  'WhatsApp', 'GLPI', 'Zabbix', 'Bacula', 'Grafana', 'UniFi',
  'Mikrotik', 'Chatwoot', 'Wasabi', 'FTP', 'Hostinger', 'Guacamole', 'Wazuh',
];

const emptyForm = {
  name: '',
  description: '',
  systems: [] as string[],
  destination: '',
  recipient: '',
  frequency: '',
  is_active: true,
  notes: '',
};

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

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: AutomationProcess) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      systems: p.systems || [],
      destination: p.destination || '',
      recipient: p.recipient || '',
      frequency: p.frequency || '',
      is_active: p.is_active,
      notes: p.notes || '',
    });
    setDialogOpen(true);
  };

  const toggleSystem = (sys: string) => {
    setForm(prev => ({
      ...prev,
      systems: prev.systems.includes(sys)
        ? prev.systems.filter(s => s !== sys)
        : [...prev.systems, sys],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    if (editingId) {
      await updateProcess.mutateAsync({ id: editingId, updates: form });
    } else {
      await createProcess.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const filtered = processes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.systems || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Cog className="h-5 w-5 text-blue-400" />
              Processos de Automação
            </CardTitle>
            <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Processo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar processos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {isLoading ? (
            <p className="text-gray-400 text-center py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Cog className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium mb-1">Nenhum processo cadastrado</p>
              <p className="text-sm">Cadastre seus processos de automação para ter controle total.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Nome</TableHead>
                    <TableHead className="text-gray-300">Sistemas</TableHead>
                    <TableHead className="text-gray-300">Destino</TableHead>
                    <TableHead className="text-gray-300">Destinatário</TableHead>
                    <TableHead className="text-gray-300">Frequência</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="border-gray-700 hover:bg-gray-750">
                      <TableCell>
                        <div>
                          <span className="text-white font-medium">{p.name}</span>
                          {p.description && (
                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{p.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(p.systems || []).map(s => (
                            <Badge key={s} variant="secondary" className="bg-blue-900/40 text-blue-300 text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.destination ? (
                          <div className="flex items-center gap-1 text-gray-300 text-sm">
                            <Send className="h-3 w-3" />
                            {p.destination}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.recipient ? (
                          <div className="flex items-center gap-1 text-gray-300 text-sm">
                            <Users className="h-3 w-3" />
                            {p.recipient}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {p.frequency || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={p.is_active ? 'bg-green-900/40 text-green-300' : 'bg-gray-700 text-gray-400'}>
                          {p.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
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

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? 'Editar Processo' : 'Novo Processo de Automação'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Relatório Diário Zabbix"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o que este processo faz..."
                className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">Sistemas utilizados</Label>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_OPTIONS.map(sys => (
                  <Badge
                    key={sys}
                    className={`cursor-pointer transition-colors ${
                      form.systems.includes(sys)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => toggleSystem(sys)}
                  >
                    {form.systems.includes(sys) && '✓ '}
                    {sys}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Destino (onde envia)</Label>
                <Input
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Ex: WhatsApp, E-mail, GLPI"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Destinatário (para quem)</Label>
                <Input
                  value={form.recipient}
                  onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                  placeholder="Ex: Equipe TI, Cliente X"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Frequência</Label>
              <Input
                value={form.frequency}
                onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                placeholder="Ex: Diário, Semanal, Seg a Sex 08h"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Observações</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Anotações extras sobre este processo..."
                className="bg-gray-700 border-gray-600 text-white min-h-[60px]"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
              <Label className="text-gray-300">Processo ativo</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-600 text-gray-300">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createProcess.isPending || updateProcess.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir processo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { deleteProcess.mutate(deleteId); setDeleteId(null); } }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
