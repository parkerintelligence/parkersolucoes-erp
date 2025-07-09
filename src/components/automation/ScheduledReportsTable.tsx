
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
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
        <h3 className="text-lg font-medium text-white mb-2">Nenhum agendamento encontrado</h3>
        <p className="text-gray-400">
          Crie seu primeiro agendamento de relatório automático.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-700 border-gray-600 hover:bg-gray-700">
            <TableHead className="font-semibold text-gray-200">Nome</TableHead>
            <TableHead className="font-semibold text-gray-200">Template</TableHead>
            <TableHead className="font-semibold text-gray-200">Telefone</TableHead>
            <TableHead className="font-semibold text-gray-200">Horário</TableHead>
            <TableHead className="font-semibold text-gray-200">Próxima Execução</TableHead>
            <TableHead className="font-semibold text-gray-200">Status</TableHead>
            <TableHead className="font-semibold text-gray-200">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const templateInfo = getTemplateInfo(report.report_type);
            const Icon = templateTypeIcons[templateInfo.type as keyof typeof templateTypeIcons] || MessageCircle;
            
            return (
              <TableRow key={report.id} className="hover:bg-gray-700 border-gray-600">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{report.name}</span>
                    <span className="text-xs text-gray-400">
                      {report.execution_count} execuções
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{templateInfo.name}</span>
                        {!templateInfo.exists && (
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                        )}
                        {templateInfo.exists && !templateInfo.isActive && (
                          <AlertTriangle className="h-3 w-3 text-orange-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{templateInfo.type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-300">
                  {report.phone_number}
                </TableCell>
                <TableCell className="text-sm text-gray-300">
                  {formatCronExpression(report.cron_expression)}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-300">
                    {formatNextExecution(report.next_execution)}
                  </span>
                  {report.next_execution && (
                    <div className="text-xs text-gray-400">
                      {new Date(report.next_execution).toLocaleString('pt-BR')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {report.is_active ? (
                      <Badge className="bg-green-600 text-white border-green-500">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-600 text-gray-200 border-gray-500">
                        Inativo
                      </Badge>
                    )}
                    {!templateInfo.exists && (
                      <Badge variant="destructive" className="text-xs bg-red-600 text-white">
                        Template perdido
                      </Badge>
                    )}
                    {templateInfo.exists && !templateInfo.isActive && (
                      <Badge className="text-xs bg-orange-600 text-white">
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
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
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
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(report)}
                      title="Editar"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(report.id)}
                      className="border-gray-600 text-red-400 hover:bg-red-600 hover:text-white"
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
