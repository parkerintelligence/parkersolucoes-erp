
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Edit, Trash2, Clock, Play, Pause, Calendar, 
  AlertTriangle, Settings, ExternalLink, CheckCircle2
} from 'lucide-react';
import { 
  useGLPIScheduledTickets, 
  useUpdateGLPIScheduledTicket, 
  useDeleteGLPIScheduledTicket,
  GLPIScheduledTicket 
} from '@/hooks/useGLPIScheduledTickets';
import { GLPIScheduledTicketForm } from './GLPIScheduledTicketForm';
import { useGLPI } from '@/hooks/useGLPI';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const GLPIScheduledTicketsView = () => {
  const { data: scheduledTickets = [], isLoading, refetch } = useGLPIScheduledTickets();
  const { glpiIntegration } = useGLPI();
  const updateTicket = useUpdateGLPIScheduledTicket();
  const deleteTicket = useDeleteGLPIScheduledTicket();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<GLPIScheduledTicket | null>(null);

  const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
    1: { label: 'Muito Baixa', color: 'bg-gray-100 text-gray-800' },
    2: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
    3: { label: 'Média', color: 'bg-green-100 text-green-800' },
    4: { label: 'Alta', color: 'bg-yellow-100 text-yellow-800' },
    5: { label: 'Muito Alta', color: 'bg-orange-100 text-orange-800' },
    6: { label: 'Crítica', color: 'bg-red-100 text-red-800' },
  };

  const formatNextExecution = (datetime: string) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString('pt-BR');
  };

  const formatCronExpression = (cron: string) => {
    const cronMap: Record<string, string> = {
      '0 6 * * *': '6:00 - Todo dia',
      '0 9 * * *': '9:00 - Todo dia',
      '0 12 * * *': '12:00 - Todo dia',
      '0 18 * * *': '18:00 - Todo dia',
      '0 8 * * 1-5': '8:00 - Segunda a Sexta',
      '0 9 * * 1-5': '9:00 - Segunda a Sexta',
      '0 6 * * 1': '6:00 - Toda Segunda',
      '0 9 * * 0': '9:00 - Todo Domingo',
    };
    return cronMap[cron] || cron;
  };

  const handleToggleActive = async (ticket: GLPIScheduledTicket) => {
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        updates: { is_active: !ticket.is_active }
      });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deleteTicket.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
      }
    }
  };

  const handleEditTicket = (ticket: GLPIScheduledTicket) => {
    setEditingTicket(ticket);
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTicket(null);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    setIsDialogOpen(false);
    setEditingTicket(null);
    refetch();
  };

  const handleTestCron = async () => {
    try {
      console.log('🧪 [GLPI-TEST] Iniciando teste manual do agendamento...');
      
      const { data, error } = await supabase.functions.invoke('process-glpi-scheduled-tickets', {
        body: { 
          debug: true, 
          manual_test: true,
          time: new Date().toISOString()
        }
      });
      
      if (error) {
        console.error('❌ [GLPI-TEST] Erro na função:', error);
        toast({
          title: "Erro na função",
          description: error.message || "Erro ao executar função de teste",
          variant: "destructive"
        });
        return;
      }
      
      console.log('📋 [GLPI-TEST] Resultado:', data);
      
      if (data?.success) {
        toast({
          title: "Teste executado com sucesso!",
          description: `${data.executed_tickets} chamados processados. ${data.successful} sucessos, ${data.failed} falhas.`,
        });
        
        // Mostrar detalhes dos resultados se houver falhas
        if (data.failed > 0 && data.results) {
          const failedTickets = data.results.filter((r: any) => !r.success);
          console.warn('⚠️ [GLPI-TEST] Chamados com falha:', failedTickets);
        }
      } else {
        toast({
          title: "Erro no teste",
          description: data?.message || "Falha na execução do teste",
          variant: "destructive"
        });
      }
      
      refetch();
    } catch (error) {
      console.error('❌ [GLPI-TEST] Erro ao testar agendamento:', error);
      toast({
        title: "Erro na comunicação",
        description: "Erro ao executar teste manual",
        variant: "destructive"
      });
    }
  };

  if (!glpiIntegration) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ExternalLink className="h-5 w-5" />
              Agenda de Chamados GLPI
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure agendamentos automáticos para criação de chamados no GLPI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-yellow-200 mb-2">GLPI não configurado</p>
              <p className="text-yellow-300 mb-4">
                Para usar esta funcionalidade, configure primeiro a integração com o GLPI na área de administração.
              </p>
              <Button variant="outline" className="bg-orange-800 hover:bg-orange-700 text-white border-orange-600">
                <Settings className="mr-2 h-4 w-4" />
                Configurar GLPI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-400">Carregando agendamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">Agenda de Chamados GLPI</h3>
            <p className="text-sm text-gray-400">
              Configure agendamentos automáticos para criação de chamados no GLPI
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleTestCron}
              variant="outline"
              className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Testar Agendamentos
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingTicket ? 'Editar Agendamento' : 'Novo Agendamento de Chamado'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure um agendamento automático para criação de chamados no GLPI
                </DialogDescription>
              </DialogHeader>
              <GLPIScheduledTicketForm
                editingTicket={editingTicket}
                onSave={handleSave}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{scheduledTickets.length}</p>
                  <p className="text-sm text-gray-400">Total de Agendamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {scheduledTickets.filter(t => t.is_active).length}
                  </p>
                  <p className="text-sm text-gray-400">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {scheduledTickets.reduce((sum, t) => sum + t.execution_count, 0)}
                  </p>
                  <p className="text-sm text-gray-400">Total de Execuções</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Agendamentos Configurados</CardTitle>
            <CardDescription className="text-gray-400">
              Lista de todos os agendamentos automáticos de chamados no GLPI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p className="text-lg font-medium mb-2 text-white">Nenhum agendamento configurado</p>
                <p className="mb-4">Crie seu primeiro agendamento automático de chamados.</p>
                <Button onClick={handleCreateNew} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Agendamento
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Nome</TableHead>
                    <TableHead className="text-gray-300">Título do Chamado</TableHead>
                    <TableHead className="text-gray-300">Prioridade</TableHead>
                    <TableHead className="text-gray-300">Horário</TableHead>
                    <TableHead className="text-gray-300">Próxima Execução</TableHead>
                    <TableHead className="text-gray-300">Execuções</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-gray-700">
                      <TableCell className="font-medium text-white">{ticket.name}</TableCell>
                      <TableCell className="text-white">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_MAP[ticket.priority]?.color || 'bg-gray-100 text-gray-800'}>
                          {PRIORITY_MAP[ticket.priority]?.label || `Prioridade ${ticket.priority}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{formatCronExpression(ticket.cron_expression)}</TableCell>
                      <TableCell className="text-white">{formatNextExecution(ticket.next_execution || '')}</TableCell>
                      <TableCell className="text-white">{ticket.execution_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={ticket.is_active}
                            onCheckedChange={() => handleToggleActive(ticket)}
                          />
                          <span className="text-sm text-white">
                            {ticket.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditTicket(ticket)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300 border-gray-600 hover:bg-gray-700"
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GLPIScheduledTicketsView;
