import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, Trash2, Play, Square } from 'lucide-react';
import { useScheduledReports, useUpdateScheduledReport, useDeleteScheduledReport } from '@/hooks/useScheduledReports';
import { toast } from '@/hooks/use-toast';

export const ScheduleManagementPanel: React.FC = () => {
  const { data: reports = [] } = useScheduledReports();
  const updateReport = useUpdateScheduledReport();
  const deleteReport = useDeleteScheduledReport();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCron, setEditingCron] = useState('');

  const baculaReport = reports.find(r => r.name === 'Relatório Diário de Erros Bacula');
  const otherReports = reports.filter(r => r.name !== 'Relatório Diário de Erros Bacula');

  const handleUpdateCron = async (id: string, cronExpression: string) => {
    try {
      await updateReport.mutateAsync({
        id,
        updates: { cron_expression: cronExpression }
      });
      toast({
        title: "Horário atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
      setEditingId(null);
      setEditingCron('');
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o horário.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateReport.mutateAsync({
        id,
        updates: { is_active: !currentStatus }
      });
      toast({
        title: currentStatus ? "Agendamento pausado" : "Agendamento ativado",
        description: `O relatório foi ${currentStatus ? 'pausado' : 'ativado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do agendamento.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o agendamento "${name}"?`)) {
      try {
        await deleteReport.mutateAsync(id);
        toast({
          title: "Agendamento excluído",
          description: "O agendamento foi removido com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o agendamento.",
          variant: "destructive"
        });
      }
    }
  };

  const getCronDescription = (cronExpression: string) => {
    const parts = cronExpression.split(' ');
    if (parts.length >= 2) {
      const minute = parts[0];
      const hour = parts[1];
      const utcHour = parseInt(hour);
      const brasiliaHour = (utcHour - 3 + 24) % 24; // Convert UTC to Brasilia time
      return `${brasiliaHour.toString().padStart(2, '0')}:${minute.padStart(2, '0')} (Brasília)`;
    }
    return cronExpression;
  };

  return (
    <div className="space-y-6">
      {/* Bacula Report Section */}
      {baculaReport && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Relatório Bacula (Principal)
              </div>
              <Badge variant={baculaReport.is_active ? "default" : "secondary"}>
                {baculaReport.is_active ? "Ativo" : "Pausado"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-200">Nome</Label>
                <p className="text-white font-medium">{baculaReport.name}</p>
              </div>
              <div>
                <Label className="text-slate-200">Telefone</Label>
                <p className="text-white">{baculaReport.phone_number}</p>
              </div>
              <div>
                <Label className="text-slate-200">Horário Atual</Label>
                <div className="flex items-center gap-2">
                  {editingId === baculaReport.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingCron}
                        onChange={(e) => setEditingCron(e.target.value)}
                        placeholder="0 12 * * *"
                        className="bg-slate-600 border-slate-500 text-white max-w-32"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCron(baculaReport.id, editingCron)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditingCron('');
                        }}
                        className="border-slate-600"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-white">
                        {getCronDescription(baculaReport.cron_expression)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(baculaReport.id);
                          setEditingCron(baculaReport.cron_expression);
                        }}
                        className="border-slate-600"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-slate-200">Próxima Execução</Label>
                <p className="text-white">
                  {baculaReport.next_execution 
                    ? new Date(baculaReport.next_execution).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                    : 'Não agendado'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleToggleStatus(baculaReport.id, baculaReport.is_active)}
                variant={baculaReport.is_active ? "outline" : "default"}
                className={baculaReport.is_active 
                  ? "border-orange-600 text-orange-400 hover:bg-orange-900/20" 
                  : "bg-green-600 hover:bg-green-700"
                }
              >
                {baculaReport.is_active ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Reports Section */}
      {otherReports.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Outros Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {otherReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{report.name}</h4>
                    <p className="text-sm text-slate-300">
                      {getCronDescription(report.cron_expression)} • {report.phone_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.is_active ? "default" : "secondary"}>
                      {report.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleToggleStatus(report.id, report.is_active)}
                      variant="outline"
                      className="border-slate-600"
                    >
                      {report.is_active ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(report.id, report.name)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-950 border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-200 mb-2">💡 Configuração Recomendada</h4>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• Mantenha apenas um agendamento ativo para o Relatório Bacula</li>
            <li>• Use o formato: "0 12 * * *" para 9h da manhã (Brasília)</li>
            <li>• Exclua agendamentos duplicados para evitar múltiplos envios</li>
            <li>• Certifique-se de que a integração Bacula está configurada com autenticação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
