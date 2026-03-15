import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useHostingerIntegrations } from '@/hooks/useHostingerAPI';
import {
  Globe, Search, Plus, Pencil, Trash2, RefreshCw, AlertCircle, ChevronRight, ArrowLeft, Shield, Mail, Server, FileText
} from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface DNSRecord {
  type: string;
  name: string;
  ttl: number;
  content?: string;
  priority?: number;
  // Fields may vary per Hostinger API response
  [key: string]: any;
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'];

const RECORD_ICON: Record<string, typeof Globe> = {
  A: Server,
  AAAA: Server,
  CNAME: ChevronRight,
  MX: Mail,
  TXT: FileText,
  NS: Globe,
  SRV: Server,
  CAA: Shield,
};

const useHostingerDomains = (integrationId?: string) => {
  return useQuery({
    queryKey: ['hostinger-domains', integrationId],
    queryFn: async () => {
      if (!integrationId) return [];
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: { integration_id: integrationId, endpoint: '/api/domains/v1/domains', method: 'GET' }
      });
      if (error) throw error;
      return data?.data || [];
    },
    enabled: !!integrationId,
  });
};

const useHostingerDNSRecords = (integrationId?: string, domain?: string) => {
  return useQuery({
    queryKey: ['hostinger-dns', integrationId, domain],
    queryFn: async () => {
      if (!integrationId || !domain) return [];
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: { integration_id: integrationId, endpoint: `/api/dns/v1/zones/${domain}`, method: 'GET' }
      });
      if (error) throw error;
      return data?.data || [];
    },
    enabled: !!integrationId && !!domain,
  });
};

