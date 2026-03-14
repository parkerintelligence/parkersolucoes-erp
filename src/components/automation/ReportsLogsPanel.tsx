
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Search, RefreshCw, CheckCircle, XCircle, Clock, MessageCircle, AlertTriangle, Download, Calendar, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { BaculaReportViewer } from './BaculaReportViewer';

interface ReportLog {
  id: string; report_id: string; status: 'success' | 'error' | 'pending'; execution_date: string;
  execution_time_ms?: number; message_content?: string; error_details?: string; phone_number: string;
  message_sent: boolean; whatsapp_response?: any;
}

export const ReportsLogsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');
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
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as ReportLog[];
    },
  });

  const filteredLogs = logs.filter(log =>
    log.phone_number.includes(searchTerm) ||
    log.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.error_details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent) return <CheckCircle className="h-3 w-3 text-green-400" />;
    if (status === 'error') return <XCircle className="h-3 w-3 text-destructive" />;
    if (status === 'pending') return <Clock className="h-3 w-3 text-yellow-400" />;
    return <AlertTriangle className="h-3 w-3 text-orange-400" />;
  };

  const getStatusBadge = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-400">Enviado</Badge>;
    if (status === 'success' && !messageSent) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/30 text-yellow-400">Processado</Badge>;
    if (status === 'error') return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">Erro</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">Pendente</Badge>;
  };

  const formatExecutionTime = (timeMs?: number) => {
    if (!timeMs) return 'N/A';
    return timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`;
  };

  const handleClearLogs = async () => {
    try {
      const { error } = await supabase.from('scheduled_reports_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      refetch();
      toast({ title: "Logs limpos com sucesso", description: "Todos os logs foram removidos." });
    } catch (error: any) {
      toast({ title: "Erro ao limpar logs", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 p-2.5 bg-muted/30 border border-border rounded-lg flex-wrap">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="relative flex-1 min-w-[200px]">
          <Input placeholder="Buscar por telefone, mensagem ou erro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-xs bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 w-32 text-xs bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-7 w-36 text-xs bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-7 text-xs">
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Logs List */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground text-xs">Carregando logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-sm font-medium text-foreground mb-1">Nenhum log encontrado</h3>
              <p className="text-xs text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || dateFilter !== '7days' ? 'Ajuste os filtros.' : 'Ainda não há execuções registradas.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {getStatusIcon(log.status, log.message_sent)}
                        <span className="text-xs font-medium text-foreground">{log.phone_number}</span>
                        {getStatusBadge(log.status, log.message_sent)}
                        <span className="text-[10px] text-muted-foreground">{formatExecutionTime(log.execution_time_ms)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                        <div className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{new Date(log.execution_date).toLocaleString('pt-BR')}</div>
                        {log.message_sent && <div className="flex items-center gap-1"><MessageCircle className="h-2.5 w-2.5" />Mensagem enviada</div>}
                      </div>
                      {log.message_content && (
                        <div className="mb-2">
                          {log.message_content.includes('RELATÓRIO DIÁRIO BACULA') ? (
                            <BaculaReportViewer messageContent={log.message_content} />
                          ) : (
                            <div className="bg-muted/30 p-2.5 rounded-md border border-border/50">
                              <p className="text-xs text-foreground whitespace-pre-wrap">{log.message_content}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {log.error_details && (
                        <div className="bg-destructive/5 border border-destructive/30 p-2.5 rounded-md">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                            <span className="text-xs font-medium text-destructive">Erro</span>
                          </div>
                          <p className="text-xs text-destructive/80">{log.error_details}</p>
                        </div>
                      )}
                      {log.whatsapp_response && (
                        <details className="mt-2">
                          <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">Ver resposta WhatsApp</summary>
                          <pre className="mt-1 text-[10px] bg-muted/30 p-2 rounded overflow-x-auto text-foreground">{JSON.stringify(log.whatsapp_response, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredLogs.length > 0 && (
        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Exibindo {filteredLogs.length} de {logs.length} registros</span>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10" disabled={logs.length === 0}>
                  <Trash2 className="h-3 w-3 mr-1" /> Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-border bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Confirmar Limpeza</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">Esta ação irá remover todos os logs permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLogs} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Download className="h-3 w-3 mr-1" /> Exportar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
