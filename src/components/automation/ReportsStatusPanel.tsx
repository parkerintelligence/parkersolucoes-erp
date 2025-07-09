import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Play,
  RefreshCw
} from 'lucide-react';
import { useScheduledReports, useTestScheduledReport } from '@/hooks/useScheduledReports';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { toast } from '@/hooks/use-toast';

export const ReportsStatusPanel = () => {
  const { data: reports = [], isLoading } = useScheduledReports();
  const { data: templates = [] } = useWhatsAppTemplates();
  const testReport = useTestScheduledReport();

  const getTemplateInfo = (reportType: string) => {
    const template = templates.find(t => t.id === reportType);
    if (template) {
      return {
        name: template.name,
        type: template.template_type,
        isActive: template.is_active,
        exists: true
      };
    }
    
    return {
      name: 'Template não encontrado',
      type: 'unknown',
      isActive: false,
      exists: false
    };
  };

  const formatNextExecution = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    // Parse the UTC date from database
    const utcDate = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(utcDate.getTime())) return 'Data inválida';
    
    // Compare UTC date directly with current local time
    const now = new Date();
    const diffMs = utcDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Atrasado';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `Em ${diffHours}h ${remainingMinutes}min`;
      }
      return `Em ${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `Em ${diffMinutes}min`;
    } else {
      return 'Agora';
    }
  };

  const getExecutionStatus = (nextExecution?: string) => {
    if (!nextExecution) return 'inactive';
    
    // Parse the UTC date from database
    const utcDate = new Date(nextExecution);
    
    if (isNaN(utcDate.getTime())) return 'error';
    
    // Compare UTC date directly with current local time
    const now = new Date();
    const diffMs = utcDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'overdue';
    if (diffMs < 60 * 60 * 1000) return 'upcoming'; // Próxima 1 hora
    return 'scheduled';
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    // Parse the UTC date from database
    const utcDate = new Date(dateString);
    
    if (isNaN(utcDate.getTime())) return 'Data inválida';
    
    // Format using Brazil timezone without manual conversion
    return utcDate.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExecuteReport = async (reportId: string, reportName: string) => {
    try {
      await testReport.mutateAsync(reportId);
      toast({
        title: "Execução iniciada",
        description: `O relatório "${reportName}" está sendo executado manualmente.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na execução",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Separar relatórios por status
  const activeReports = reports.filter(r => r.is_active);
  const upcomingReports = activeReports
    .filter(r => {
      if (!r.next_execution) return false;
      const utcDate = new Date(r.next_execution);
      const now = new Date();
      return utcDate > now;
    })
    .sort((a, b) => {
      const aUtc = new Date(a.next_execution!);
      const bUtc = new Date(b.next_execution!);
      return aUtc.getTime() - bUtc.getTime();
    });
  
  const overdueReports = activeReports
    .filter(r => {
      if (!r.next_execution) return false;
      const utcDate = new Date(r.next_execution);
      const now = new Date();
      return utcDate < now;
    });

  const recentExecutions = reports
    .filter(r => r.last_execution)
    .sort((a, b) => new Date(b.last_execution!).getTime() - new Date(a.last_execution!).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Carregando status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Ativo</p>
                <p className="text-2xl font-bold text-white">{activeReports.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Próximas</p>
                <p className="text-2xl font-bold text-white">{upcomingReports.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Atrasados</p>
                <p className="text-2xl font-bold text-red-400">{overdueReports.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Execuções</p>
                <p className="text-2xl font-bold text-white">
                  {reports.reduce((acc, r) => acc + r.execution_count, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Execuções Agendadas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-blue-500" />
              Próximas Execuções Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReports.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Nenhuma execução agendada encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingReports.slice(0, 8).map((report) => {
                  const status = getExecutionStatus(report.next_execution);
                  const templateInfo = getTemplateInfo(report.report_type);
                  const canExecute = templateInfo.exists && templateInfo.isActive;
                  
                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white">{report.name}</span>
                          <Badge 
                            variant={status === 'upcoming' ? 'default' : 'secondary'}
                            className="text-xs bg-blue-600 text-white"
                          >
                            {formatNextExecution(report.next_execution)}
                          </Badge>
                          {!canExecute && (
                            <Badge className="text-xs bg-red-600 text-white">
                              Template inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Template: {templateInfo.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Próxima execução: {formatDateTime(report.next_execution)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteReport(report.id, report.name)}
                        disabled={testReport.isPending || !canExecute}
                        className="ml-2 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                        title={canExecute ? "Executar agora" : "Template inativo ou não encontrado"}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execuções Atrasadas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Execuções Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReports.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                ✅ Nenhuma execução atrasada
              </p>
            ) : (
              <div className="space-y-3">
                {overdueReports.map((report) => {
                  const templateInfo = getTemplateInfo(report.report_type);
                  const canExecute = templateInfo.exists && templateInfo.isActive;
                  
                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white">{report.name}</span>
                          <Badge className="text-xs bg-red-600 text-white">
                            Atrasado
                          </Badge>
                          {!canExecute && (
                            <Badge className="text-xs bg-gray-600 text-gray-200">
                              Template inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Template: {templateInfo.name}
                        </p>
                        <p className="text-xs text-red-400">
                          Deveria ter executado: {formatDateTime(report.next_execution)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteReport(report.id, report.name)}
                        disabled={testReport.isPending || !canExecute}
                        className="ml-2 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        title={canExecute ? "Executar agora" : "Template inativo ou não encontrado"}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Execuções */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-purple-500" />
            Últimas Execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Nenhuma execução registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((report) => {
                const templateInfo = getTemplateInfo(report.report_type);
                
                return (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-white">{report.name}</span>
                        <Badge className="text-xs bg-gray-600 text-gray-200">
                          {report.execution_count} execuções
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        Template: {templateInfo.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Última execução: {formatDateTime(report.last_execution)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
