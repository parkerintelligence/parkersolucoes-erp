import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, BarChart3, Cog, Zap } from 'lucide-react';
import { ScheduledReportsTable } from './automation/ScheduledReportsTable';
import { ScheduledReportForm } from './automation/ScheduledReportForm';
import { ReportsLogsPanel } from './automation/ReportsLogsPanel';
import { ReportsStatusPanel } from './automation/ReportsStatusPanel';
import { LazyAutomationStats } from './LazyAutomationStats';
import { AutomationProcessesPanel } from './automation/AutomationProcessesPanel';
import { useToast } from "@/hooks/use-toast";
import { useScheduledReports, useDeleteScheduledReport, useToggleScheduledReportActive, useTestScheduledReport } from '@/hooks/useScheduledReports';
import type { ScheduledReport } from '@/hooks/useScheduledReports';

const TABS = [
  { id: 'reports', label: 'Agendamentos', icon: Calendar },
  { id: 'processes', label: 'Processos', icon: Cog },
  { id: 'status', label: 'Status & Próximos', icon: BarChart3 },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
];

export const ScheduledReportsPanel = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [formOpen, setFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const { data: scheduledReports = [], isLoading } = useScheduledReports();
  const deleteReport = useDeleteScheduledReport();
  const toggleActive = useToggleScheduledReportActive();
  const testReport = useTestScheduledReport();
  const { toast } = useToast();

  const activeReports = scheduledReports.filter(r => r.is_active).length;

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try { await deleteReport.mutateAsync(id); }
    catch (error: any) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try { await toggleActive.mutateAsync({ id: report.id, is_active: report.is_active }); }
    catch (error: any) { toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" }); }
  };

  const handleTestReport = async (reportId: string) => {
    try {
      await testReport.mutateAsync(reportId);
      toast({ title: "Teste enviado", description: "O relatório de teste foi enviado para o número configurado." });
    } catch (error: any) {
      toast({ title: "Erro ao testar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3 p-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Automação de Relatórios</h1>
            <p className="text-xs text-muted-foreground">Gerencie relatórios automáticos via WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {scheduledReports.length} agendamentos
          </Badge>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {activeReports} ativos
          </Badge>
          {activeTab === 'reports' && (
            <Button onClick={() => setFormOpen(true)} size="sm" className="h-7 text-xs gap-1.5">
              <Plus className="h-3 w-3" /> Novo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs compactas */}
      <div className="flex gap-0.5 p-1 bg-muted/50 border border-border rounded-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex-1 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'reports' && (
        <div className="bg-card rounded-lg border border-border">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Relatórios Agendados</span>
          </div>
          <div className="p-3">
            <ScheduledReportsTable
              reports={scheduledReports}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onTest={handleTestReport}
              isTestingReport={testReport.isPending}
            />
          </div>
        </div>
      )}

      {activeTab === 'processes' && <AutomationProcessesPanel />}
      {activeTab === 'status' && <ReportsStatusPanel />}
      {activeTab === 'logs' && <ReportsLogsPanel />}

      {activeTab === 'stats' && (
        <div className="bg-card rounded-lg border border-border">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Estatísticas Detalhadas</span>
          </div>
          <div className="p-3">
            <LazyAutomationStats />
          </div>
        </div>
      )}

      <ScheduledReportForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingReport={editingReport}
        onSuccess={() => setEditingReport(null)}
      />
    </div>
  );
};
