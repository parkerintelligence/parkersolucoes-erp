
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MessageCircle } from 'lucide-react';
import { 
  useScheduledReports, 
  useUpdateScheduledReport, 
  useDeleteScheduledReport,
  useTestScheduledReport,
  ScheduledReport 
} from '@/hooks/useScheduledReports';
import { toast } from '@/hooks/use-toast';
import WhatsAppTemplatesPanel from './WhatsAppTemplatesPanel';
import { ScheduledReportForm } from './automation/ScheduledReportForm';
import { ScheduledReportsTable } from './automation/ScheduledReportsTable';
import { AutomationStats } from './automation/AutomationStats';

const ScheduledReportsPanel = () => {
  const { data: reports = [], isLoading, refetch } = useScheduledReports();
  const updateReport = useUpdateScheduledReport();
  const deleteReport = useDeleteScheduledReport();
  const testReport = useTestScheduledReport();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);

  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await updateReport.mutateAsync({
        id: report.id,
        updates: { is_active: !report.is_active }
      });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    }
  };

  const handleTestReport = async (reportId: string) => {
    try {
      await testReport.mutateAsync(reportId);
    } catch (error) {
      console.error('Erro ao testar relatório:', error);
    }
  };

  const handleFormSuccess = () => {
    refetch();
    setEditingReport(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600">Carregando agendamentos...</div>
      </div>
    );
  }

  const activeReports = reports.filter(r => r.is_active);
  const inactiveReports = reports.filter(r => !r.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Automação WhatsApp
          </h2>
          <p className="text-muted-foreground">Configure relatórios automáticos e templates de mensagens</p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <AutomationStats reports={reports} />

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Ativos ({activeReports.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inativos ({inactiveReports.length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({reports.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos Ativos</CardTitle>
              <CardDescription>
                Relatórios que estão sendo executados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledReportsTable
                reports={activeReports}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                onToggleActive={handleToggleActive}
                onTest={handleTestReport}
                isTestingReport={testReport.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos Inativos</CardTitle>
              <CardDescription>
                Relatórios que foram pausados ou desativados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledReportsTable
                reports={inactiveReports}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                onToggleActive={handleToggleActive}
                onTest={handleTestReport}
                isTestingReport={testReport.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Agendamentos</CardTitle>
              <CardDescription>
                Lista completa de todos os relatórios agendados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledReportsTable
                reports={reports}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                onToggleActive={handleToggleActive}
                onTest={handleTestReport}
                isTestingReport={testReport.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <WhatsAppTemplatesPanel />
        </TabsContent>
      </Tabs>

      <ScheduledReportForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingReport={editingReport}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default ScheduledReportsPanel;
