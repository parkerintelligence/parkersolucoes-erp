
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Edit, Trash2, Play, Pause, TestTube, 
  HardDrive, Calendar, ExternalLink
} from 'lucide-react';
import { ScheduledReport } from '@/hooks/useScheduledReports';

interface ScheduledReportsTableProps {
  reports: ScheduledReport[];
  onEdit: (report: ScheduledReport) => void;
  onDelete: (id: string) => void;
  onToggleActive: (report: ScheduledReport) => void;
  onTest: (reportId: string) => void;
  isTestingReport: boolean;
}

const reportTypes = {
  backup_alert: { 
    name: 'Alerta de Backups', 
    icon: HardDrive, 
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  schedule_critical: { 
    name: 'Vencimentos Críticos', 
    icon: Calendar, 
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  glpi_summary: { 
    name: 'Resumo GLPI', 
    icon: ExternalLink, 
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  }
};

export const ScheduledReportsTable = ({ 
  reports, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onTest, 
  isTestingReport 
}: ScheduledReportsTableProps) => {
  const getTypeBadge = (type: string) => {
    const reportType = reportTypes[type as keyof typeof reportTypes];
    if (!reportType) return null;
    
    const Icon = reportType.icon;
    return (
      <Badge className={`${reportType.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {reportType.name}
      </Badge>
    );
  };

  const formatNextExecution = (datetime: string) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString('pt-BR');
  };

  const formatCronExpression = (cron: string) => {
    // Parse cron expression para formato legível
    const parts = cron.split(' ');
    if (parts.length >= 5) {
      const minute = parts[0];
      const hour = parts[1];
      const dayOfWeek = parts[4];
      
      const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      
      if (dayOfWeek === '*') {
        return `${time} - Todo dia`;
      } else if (dayOfWeek === '1-5') {
        return `${time} - Seg-Sex`;
      } else if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(d => {
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          return dayNames[parseInt(d)] || d;
        });
        return `${time} - ${days.join(', ')}`;
      } else {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayName = dayNames[parseInt(dayOfWeek)] || dayOfWeek;
        return `${time} - ${dayName}`;
      }
    }
    
    return cron; // Fallback para mostrar a expressão original
  };

  const handleDeleteWithConfirm = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o agendamento "${name}"?`)) {
      onDelete(id);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
        <p className="text-sm">Crie seu primeiro agendamento automático de relatórios</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Telefone</TableHead>
              <TableHead className="font-semibold">Horário</TableHead>
              <TableHead className="font-semibold">Próxima Execução</TableHead>
              <TableHead className="font-semibold">Execuções</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{report.name}</TableCell>
                <TableCell>{getTypeBadge(report.report_type)}</TableCell>
                <TableCell className="font-mono text-sm">{report.phone_number}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{formatCronExpression(report.cron_expression)}</span>
                    <span className="text-xs text-gray-500 font-mono">{report.cron_expression}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{formatNextExecution(report.next_execution || '')}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{report.execution_count || 0}</Badge>
                </TableCell>
                <TableCell>
                  {report.is_active ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onTest(report.id)}
                      disabled={isTestingReport}
                      title="Testar agendamento"
                      className="h-8 w-8 p-0"
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onToggleActive(report)}
                      title={report.is_active ? "Pausar" : "Ativar"}
                      className="h-8 w-8 p-0"
                    >
                      {report.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEdit(report)}
                      title="Editar"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteWithConfirm(report.id, report.name)}
                      title="Excluir"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
