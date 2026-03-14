
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, BarChart3, Cog } from 'lucide-react';
import { ScheduledReportsTable } from './automation/ScheduledReportsTable';
import { ScheduledReportForm } from './automation/ScheduledReportForm';
import { ReportsLogsPanel } from './automation/ReportsLogsPanel';
import { ReportsStatusPanel } from './automation/ReportsStatusPanel';
import { LazyAutomationStats } from './LazyAutomationStats';
import { AutomationProcessesPanel } from './automation/AutomationProcessesPanel';
import { useToast } from "@/hooks/use-toast"
import { useScheduledReports, useDeleteScheduledReport, useToggleScheduledReportActive, useTestScheduledReport } from '@/hooks/useScheduledReports';
import type { ScheduledReport } from '@/hooks/useScheduledReports';

export const ScheduledReportsPanel = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [formOpen, setFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const { data: scheduledReports = [], isLoading, error } = useScheduledReports();
  const deleteReport = useDeleteScheduledReport();
  const toggleActive = useToggleScheduledReportActive();
  const testReport = useTestScheduledReport();
  const { toast } = useToast();

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" })
    }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await toggleActive.mutateAsync({ id: report.id, is_active: report.is_active });
    } catch (error: any) {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" })
    }
  };

  const handleTestReport = async (reportId: string) => {
    try {
      await testReport.mutateAsync(reportId);
      toast({ title: "Teste enviado", description: "O relatório de teste foi enviado para o número configurado." })
    } catch (error: any) {
      toast({ title: "Erro ao testar", description: error.message, variant: "destructive" })
    }
  };

  const handleFormSuccess = () => {
    setEditingReport(null);
  };

  const tabs = [
    { id: 'reports', label: 'Agendamentos', icon: Calendar },
    { id: 'processes', label: 'Processos', icon: Cog },
    { id: 'status', label: 'Status & Próximos', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cog className="h-5 w-5 text-primary" />
            Automação de Relatórios
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie relatórios automáticos enviados via WhatsApp
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted/50 border border-border rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-medium transition-colors flex-1 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'reports' && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  Relatórios Agendados
                </CardTitle>
                <Button onClick={() => setFormOpen(true)} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Novo Agendamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScheduledReportsTable
                reports={scheduledReports}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onTest={handleTestReport}
                isTestingReport={testReport.isPending}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'processes' && <AutomationProcessesPanel />}
        {activeTab === 'status' && <ReportsStatusPanel />}
        {activeTab === 'logs' && <ReportsLogsPanel />}

        {activeTab === 'stats' && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                Estatísticas Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LazyAutomationStats />
            </CardContent>
          </Card>
        )}
      </div>

      <ScheduledReportForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingReport={editingReport}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};
