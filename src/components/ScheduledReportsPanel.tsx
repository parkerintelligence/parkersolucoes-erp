
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, BarChart3 } from 'lucide-react';
import { ScheduledReportsTable } from './automation/ScheduledReportsTable';
import { ScheduledReportForm } from './automation/ScheduledReportForm';
import { ReportsLogsPanel } from './automation/ReportsLogsPanel';
import { ReportsStatusPanel } from './automation/ReportsStatusPanel';
import { AutomationStats } from './automation/AutomationStats';
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
      await toggleActive.mutateAsync({ id: report.id, is_active: !report.is_active });
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
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Automação de Relatórios</h1>
          <p className="text-gray-300">
            Gerencie relatórios automáticos enviados via WhatsApp
          </p>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="reports" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Status & Próximos
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              Logs de Execução
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="status">
            <ReportsStatusPanel />
          </TabsContent>

          <TabsContent value="logs">
            <ReportsLogsPanel />
          </TabsContent>

          <TabsContent value="stats">
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
