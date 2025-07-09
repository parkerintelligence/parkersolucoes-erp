
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, BarChart3 } from 'lucide-react';
import { ScheduledReportsTable } from './automation/ScheduledReportsTable';
import { ScheduledReportForm } from './automation/ScheduledReportForm';
import { ReportsLogsPanel } from './automation/ReportsLogsPanel';
import { ReportsStatusPanel } from './automation/ReportsStatusPanel';
import { useToast } from "@/hooks/use-toast"
import { useScheduledReports, useDeleteScheduledReport, useToggleScheduledReportActive, useTestScheduledReport } from '@/hooks/useScheduledReports';
import type { ScheduledReport } from '@/hooks/useScheduledReports';

export const ScheduledReportsPanel = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Automação de Relatórios</h1>
          <p className="text-gray-600">
            Gerencie relatórios automáticos enviados via WhatsApp
          </p>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Status & Próximos
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs de Execução
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Relatórios Agendados
                  </CardTitle>
                  <Button onClick={() => setFormOpen(true)}>
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
          </TabsContent>

          <TabsContent value="status">
            <ReportsStatusPanel />
          </TabsContent>

          <TabsContent value="logs">
            <ReportsLogsPanel />
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Estatísticas detalhadas em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
