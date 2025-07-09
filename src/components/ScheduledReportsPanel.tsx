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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledReport } from '@/hooks/useScheduledReports';

interface UseScheduledReportsProps {
  initialData?: ScheduledReport[];
}

const fetchScheduledReports = async (): Promise<ScheduledReport[]> => {
  const { data, error } = await supabase
    .from('scheduled_reports')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching scheduled reports:", error);
    throw error;
  }

  return data || [];
};

export const useScheduledReports = ({ initialData }: UseScheduledReportsProps = {}) => {
  return useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: fetchScheduledReports,
    initialData: initialData,
  });
};

export const useCreateScheduledReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(
    async (newReport: Omit<ScheduledReport, 'id'>) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert([newReport]);

      if (error) {
        console.error("Error creating scheduled report:", error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scheduled-reports']);
        toast({
          title: "Agendamento criado",
          description: "Novo agendamento criado com sucesso.",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao criar agendamento",
          description: error.message,
          variant: "destructive"
        })
      },
    }
  );
};

export const useUpdateScheduledReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(
    async ({ id, updates }: { id: string; updates: Partial<ScheduledReport> }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error("Error updating scheduled report:", error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scheduled-reports']);
        toast({
          title: "Agendamento atualizado",
          description: "Agendamento atualizado com sucesso.",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao atualizar agendamento",
          description: error.message,
          variant: "destructive"
        })
      },
    }
  );
};

export const useDeleteScheduledReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(
    async (id: string) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting scheduled report:", error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scheduled-reports']);
        toast({
          title: "Agendamento excluído",
          description: "Agendamento excluído com sucesso.",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao excluir agendamento",
          description: error.message,
          variant: "destructive"
        })
      },
    }
  );
};

export const useToggleScheduledReportActive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(
    async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !is_active })
        .eq('id', id);

      if (error) {
        console.error("Error toggling scheduled report active:", error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scheduled-reports']);
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao alterar status",
          description: error.message,
          variant: "destructive"
        })
      },
    }
  );
};

export const useTestScheduledReport = () => {
  return useMutation(
    async (reportId: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-scheduled-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report_id: reportId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao testar agendamento');
      }

      return response.json();
    }
  );
};

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
