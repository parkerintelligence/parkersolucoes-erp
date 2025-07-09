
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
  schedule_critical: Calendar,
  glpi_summary: ExternalLink,
  custom: MessageCircle
};

export const ScheduledReportsTable = ({ 
  reports, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onTest, 
  isTestingReport 
}: ScheduledReportsTableProps) => {
  const { data: templates = [] } = useWhatsAppTemplates();

  const getTemplateInfo = (reportType: string) => {
    const template = templates.find(t => t.id === reportType);
    if (template) {
      return {
        name: template.name,
        type: template.template_type,
        isActive: template.is_active,
        exists: true
      };
    }
    
    // Fallback para casos onde o template não foi encontrado
    return {
      name: 'Template não encontrado',
      type: 'unknown',
      isActive: false,
      exists: false
    };
  };

  const formatNextExecution = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Vencido';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Em ${diffHours}h`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Em ${diffMinutes}min`;
    }
  };

  const formatCronExpression = (cron: string) => {
    const cronMap: { [key: string]: string } = {
      '0 9 * * *': 'Diário às 9:00',
      '0 8 * * *': 'Diário às 8:00',
      '0 12 * * *': 'Diário às 12:00',
      '0 18 * * *': 'Diário às 18:00',
      '0 9 * * 1-5': 'Seg-Sex às 9:00',
      '0 8 * * 1-5': 'Seg-Sex às 8:00',
      '0 9 * * 1': 'Segundas às 9:00',
      '0 9 * * 0': 'Domingos às 9:00'
    };
    
    return cronMap[cron] || cron;
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
        <p className="text-gray-500">
          Crie seu primeiro agendamento de relatório automático.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Nome</TableHead>
            <TableHead className="font-semibold">Template</TableHead>
            <TableHead className="font-semibold">Telefone</TableHead>
            <TableHead className="font-semibold">Horário</TableHead>
            <TableHead className="font-semibold">Próxima Execução</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const templateInfo = getTemplateInfo(report.report_type);
            const Icon = templateTypeIcons[templateInfo.type as keyof typeof templateTypeIcons] || MessageCircle;
            
            return (
              <TableRow key={report.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{report.name}</span>
                    <span className="text-xs text-gray-500">
                      {report.execution_count} execuções
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{templateInfo.name}</span>
                        {!templateInfo.exists && (
                          <AlertTriangle className="h-3 w-3 text-red-500" title="Template não encontrado" />
                        )}
                        {templateInfo.exists && !templateInfo.isActive && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" title="Template inativo" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{templateInfo.type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {report.phone_number}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCronExpression(report.cron_expression)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatNextExecution(report.next_execution)}
                  </span>
                  {report.next_execution && (
                    <div className="text-xs text-gray-500">
                      {new Date(report.next_execution).toLocaleString('pt-BR')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {report.is_active ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        Inativo
                      </Badge>
                    )}
                    {!templateInfo.exists && (
                      <Badge variant="destructive" className="text-xs">
                        Template perdido
                      </Badge>
                    )}
                    {templateInfo.exists && !templateInfo.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Template inativo
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleActive(report)}
                      title={report.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {report.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTest(report.id)}
                      disabled={isTestingReport || !templateInfo.exists || !templateInfo.isActive}
                      title={
                        !templateInfo.exists ? 'Template não encontrado' :
                        !templateInfo.isActive ? 'Template inativo' :
                        'Testar envio'
                      }
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(report)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(report.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
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
