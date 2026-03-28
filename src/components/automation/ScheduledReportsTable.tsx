
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, Trash2, Play, Pause, TestTube, 
  Calendar, MessageCircle, HardDrive, ExternalLink, AlertTriangle 
} from 'lucide-react';
import { ScheduledReport } from '@/hooks/useScheduledReports';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';

interface ScheduledReportsTableProps {
  reports: ScheduledReport[];
  onEdit: (report: ScheduledReport) => void;
  onDelete: (id: string) => void;
  onToggleActive: (report: ScheduledReport) => void;
  onTest: (reportId: string) => void;
  isTestingReport: boolean;
}

const templateTypeIcons = {
  backup_alert: HardDrive,
  ftp_backup_summary: HardDrive,
  schedule_critical: Calendar,
  glpi_summary: ExternalLink,
  custom: MessageCircle,
  bacula_daily: HardDrive,
  bacula_daily_report: HardDrive,
  mikrotik_dashboard: MessageCircle
};

export const ScheduledReportsTable = ({ 
  reports, onEdit, onDelete, onToggleActive, onTest, isTestingReport 
}: ScheduledReportsTableProps) => {
  const { data: templates = [] } = useWhatsAppTemplates();

  const getTemplateInfo = (reportType: string) => {
    const template = templates.find(t => t.id === reportType);
    if (template) return { name: template.name, type: template.template_type, isActive: template.is_active, exists: true };
    return { name: 'Template não encontrado', type: 'unknown', isActive: false, exists: false };
  };

  const formatNextExecution = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'Vencido';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Em ${diffHours}h`;
    return `Em ${Math.floor(diffMs / (1000 * 60))}min`;
  };

  const formatCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length < 5) return cron;
    const minute = parseInt(parts[0]) || 0;
    const hour = parseInt(parts[1]) || 0;
    const dayPart = parts[4];
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (dayPart === '*') return `Diário às ${timeString}`;
    if (dayPart === '1-5') return `Seg-Sex às ${timeString}`;
    const dayMap: { [key: string]: string } = { '0': 'Dom', '1': 'Seg', '2': 'Ter', '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb' };
    if (dayMap[dayPart]) return `${dayMap[dayPart]} às ${timeString}`;
    if (dayPart.includes(',')) {
      const days = dayPart.split(',').map(d => dayMap[d.trim()] || d);
      return `${days.join(', ')} às ${timeString}`;
    }
    return `${timeString} (${dayPart})`;
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <h3 className="text-sm font-medium text-foreground mb-1">Nenhum agendamento encontrado</h3>
        <p className="text-xs text-muted-foreground">Crie seu primeiro agendamento de relatório automático.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
            <TableHead className="text-muted-foreground text-xs">Template</TableHead>
            <TableHead className="text-muted-foreground text-xs">Telefone</TableHead>
            <TableHead className="text-muted-foreground text-xs">Horário</TableHead>
            <TableHead className="text-muted-foreground text-xs">Próxima Execução</TableHead>
            <TableHead className="text-muted-foreground text-xs">Status</TableHead>
            <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const templateInfo = getTemplateInfo(report.report_type);
            const Icon = templateTypeIcons[templateInfo.type as keyof typeof templateTypeIcons] || MessageCircle;
            
            return (
              <TableRow key={report.id} className="border-border/50 hover:bg-muted/20">
                <TableCell className="py-1">
                  <div>
                    <span className="text-xs font-medium text-foreground">{report.name}</span>
                    <p className="text-[11px] text-muted-foreground">{report.execution_count} execuções</p>
                  </div>
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-foreground">{templateInfo.name}</span>
                        {!templateInfo.exists && <AlertTriangle className="h-2.5 w-2.5 text-destructive" />}
                        {templateInfo.exists && !templateInfo.isActive && <AlertTriangle className="h-2.5 w-2.5 text-yellow-500" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{templateInfo.type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-1 text-xs text-muted-foreground font-mono">{report.phone_number}</TableCell>
                <TableCell className="py-1 text-xs text-muted-foreground">{formatCronExpression(report.cron_expression)}</TableCell>
                <TableCell className="py-1">
                  <span className="text-xs text-muted-foreground">{formatNextExecution(report.next_execution)}</span>
                  {report.next_execution && (
                    <p className="text-[10px] text-muted-foreground/70">{new Date(report.next_execution).toLocaleString('pt-BR')}</p>
                  )}
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex flex-col gap-0.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${report.is_active ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground'}`}>
                      {report.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {!templateInfo.exists && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">Template perdido</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="outline" size="sm" onClick={() => onToggleActive(report)} className="h-6 w-6 p-0" title={report.is_active ? 'Desativar' : 'Ativar'}>
                      {report.is_active ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onTest(report.id)} disabled={isTestingReport || !templateInfo.exists || !templateInfo.isActive} className="h-6 w-6 p-0" title="Testar">
                      <TestTube className="h-2.5 w-2.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(report)} className="h-6 w-6 p-0" title="Editar">
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(report.id)} className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" title="Excluir">
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
