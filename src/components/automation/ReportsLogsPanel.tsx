
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Search, RefreshCw, CheckCircle, XCircle, Clock, MessageCircle, AlertTriangle, Download, Calendar, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BaculaReportViewer } from './BaculaReportViewer';

interface ReportLog {
  id: string; report_id: string; status: 'success' | 'error' | 'pending'; execution_date: string;
  execution_time_ms?: number; message_content?: string; error_details?: string; phone_number: string;
  message_sent: boolean; whatsapp_response?: any;
}

const ITEMS_PER_PAGE = 10;

export const ReportsLogsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ReportLog | null>(null);
  const { toast } = useToast();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['scheduled-reports-logs', statusFilter, dateFilter],
    queryFn: async () => {
      let query = supabase.from('scheduled_reports_logs').select('*').order('execution_date', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (dateFilter !== 'all') {
        const now = new Date();
        const ms = dateFilter === '24h' ? 86400000 : dateFilter === '7days' ? 604800000 : 2592000000;
        query = query.gte('execution_date', new Date(now.getTime() - ms).toISOString());
      }
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data as ReportLog[];
    },
  });

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter(log =>
      log.phone_number.includes(searchTerm) ||
      log.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.error_details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  }, [logs, searchTerm]);

  // Reset page when filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusBadge = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Enviado</Badge>;
    if (status === 'success' && !messageSent) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/30 text-yellow-400 bg-yellow-500/10">Processado</Badge>;
    if (status === 'error') return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive bg-destructive/10">Erro</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">Pendente</Badge>;
  };

  const formatExecutionTime = (timeMs?: number) => {
    if (!timeMs) return '-';
    return timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`;
  };

  const handleClearLogs = async () => {
    try {
      const { error } = await supabase.from('scheduled_reports_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      refetch();
      toast({ title: "Logs limpos com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao limpar logs", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-xs bg-card border-border pl-7" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 w-28 text-xs bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-7 w-32 text-xs bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7days">7 dias</SelectItem>
            <SelectItem value="30days">30 dias</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-7 px-2">
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10" disabled={logs.length === 0}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Limpeza</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">Remover todos os logs permanentemente?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearLogs} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Limpar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">Nenhum log encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className={`h-0.5 w-full ${log.status === 'success' && log.message_sent ? 'bg-emerald-500' : log.status === 'error' ? 'bg-destructive' : log.status === 'success' ? 'bg-yellow-500' : 'bg-muted-foreground'}`} />
                <div className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(log.status, log.message_sent)}
                    <span className="text-[10px] text-muted-foreground">{formatExecutionTime(log.execution_time_ms)}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{log.phone_number}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{new Date(log.execution_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {log.error_details && (
                    <p className="text-[10px] text-destructive truncate">{log.error_details}</p>
                  )}
                  {log.message_sent && !log.error_details && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <MessageCircle className="h-2.5 w-2.5" />
                      <span>Mensagem enviada</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''} · Página {currentPage}/{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 w-6 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) { page = i + 1; }
                else if (currentPage <= 3) { page = i + 1; }
                else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
                else { page = currentPage - 2 + i; }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={`h-6 w-6 p-0 text-[10px] ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-6 w-6 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg border-border bg-card max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes do Log
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-[10px] text-muted-foreground block">Status</span>
                  {getStatusBadge(selectedLog.status, selectedLog.message_sent)}
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-[10px] text-muted-foreground block">Telefone</span>
                  <span className="font-medium text-foreground">{selectedLog.phone_number}</span>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-[10px] text-muted-foreground block">Data</span>
                  <span className="text-foreground">{new Date(selectedLog.execution_date).toLocaleString('pt-BR')}</span>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-[10px] text-muted-foreground block">Tempo</span>
                  <span className="text-foreground">{formatExecutionTime(selectedLog.execution_time_ms)}</span>
                </div>
              </div>
              {selectedLog.message_content && (
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">Conteúdo</span>
                  {selectedLog.message_content.includes('RELATÓRIO DIÁRIO BACULA') ? (
                    <BaculaReportViewer messageContent={selectedLog.message_content} />
                  ) : (
                    <div className="bg-muted/30 p-2.5 rounded-md border border-border/50 max-h-48 overflow-y-auto">
                      <p className="text-xs text-foreground whitespace-pre-wrap">{selectedLog.message_content}</p>
                    </div>
                  )}
                </div>
              )}
              {selectedLog.error_details && (
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">Erro</span>
                  <div className="bg-destructive/5 border border-destructive/30 p-2.5 rounded-md">
                    <p className="text-xs text-destructive">{selectedLog.error_details}</p>
                  </div>
                </div>
              )}
              {selectedLog.whatsapp_response && (
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">Resposta WhatsApp</span>
                  <pre className="text-[10px] bg-muted/30 p-2 rounded overflow-x-auto text-foreground max-h-32">{JSON.stringify(selectedLog.whatsapp_response, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
