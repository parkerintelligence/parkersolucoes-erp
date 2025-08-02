import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeTabs, SafeTabsContent, SafeTabsList, SafeTabsTrigger } from '@/components/SafeTabsWrapper';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Plus, 
  BarChart3, 
  FileText,
  Activity,
  TrendingUp
} from 'lucide-react';
import { ScheduledReportForm } from '@/components/automation/ScheduledReportForm';
import { ScheduledReportsTable } from '@/components/automation/ScheduledReportsTable';
import { ReportsStatusPanel } from '@/components/automation/ReportsStatusPanel';
import { ReportsLogsPanel } from '@/components/automation/ReportsLogsPanel';
import { AutomationStats } from '@/components/automation/AutomationStats';
import { 
  useScheduledReports, 
  useCreateScheduledReport, 
  useUpdateScheduledReport, 
  useDeleteScheduledReport,
  useTestScheduledReport 
} from '@/hooks/useScheduledReports';
import { toast } from 'sonner';

export const ScheduledReportsPanel = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);

  const { data: reports = [], isLoading } = useScheduledReports();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();
  const deleteReport = useDeleteScheduledReport();
  const testReport = useTestScheduledReport();

  const handleCreate = async (reportData: any) => {
    try {
      await createReport.mutateAsync(reportData);
      setFormOpen(false);
      toast.success('Relatório agendado criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar relatório agendado');
    }
  };

  const handleUpdate = async (reportData: any) => {
    try {
      await updateReport.mutateAsync({
        id: editingReport.id,
        updates: reportData
      });
      setEditingReport(null);
      setFormOpen(false);
      toast.success('Relatório agendado atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar relatório agendado');
    }
  };

  const handleEdit = (report: any) => {
    setEditingReport(report);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
      toast.success('Relatório agendado removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover relatório agendado');
    }
  };

  const handleToggleActive = async (report: any) => {
    try {
      await updateReport.mutateAsync({
        id: report.id,
        updates: { is_active: !report.is_active }
      });
      toast.success(`Relatório ${!report.is_active ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status do relatório');
    }
  };

  const handleTestReport = async (reportId: string) => {
    try {
      await testReport.mutateAsync(reportId);
      toast.success('Teste de relatório enviado! Verifique os logs para mais detalhes.');
    } catch (error) {
      toast.error('Erro ao testar relatório');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Automação de Relatórios</h1>
          <p className="text-gray-300">
            Gerencie relatórios automáticos enviados via WhatsApp
          </p>
        </div>

        <SafeTabs defaultValue="reports" className="space-y-6">
          <SafeTabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <SafeTabsTrigger value="reports" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </SafeTabsTrigger>
            <SafeTabsTrigger value="status" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Status & Próximos
            </SafeTabsTrigger>
            <SafeTabsTrigger value="logs" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              Logs de Execução
            </SafeTabsTrigger>
            <SafeTabsTrigger value="stats" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </SafeTabsTrigger>
          </SafeTabsList>

          <SafeTabsContent value="reports" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    Relatórios Agendados
                  </CardTitle>
                  <Button onClick={() => setFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Relatório
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScheduledReportsTable 
                  reports={reports}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onTest={handleTestReport}
                  isTestingReport={testReport.isPending}
                />
              </CardContent>
            </Card>
          </SafeTabsContent>

          <SafeTabsContent value="status">
            <ReportsStatusPanel />
          </SafeTabsContent>

          <SafeTabsContent value="logs">
            <ReportsLogsPanel />
          </SafeTabsContent>

          <SafeTabsContent value="stats">
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
          </SafeTabsContent>
        </SafeTabs>

        <ScheduledReportForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) {
              setEditingReport(null);
            }
          }}
          onCreate={handleCreate}
          onUpdate={editingReport ? handleUpdate : undefined}
          initialData={editingReport}
          isLoading={createReport.isPending || updateReport.isPending}
        />
      </div>
    </div>
  );
};