export const HostingerDNS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: integrations } = useHostingerIntegrations();
  const integrationId = integrations?.[0]?.id;

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; record?: DNSRecord; isNew?: boolean }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; record?: DNSRecord }>({ open: false });

  // Form state
  const [formType, setFormType] = useState('A');
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTTL, setFormTTL] = useState('14400');
  const [formPriority, setFormPriority] = useState('10');

  const { data: domains, isLoading: domainsLoading, refetch: refetchDomains } = useHostingerDomains(integrationId);
  const { data: records, isLoading: recordsLoading, refetch: refetchRecords } = useHostingerDNSRecords(integrationId, selectedDomain);

  const updateDNS = useMutation({
    mutationFn: async ({ domain, records: updatedRecords }: { domain: string; records: any[] }) => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/api/dns/v1/zones/${domain}`,
          method: 'PUT',
          data: { overwrite: true, zone: updatedRecords }
        }
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Erro ao atualizar DNS');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'DNS Atualizado', description: 'Registros DNS atualizados com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['hostinger-dns'] });
      setEditDialog({ open: false });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.message || 'Erro ao atualizar registros DNS', variant: 'destructive' });
    },
  });

  const deleteDNS = useMutation({
    mutationFn: async ({ domain, recordsToDelete }: { domain: string; recordsToDelete: any[] }) => {
      const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
        body: {
          integration_id: integrationId,
          endpoint: `/api/dns/v1/zones/${domain}`,
          method: 'DELETE',
          data: { zone: recordsToDelete }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Registro Removido', description: 'Registro DNS removido com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['hostinger-dns'] });
      setDeleteDialog({ open: false });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.message || 'Erro ao remover registro DNS', variant: 'destructive' });
    },
  });

  const openNewRecord = () => {
    setFormType('A');
    setFormName('');
    setFormContent('');
    setFormTTL('14400');
    setFormPriority('10');
    setEditDialog({ open: true, isNew: true });
  };

  const openEditRecord = (record: DNSRecord) => {
    setFormType(record.type);
    setFormName(record.name || '');
    setFormContent(record.content || record.address || record.target || '');
    setFormTTL(String(record.ttl || 14400));
    setFormPriority(String(record.priority || 10));
    setEditDialog({ open: true, record, isNew: false });
  };

  const handleSaveRecord = () => {
    if (!selectedDomain) return;

    const newRecord: any = {
      type: formType,
      name: formName || '@',
      ttl: parseInt(formTTL) || 14400,
    };

    if (formType === 'MX' || formType === 'SRV') {
      newRecord.priority = parseInt(formPriority) || 10;
    }

    // Different field names per record type
    if (['A', 'AAAA'].includes(formType)) {
      newRecord.address = formContent;
    } else if (formType === 'CNAME' || formType === 'NS' || formType === 'MX') {
      newRecord.target = formContent;
    } else {
      newRecord.content = formContent;
    }

    if (editDialog.isNew) {
      // Add new record: send all existing + new
      const allRecords = [...(records || []), newRecord];
      updateDNS.mutate({ domain: selectedDomain, records: allRecords });
    } else {
      // Update: replace old with new
      const allRecords = (records || []).map((r: DNSRecord) =>
        r.type === editDialog.record?.type && r.name === editDialog.record?.name
          ? newRecord : r
      );
      updateDNS.mutate({ domain: selectedDomain, records: allRecords });
    }
  };

  const handleDeleteRecord = () => {
    if (!selectedDomain || !deleteDialog.record) return;
    const rec = deleteDialog.record;
    deleteDNS.mutate({
      domain: selectedDomain,
      recordsToDelete: [{ type: rec.type, name: rec.name, content: rec.content || rec.address || rec.target }]
    });
  };

  const filteredRecords = (records || []).filter((r: DNSRecord) => {
    const matchesSearch = !searchFilter ||
      r.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.content || r.address || r.target || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getRecordValue = (r: DNSRecord) => r.content || r.address || r.target || r.value || '—';

  // Domain list view
  if (!selectedDomain) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Domínios & DNS</h2>
          </div>
          <Button onClick={() => refetchDomains()} variant="outline" size="sm" className="h-7 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
          </Button>
        </div>

        {domainsLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando domínios...</span>
          </div>
        ) : !domains || domains.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Nenhum Domínio Encontrado</h3>
            <p className="text-xs text-muted-foreground">
              Nenhum domínio encontrado na sua conta Hostinger, ou a API não possui permissão para domínios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {domains.map((domain: any) => {
              const domainName = typeof domain === 'string' ? domain : domain.domain || domain.name || domain.id;
              const status = typeof domain === 'object' ? domain.status : null;
              return (
                <button
                  key={domainName}
                  onClick={() => setSelectedDomain(domainName)}
                  className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">{domainName}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {status && (
                    <Badge variant="outline" className="mt-2 text-[9px] px-1.5 py-0 h-4">
                      {status}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // DNS records view
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={() => setSelectedDomain('')} variant="ghost" size="sm" className="h-7 px-2">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{selectedDomain}</h2>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
            {filteredRecords.length} registros
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button onClick={() => refetchRecords()} variant="outline" size="sm" className="h-7 text-xs px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button onClick={openNewRecord} size="sm" className="h-7 text-xs px-2">
            <Plus className="h-3 w-3 mr-1" /> Novo Registro
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Buscar registros..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-7 text-xs pl-7"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-7 text-xs w-[100px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {RECORD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      {recordsLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Carregando registros DNS...</span>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-[10px] font-semibold h-8 w-[70px]">Tipo</TableHead>
                <TableHead className="text-[10px] font-semibold h-8">Nome</TableHead>
                <TableHead className="text-[10px] font-semibold h-8">Valor</TableHead>
                <TableHead className="text-[10px] font-semibold h-8 w-[60px]">TTL</TableHead>
                <TableHead className="text-[10px] font-semibold h-8 w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record: DNSRecord, idx: number) => {
                  const Icon = RECORD_ICON[record.type] || Globe;
                  return (
                    <TableRow key={`${record.type}-${record.name}-${idx}`} className="hover:bg-muted/30">
                      <TableCell className="py-1.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono gap-1">
                          <Icon className="h-2.5 w-2.5" />
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-foreground py-1.5 max-w-[200px] truncate">
                        {record.name || '@'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1.5 max-w-[250px] truncate font-mono">
                        {record.priority != null && <span className="text-primary mr-1">[{record.priority}]</span>}
                        {getRecordValue(record)}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-1.5">
                        {record.ttl}
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button onClick={() => openEditRecord(record)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button onClick={() => setDeleteDialog({ open: true, record })} variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/New Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editDialog.isNew ? 'Novo Registro DNS' : 'Editar Registro DNS'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={formType} onValueChange={setFormType} disabled={!editDialog.isNew}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome (Host)</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="@ ou subdomínio"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor</Label>
              <Input
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={formType === 'A' ? 'Ex: 192.168.1.1' : formType === 'CNAME' ? 'Ex: example.com' : 'Valor'}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">TTL (segundos)</Label>
                <Input
                  value={formTTL}
                  onChange={(e) => setFormTTL(e.target.value)}
                  type="number"
                  className="h-8 text-xs"
                />
              </div>
              {(formType === 'MX' || formType === 'SRV') && (
                <div className="space-y-1">
                  <Label className="text-xs">Prioridade</Label>
                  <Input
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    type="number"
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditDialog({ open: false })} variant="outline" size="sm" className="text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSaveRecord} size="sm" className="text-xs" disabled={updateDNS.isPending}>
              {updateDNS.isPending ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false })}
        onConfirm={handleDeleteRecord}
        title="Remover Registro DNS"
        description={`Deseja remover o registro ${deleteDialog.record?.type} "${deleteDialog.record?.name || '@'}"?`}
      />
    </div>
  );
};
