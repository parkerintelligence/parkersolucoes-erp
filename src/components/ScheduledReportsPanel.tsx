
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, BarChart3 } from 'lucide-react';
import { ScheduledReportsTable } from './automation/ScheduledReportsTable';
import { ScheduledReportForm } from './automation/ScheduledReportForm';
import { ReportsLogsPanel } from './automation/ReportsLogsPanel';
import { ReportsStatusPanel } from './automation/ReportsStatusPanel';
import { AutomationStats } from './automation/AutomationStats';
import { ScheduleManagementPanel } from './automation/ScheduleManagementPanel';
import { BaculaStatusAlert } from './automation/BaculaStatusAlert';
import { useToast } from "@/hooks/use-toast"
import { useScheduledReports, useDeleteScheduledReport, useToggleScheduledReportActive, useTestScheduledReport } from '@/hooks/useScheduledReports';
import type { ScheduledReport } from '@/hooks/useScheduledReports';

export const ScheduledReportsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [formOpen, setFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  
  // Add error boundary for React Query hooks
  let scheduledReportsQuery;
  let deleteReport;
  let toggleActive;
  let testReport;
  
  try {
    scheduledReportsQuery = useScheduledReports();
    deleteReport = useDeleteScheduledReport();
    toggleActive = useToggleScheduledReportActive();
    testReport = useTestScheduledReport();
  } catch (error) {
    console.error('React Query context error:', error);
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Erro ao inicializar componente</div>
          <div className="text-gray-400 text-sm">
            Problema com o contexto do React Query. Recarregue a página.
          </div>
        </div>
      </div>
    );
  }
  
  const { data: scheduledReports = [], isLoading, error } = scheduledReportsQuery;
  const { toast } = useToast();

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      })
    }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await toggleActive.mutateAsync({ id: report.id, is_active: report.is_active });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive"
      })
    }
  };

  const handleTestReport = async (reportId: string) => {
    try {
      await testReport.mutateAsync(reportId);
      toast({
        title: "Teste enviado",
        description: "O relatório de teste foi enviado para o número configurado.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao testar",
        description: error.message,
        variant: "destructive"
      })
    }
  };

  const handleFormSuccess = () => {
    setEditingReport(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-gray-300">Carregando...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-red-400">Erro ao carregar dados: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Automação de Relatórios</h1>
          <p className="text-gray-300">
            Gerencie relatórios automáticos enviados via WhatsApp
          </p>
        </div>

        {scheduledReports && <BaculaStatusAlert />}

        <div className="space-y-6">
          {/* Custom Tab Navigation */}
          <div className="grid w-full grid-cols-5 bg-gray-800 border-gray-700 rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-medium transition-colors ${
                activeTab === 'reports' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Agendamentos
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-medium transition-colors ${
                activeTab === 'status' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Status & Próximos
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-medium transition-colors ${
                activeTab === 'logs' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FileText className="h-4 w-4" />
              Logs de Execução
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-medium transition-colors ${
                activeTab === 'manage' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Gerenciar
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-medium transition-colors ${
                activeTab === 'stats' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'reports' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    Relatórios Agendados
                  </CardTitle>
                  <Button onClick={() => setFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
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

          {activeTab === 'status' && (
            <ReportsStatusPanel />
          )}

          {activeTab === 'logs' && (
            <ReportsLogsPanel />
          )}

          {activeTab === 'manage' && (
            <ScheduleManagementPanel />
          )}

          {activeTab === 'stats' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Estatísticas Detalhadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AutomationStats />
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
    </div>
  );
};
