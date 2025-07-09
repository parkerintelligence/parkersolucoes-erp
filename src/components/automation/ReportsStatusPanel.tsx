
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
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Atrasado';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Em ${diffHours}h`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Em ${diffMinutes}min`;
    }
  };

  const getExecutionStatus = (nextExecution?: string) => {
    if (!nextExecution) return 'inactive';
    
    const date = new Date(nextExecution);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'overdue';
    if (diffMs < 60 * 60 * 1000) return 'upcoming';
    return 'scheduled';
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
    .filter(r => r.next_execution && new Date(r.next_execution) > new Date())
    .sort((a, b) => new Date(a.next_execution!).getTime() - new Date(b.next_execution!).getTime());
  
  const overdueReports = activeReports
    .filter(r => r.next_execution && new Date(r.next_execution) < new Date());

  const recentExecutions = reports
    .filter(r => r.last_execution)
    .sort((a, b) => new Date(b.last_execution!).getTime() - new Date(a.last_execution!).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Carregando status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ativo</p>
                <p className="text-2xl font-bold">{activeReports.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximas</p>
                <p className="text-2xl font-bold">{upcomingReports.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atrasados</p>
                <p className="text-2xl font-bold text-red-600">{overdueReports.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Execuções</p>
                <p className="text-2xl font-bold">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Próximas Execuções Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReports.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma execução agendada encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingReports.slice(0, 8).map((report) => {
                  const status = getExecutionStatus(report.next_execution);
                  const templateInfo = getTemplateInfo(report.report_type);
                  const canExecute = templateInfo.exists && templateInfo.isActive;
                  
                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{report.name}</span>
                          <Badge 
                            variant={status === 'upcoming' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {formatNextExecution(report.next_execution)}
                          </Badge>
                          {!canExecute && (
                            <Badge variant="destructive" className="text-xs">
                              Template inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Template: {templateInfo.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.next_execution && 
                            new Date(report.next_execution).toLocaleString('pt-BR')
                          }
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteReport(report.id, report.name)}
                        disabled={testReport.isPending || !canExecute}
                        className="ml-2"
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Execuções Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReports.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                ✅ Nenhuma execução atrasada
              </p>
            ) : (
              <div className="space-y-3">
                {overdueReports.map((report) => {
                  const templateInfo = getTemplateInfo(report.report_type);
                  const canExecute = templateInfo.exists && templateInfo.isActive;
                  
                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{report.name}</span>
                          <Badge variant="destructive" className="text-xs">
                            Atrasado
                          </Badge>
                          {!canExecute && (
                            <Badge variant="secondary" className="text-xs">
                              Template inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Template: {templateInfo.name}
                        </p>
                        <p className="text-xs text-red-600">
                          Deveria ter executado: {' '}
                          {report.next_execution && 
                            new Date(report.next_execution).toLocaleString('pt-BR')
                          }
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteReport(report.id, report.name)}
                        disabled={testReport.isPending || !canExecute}
                        className="ml-2 border-red-300 text-red-600 hover:bg-red-50"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Últimas Execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma execução registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((report) => {
                const templateInfo = getTemplateInfo(report.report_type);
                
                return (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{report.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {report.execution_count} execuções
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Template: {templateInfo.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Última execução: {' '}
                        {report.last_execution && 
                          new Date(report.last_execution).toLocaleString('pt-BR')
                        }
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
