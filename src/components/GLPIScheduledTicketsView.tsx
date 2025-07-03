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

  if (!glpiIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Agenda de Chamados GLPI
          </CardTitle>
          <CardDescription>
            Configure agendamentos automáticos para criação de chamados no GLPI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">GLPI não configurado</p>
            <p className="text-gray-600 mb-4">
              Para usar esta funcionalidade, configure primeiro a integração com o GLPI na área de administração.
            </p>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurar GLPI
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Agenda de Chamados GLPI</h3>
          <p className="text-sm text-muted-foreground">
            Configure agendamentos automáticos para criação de chamados no GLPI
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? 'Editar Agendamento' : 'Novo Agendamento de Chamado'}
              </DialogTitle>
              <DialogDescription>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{scheduledTickets.length}</p>
                <p className="text-sm text-blue-600">Total de Agendamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {scheduledTickets.filter(t => t.is_active).length}
                </p>
                <p className="text-sm text-blue-600">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {scheduledTickets.reduce((sum, t) => sum + t.execution_count, 0)}
                </p>
                <p className="text-sm text-blue-600">Total de Execuções</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Configurados</CardTitle>
          <CardDescription>
            Lista de todos os agendamentos automáticos de chamados no GLPI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum agendamento configurado</p>
              <p className="mb-4">Crie seu primeiro agendamento automático de chamados.</p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Agendamento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Título do Chamado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Execuções</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.name}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_MAP[ticket.priority]?.color || 'bg-gray-100 text-gray-800'}>
                        {PRIORITY_MAP[ticket.priority]?.label || `Prioridade ${ticket.priority}`}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCronExpression(ticket.cron_expression)}</TableCell>
                    <TableCell>{formatNextExecution(ticket.next_execution || '')}</TableCell>
                    <TableCell>{ticket.execution_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ticket.is_active}
                          onCheckedChange={() => handleToggleActive(ticket)}
                        />
                        <span className="text-sm">
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
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
  );
};

export default GLPIScheduledTicketsView;