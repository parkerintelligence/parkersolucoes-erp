import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, RefreshCw, CheckCircle, XCircle, Clock, MessageCircle, AlertTriangle, Calendar, Eye, Trash2, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { BaculaReportViewer } from './BaculaReportViewer';

interface ReportLog {
  id: string;
  report_id: string;
  status: string;
  execution_date: string;
  execution_time_ms?: number;
  message_content?: string;
  error_details?: string;
  phone_number: string;
  message_sent: boolean;
  whatsapp_response?: any;
  scheduled_reports?: { name: string; report_type: string } | null;
}

const MAX_LOGS = 10;

export const ReportsLogsPanel = () => {
  const [selectedLog, setSelectedLog] = useState<ReportLog | null>(null);
  const { toast } = useToast();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['scheduled-reports-logs-grid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports_logs')
        .select(`*, scheduled_reports(name, report_type)`)
        .order('execution_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ReportLog[];
    },
  });

  // Auto-clean: keep only last 10 logs
  useEffect(() => {
    const autoClean = async () => {
      if (logs.length <= MAX_LOGS) return;
      const idsToDelete = logs.slice(MAX_LOGS).map(l => l.id);
      if (idsToDelete.length === 0) return;
      try {
        const { error } = await supabase
          .from('scheduled_reports_logs')
          .delete()
          .in('id', idsToDelete);
        if (error) throw error;
        refetch();
      } catch (e) {
        console.error('Auto-clean failed:', e);
      }
    };
    autoClean();
  }, [logs]);

  const displayLogs = logs.slice(0, MAX_LOGS);

  const getStatusIcon = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent) return <CheckCircle className="h-3 w-3 text-emerald-400" />;
    if (status === 'success') return <Clock className="h-3 w-3 text-yellow-400" />;
    if (status === 'error') return <XCircle className="h-3 w-3 text-destructive" />;
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent)
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Enviado</Badge>;
    if (status === 'success')
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/30 text-yellow-400 bg-yellow-500/10">Processado</Badge>;
    if (status === 'error')
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive bg-destructive/10">Erro</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">Pendente</Badge>;
  };

  const formatTime = (ms?: number) => {
    if (!ms) return '-';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const getReportTypeBadge = (type?: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      bacula: { label: 'Bacula', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
      backup_alert: { label: 'Backup', color: 'border-orange-500/30 text-orange-400 bg-orange-500/10' },
      schedule_critical: { label: 'Agenda', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
      glpi_summary: { label: 'GLPI', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' },
      custom: { label: 'Custom', color: 'border-accent/30 text-accent-foreground bg-accent/10' },
    };
    const info = labels[type || ''] || { label: type || '-', color: 'border-border text-muted-foreground' };
    return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${info.color}`}>{info.label}</Badge>;
  };

  return (
    <TooltipProvider>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Últimos {displayLogs.length} log{displayLogs.length !== 1 ? 's' : ''} · Auto-limpeza ativa (máx {MAX_LOGS})
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-6 px-2 text-[10px]">
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Grid Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : displayLogs.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-7 px-2 text-[10px] font-semibold w-[60px]">Status</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold">Relatório</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold">Tipo</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold">Telefone</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold">Data/Hora</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold w-[60px]">Tempo</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold">WhatsApp</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold">Resultado</TableHead>
                <TableHead className="h-7 px-2 text-[10px] font-semibold w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="py-1 px-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status, log.message_sent)}
                      {getStatusBadge(log.status, log.message_sent)}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-foreground font-medium truncate block max-w-[140px]">
                          {log.scheduled_reports?.name || log.report_id.slice(0, 8)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{log.scheduled_reports?.name || log.report_id}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    {getReportTypeBadge(log.scheduled_reports?.report_type)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <span className="text-xs text-foreground">{log.phone_number}</span>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.execution_date).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Zap className="h-2.5 w-2.5" />
                          {formatTime(log.execution_time_ms)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Tempo de execução: {formatTime(log.execution_time_ms)}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    {log.message_sent ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <MessageCircle className="h-2.5 w-2.5" />
                        <span>Enviado</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    {log.error_details ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-destructive truncate block max-w-[150px] flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                            {log.error_details}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">{log.error_details}</TooltipContent>
                      </Tooltip>
                    ) : log.message_content ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-muted-foreground truncate block max-w-[150px]">
                            {log.message_content.slice(0, 50)}...
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">{log.message_content.slice(0, 200)}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
                  <span className="text-[10px] text-muted-foreground block">Relatório</span>
                  <span className="font-medium text-foreground">{selectedLog.scheduled_reports?.name || '-'}</span>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-[10px] text-muted-foreground block">Tipo</span>
                  {getReportTypeBadge(selectedLog.scheduled_reports?.report_type)}
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
                  <span className="text-foreground">{formatTime(selectedLog.execution_time_ms)}</span>
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
    </TooltipProvider>
  );
};
