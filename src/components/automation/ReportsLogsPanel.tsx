
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  MessageCircle,
  AlertTriangle,
  Download,
  Calendar,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { BaculaReportViewer } from './BaculaReportViewer';

interface ReportLog {
  id: string;
  report_id: string;
  status: 'success' | 'error' | 'pending';
  execution_date: string;
  execution_time_ms?: number;
  message_content?: string;
  error_details?: string;
  phone_number: string;
  message_sent: boolean;
  whatsapp_response?: any;
}

export const ReportsLogsPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');
  const { toast } = useToast();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['scheduled-reports-logs', statusFilter, dateFilter],
    queryFn: async () => {
      console.log('🔍 Buscando logs de execução...');
      
      let query = supabase
        .from('scheduled_reports_logs')
        .select('*')
        .order('execution_date', { ascending: false });

      // Filtro por status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Filtro por data
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('execution_date', startDate.toISOString());
      }

      const { data, error } = await query.limit(100);
      
      if (error) {
        console.error('❌ Erro ao buscar logs:', error);
        throw error;
      }
      
      console.log('📋 Logs encontrados:', data?.length || 0);
      return data as ReportLog[];
    },
  });

  // Filtrar logs pelo termo de busca
  const filteredLogs = logs.filter(log => 
    log.phone_number.includes(searchTerm) ||
    log.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.error_details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else if (status === 'error') {
      return <XCircle className="h-4 w-4 text-red-400" />;
    } else if (status === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-400" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    }
  };

  const getStatusBadge = (status: string, messageSent: boolean) => {
    if (status === 'success' && messageSent) {
      return <Badge className="bg-green-600 text-white border-green-500">Enviado</Badge>;
    } else if (status === 'success' && !messageSent) {
      return <Badge className="bg-yellow-600 text-white border-yellow-500">Processado</Badge>;
    } else if (status === 'error') {
      return <Badge className="bg-red-600 text-white border-red-500">Erro</Badge>;
    } else {
      return <Badge className="bg-gray-600 text-gray-200 border-gray-500">Pendente</Badge>;
    }
  };

  const formatExecutionTime = (timeMs?: number) => {
    if (!timeMs) return 'N/A';
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const handleClearLogs = async () => {
    try {
      const { error } = await supabase
        .from('scheduled_reports_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      refetch(); // Refresh the logs after clearing
      toast({
        title: "Logs limpos com sucesso",
        description: "Todos os logs de execução foram removidos.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao limpar logs",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-blue-400" />
            Logs de Execução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por telefone, mensagem ou erro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-600">Todos</SelectItem>
                <SelectItem value="success" className="text-white hover:bg-gray-600">Sucesso</SelectItem>
                <SelectItem value="error" className="text-white hover:bg-gray-600">Erro</SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-gray-600">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="24h" className="text-white hover:bg-gray-600">Últimas 24h</SelectItem>
                <SelectItem value="7days" className="text-white hover:bg-gray-600">Últimos 7 dias</SelectItem>
                <SelectItem value="30days" className="text-white hover:bg-gray-600">Últimos 30 dias</SelectItem>
                <SelectItem value="all" className="text-white hover:bg-gray-600">Todo período</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Carregando logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum log encontrado</h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all' || dateFilter !== '7days'
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Ainda não há execuções de relatórios registradas.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(log.status, log.message_sent)}
                        <span className="font-medium text-white">
                          {log.phone_number}
                        </span>
                        {getStatusBadge(log.status, log.message_sent)}
                        <span className="text-xs text-gray-400">
                          {formatExecutionTime(log.execution_time_ms)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.execution_date).toLocaleString('pt-BR')}
                        </div>
                        {log.message_sent && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            Mensagem enviada
                          </div>
                        )}
                      </div>

                      {log.message_content && (
                        <div className="mb-3">
                          {log.message_content.includes('RELATÓRIO DIÁRIO BACULA') ? (
                            <BaculaReportViewer messageContent={log.message_content} />
                          ) : (
                            <div className="bg-gray-700 p-3 rounded-lg">
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                {log.message_content}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {log.error_details && (
                        <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-sm font-medium text-red-300">Erro na Execução</span>
                          </div>
                          <p className="text-sm text-red-200">
                            {log.error_details}
                          </p>
                        </div>
                      )}

                      {log.whatsapp_response && (
                        <details className="mt-3">
                          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                            Ver resposta completa do WhatsApp
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-700 p-3 rounded overflow-x-auto text-gray-300">
                            {JSON.stringify(log.whatsapp_response, null, 2)}
                          </pre>
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
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>
            Exibindo {filteredLogs.length} de {logs.length} registros
          </span>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600"
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-800 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Confirmar Limpeza</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Esta ação irá remover todos os logs de execução permanentemente. 
                    Esta operação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearLogs}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Limpar Logs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Logs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
