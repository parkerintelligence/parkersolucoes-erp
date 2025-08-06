import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReportsLogs, useReportsMetrics } from '@/hooks/useReportsLogs';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { supabase } from '@/integrations/supabase/client';

import { 
  BarChart3, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ReportsDashboard = () => {
  const [selectedReport, setSelectedReport] = useState<string>('all');
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useReportsMetrics();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useReportsLogs(selectedReport === 'all' ? undefined : selectedReport);
  const { data: reports } = useScheduledReports();

  const handleClearLogs = async () => {
    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase
          .from('scheduled_reports_logs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) throw error;
        
        refetchLogs();
        refetchMetrics();
      } catch (error) {
        console.error('Erro ao limpar logs:', error);
      }
    }
  };

  const handleRefresh = () => {
    refetchLogs();
    refetchMetrics();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const pieData = metrics ? [
    { name: 'Sucesso', value: metrics.success, color: '#22c55e' },
    { name: 'Erro', value: metrics.errors, color: '#ef4444' },
  ] : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Relatórios</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho e histórico dos relatórios automatizados</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              onClick={handleClearLogs} 
              variant="outline" 
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Logs
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics?.successRate ? `${metrics.successRate.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.success || 0} de {metrics?.total || 0} execuções
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.messagesSent || 0}</div>
              <p className="text-xs text-muted-foreground">Via WhatsApp</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgExecutionTime || 0}ms</div>
              <p className="text-xs text-muted-foreground">Execução por relatório</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="logs">Logs Detalhados</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Tendência */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Execuções</CardTitle>
                  <CardDescription>Execuções por dia (últimos 30 dias)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics?.dailyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="success" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="Sucesso"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="error" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Erro"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição de Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Status</CardTitle>
                  <CardDescription>Proporção de sucessos vs erros</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selecionar relatório" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os relatórios</SelectItem>
                      {reports?.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>
                  {logs?.length || 0} execuções encontradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Carregando logs...</p>
                    </div>
                  )}
                  
                  {logs?.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-medium">{log.scheduled_reports.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(log.execution_date), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={log.message_sent ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {log.message_sent ? 'Enviado' : 'Não enviado'}
                          </Badge>
                          <Badge 
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {log.execution_time_ms && (
                        <p className="text-sm text-muted-foreground">
                          Tempo de execução: {log.execution_time_ms}ms
                        </p>
                      )}
                      
                      {log.error_details && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                          <p className="text-sm text-destructive font-medium">Erro:</p>
                          <p className="text-sm text-destructive">{log.error_details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!logsLoading && (!logs || logs.length === 0) && (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum log encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Execuções por Dia</CardTitle>
                <CardDescription>Volume de execuções nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={metrics?.dailyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                    />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsDashboard;