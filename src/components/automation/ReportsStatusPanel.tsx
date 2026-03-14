
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle, Play, RefreshCw } from 'lucide-react';
import { useScheduledReports, useTestScheduledReport } from '@/hooks/useScheduledReports';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { toast } from '@/hooks/use-toast';

export const ReportsStatusPanel = () => {
  const { data: reports = [], isLoading } = useScheduledReports();
  const { data: templates = [] } = useWhatsAppTemplates();
  const testReport = useTestScheduledReport();

  const getTemplateInfo = (reportType: string) => {
    const template = templates.find(t => t.id === reportType);
    if (template) return { name: template.name, type: template.template_type, isActive: template.is_active, exists: true };
    return { name: 'Template não encontrado', type: 'unknown', isActive: false, exists: false };
  };

  const formatNextExecution = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const utcDate = new Date(dateString);
    if (isNaN(utcDate.getTime())) return 'Data inválida';
    const nowUtc = new Date();
    const diffMs = utcDate.getTime() - nowUtc.getTime();
    if (diffMs < 0) return 'Atrasado';
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Em ${diffHours}h${diffMinutes % 60 > 0 ? ` ${diffMinutes % 60}min` : ''}`;
    if (diffMinutes > 0) return `Em ${diffMinutes}min`;
    return 'Agora';
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const utcDate = new Date(dateString);
    if (isNaN(utcDate.getTime())) return 'Data inválida';
    return utcDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleExecuteReport = async (reportId: string, reportName: string) => {
    try {
      await testReport.mutateAsync(reportId);
      toast({ title: "Execução iniciada", description: `O relatório "${reportName}" está sendo executado.` });
    } catch (error: any) {
      toast({ title: "Erro na execução", description: error.message, variant: "destructive" });
    }
  };

  const activeReports = reports.filter(r => r.is_active);
  const nowUtc = new Date();
  const upcomingReports = activeReports.filter(r => r.next_execution && new Date(r.next_execution) > nowUtc).sort((a, b) => new Date(a.next_execution!).getTime() - new Date(b.next_execution!).getTime());
  const overdueReports = activeReports.filter(r => r.next_execution && new Date(r.next_execution) < nowUtc);
  const recentExecutions = reports.filter(r => r.last_execution).sort((a, b) => new Date(b.last_execution!).getTime() - new Date(a.last_execution!).getTime()).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground text-xs">Carregando status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div><p className="text-lg font-bold text-foreground">{activeReports.length}</p><p className="text-[11px] text-muted-foreground">Total Ativo</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <div><p className="text-lg font-bold text-foreground">{upcomingReports.length}</p><p className="text-[11px] text-muted-foreground">Próximas</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div><p className="text-lg font-bold text-destructive">{overdueReports.length}</p><p className="text-[11px] text-muted-foreground">Atrasados</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <div><p className="text-lg font-bold text-foreground">{reports.reduce((acc, r) => acc + r.execution_count, 0)}</p><p className="text-[11px] text-muted-foreground">Execuções</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <Clock className="h-4 w-4 text-primary" /> Próximas Execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReports.length === 0 ? (
              <p className="text-muted-foreground text-center text-xs py-4">Nenhuma execução agendada</p>
            ) : (
              <div className="space-y-2">
                {upcomingReports.slice(0, 8).map((report) => {
                  const templateInfo = getTemplateInfo(report.report_type);
                  const canExecute = templateInfo.exists && templateInfo.isActive;
                  return (
                    <div key={report.id} className="flex items-center justify-between p-2.5 rounded-md border border-border/50 hover:bg-muted/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-foreground truncate">{report.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">{formatNextExecution(report.next_execution)}</Badge>
                          {!canExecute && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">Template inativo</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Template: {templateInfo.name}</p>
                        <p className="text-[10px] text-muted-foreground/70">{formatDateTime(report.next_execution)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExecuteReport(report.id, report.name)} disabled={testReport.isPending || !canExecute} className="h-6 w-6 p-0 ml-2">
                        <Play className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Execuções Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReports.length === 0 ? (
              <p className="text-muted-foreground text-center text-xs py-4">✅ Nenhuma execução atrasada</p>
            ) : (
              <div className="space-y-2">
                {overdueReports.map((report) => {
                  const templateInfo = getTemplateInfo(report.report_type);
                  const canExecute = templateInfo.exists && templateInfo.isActive;
                  return (
                    <div key={report.id} className="flex items-center justify-between p-2.5 rounded-md border border-destructive/30 bg-destructive/5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-foreground truncate">{report.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">Atrasado</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Template: {templateInfo.name}</p>
                        <p className="text-[10px] text-destructive/70">Deveria: {formatDateTime(report.next_execution)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExecuteReport(report.id, report.name)} disabled={testReport.isPending || !canExecute} className="h-6 w-6 p-0 ml-2">
                        <Play className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-sm">
            <Calendar className="h-4 w-4 text-purple-500" /> Últimas Execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <p className="text-muted-foreground text-center text-xs py-4">Nenhuma execução registrada</p>
          ) : (
            <div className="space-y-2">
              {recentExecutions.map((report) => {
                const templateInfo = getTemplateInfo(report.report_type);
                return (
                  <div key={report.id} className="flex items-center justify-between p-2.5 rounded-md border border-border/50 hover:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-foreground truncate">{report.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{report.execution_count} exec</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Template: {templateInfo.name}</p>
                      <p className="text-[10px] text-muted-foreground/70">Última: {formatDateTime(report.last_execution)}</p>
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
