
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Clock, 
  Calendar,
  ExternalLink,
  Power,
  Settings
} from 'lucide-react';
import { useGLPIScheduledTickets, useDeleteGLPIScheduledTicket, useUpdateGLPIScheduledTicket, useTestScheduledReport, GLPIScheduledTicket } from '@/hooks/useGLPIScheduledTickets';
import { GLPIScheduledTicketForm } from '@/components/GLPIScheduledTicketForm';
import { toast } from '@/hooks/use-toast';

const GLPIScheduledTicketsView = () => {
  const { data: scheduledTickets = [], isLoading } = useGLPIScheduledTickets();
  const deleteTicket = useDeleteGLPIScheduledTicket();
  const updateTicket = useUpdateGLPIScheduledTicket();
  const testReport = useTestScheduledReport();

  const [showDialog, setShowDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState<GLPIScheduledTicket | null>(null);

  const handleEdit = (ticket: GLPIScheduledTicket) => {
    setEditingTicket(ticket);
    setShowDialog(true);
  };

  const handleDelete = async (ticketId: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteTicket.mutateAsync(ticketId);
    }
  };

  const handleToggleActive = async (ticket: GLPIScheduledTicket) => {
    await updateTicket.mutateAsync({
      id: ticket.id,
      updates: { is_active: !ticket.is_active }
    });
  };

  const handleTest = async (ticketId: string) => {
    try {
      await testReport.mutateAsync(ticketId);
    } catch (error) {
      console.error('Erro no teste:', error);
    }
  };

  const formatCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length >= 5) {
      const minute = parts[0];
      const hour = parts[1];
      const dayOfWeek = parts[4];
      
      let timeStr = `${hour}:${minute.padStart(2, '0')}`;
      let dayStr = '';
      
      if (dayOfWeek === '*') {
        dayStr = 'Todos os dias';
      } else if (dayOfWeek === '1-5') {
        dayStr = 'Seg-Sex';
      } else {
        dayStr = `Dia ${dayOfWeek}`;
      }
      
      return `${timeStr} - ${dayStr}`;
    }
    return cron;
  };

  const getNextExecution = (ticket: GLPIScheduledTicket) => {
    if (ticket.next_execution) {
      return new Date(ticket.next_execution).toLocaleString('pt-BR');
    }
    return 'Não calculado';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="text-center">
          <div className="text-gray-400">Carregando agendamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Chamados Agendados</h1>
              <p className="text-gray-400">
                Gerencie chamados automáticos no GLPI
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setEditingTicket(null);
              setShowDialog(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{scheduledTickets.length}</p>
                  <p className="text-sm text-gray-400">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-400" />
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
                <Pause className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {scheduledTickets.filter(t => !t.is_active).length}
                  </p>
                  <p className="text-sm text-gray-400">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {scheduledTickets.reduce((sum, t) => sum + t.execution_count, 0)}
                  </p>
                  <p className="text-sm text-gray-400">Execuções</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de Agendamentos</CardTitle>
            <CardDescription className="text-gray-400">
              Gerencie seus chamados automáticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledTickets.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-medium text-gray-400">Nenhum agendamento encontrado</p>
                <p className="text-sm text-gray-500 mb-4">Configure seus primeiros chamados automáticos.</p>
                <Button 
                  onClick={() => {
                    setEditingTicket(null);
                    setShowDialog(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
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
                    <TableHead className="text-gray-300">Horário</TableHead>
                    <TableHead className="text-gray-300">Próxima Execução</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Execuções</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-gray-700 hover:bg-gray-750">
                      <TableCell className="font-medium text-white">{ticket.name}</TableCell>
                      <TableCell className="text-gray-300">{ticket.title}</TableCell>
                      <TableCell className="text-gray-300">
                        {formatCronExpression(ticket.cron_expression)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {getNextExecution(ticket)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={ticket.is_active ? "default" : "secondary"}
                          className={ticket.is_active ? "bg-green-600" : "bg-gray-600"}
                        >
                          {ticket.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {ticket.execution_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(ticket)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(ticket)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {ticket.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTest(ticket.id)}
                            disabled={testReport.isPending}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(ticket.id)}
                            disabled={deleteTicket.isPending}
                            className="border-gray-600 text-red-400 hover:bg-red-900"
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

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTicket ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </DialogHeader>
            <GLPIScheduledTicketForm
              editingTicket={editingTicket}
              onSave={() => {
                setShowDialog(false);
                setEditingTicket(null);
              }}
              onCancel={() => {
                setShowDialog(false);
                setEditingTicket(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GLPIScheduledTicketsView;
