import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  CheckCheck
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPITicketConfirmDialog } from './GLPITicketConfirmDialog';
import { GLPINewTicketDialog } from './GLPINewTicketDialog';
import { GLPIRemoteAccessDialog } from './GLPIRemoteAccessDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface GLPITicketsGridProps {
  filters?: any;
}

const GLPITicketsGrid = ({ filters = {} }: GLPITicketsGridProps) => {
  const { 
    tickets, 
    getStatusText, 
    getPriorityText, 
    deleteTicket, 
    updateTicket,
    users,
    entities,
    itilCategories
  } = useGLPIExpanded();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);
  const [remoteAccessDialogOpen, setRemoteAccessDialogOpen] = useState(false);
  const [selectedTicketForRemote, setSelectedTicketForRemote] = useState<any>(null);
  const [showOpenOnly, setShowOpenOnly] = useState(true);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-blue-600 text-white';
      case 2: return 'bg-yellow-600 text-white';
      case 3: return 'bg-orange-600 text-white';
      case 4: return 'bg-purple-600 text-white';
      case 5: return 'bg-green-600 text-white';
      case 6: return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-600 text-white';
      case 2: return 'bg-blue-600 text-white';
      case 3: return 'bg-green-600 text-white';
      case 4: return 'bg-yellow-600 text-white';
      case 5: return 'bg-orange-600 text-white';
      case 6: return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return <Clock className="h-4 w-4" />;
      case 2: return <User className="h-4 w-4" />;
      case 3: return <AlertTriangle className="h-4 w-4" />;
      case 4: return <Clock className="h-4 w-4" />;
      case 5: return <CheckCircle className="h-4 w-4" />;
      case 6: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (ticketToDelete) {
      try {
        await deleteTicket.mutateAsync(ticketToDelete.id);
        setTicketToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir chamado:', error);
      }
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    try {
      await updateTicket.mutateAsync({
        id: ticketId,
        updates: { status: 5 } // Status 5 = Solucionado
      });
    } catch (error) {
      console.error('Erro ao encerrar chamado:', error);
    }
  };

  const getUserName = (userId: number) => {
    if (!userId || !users.data) return '-';
    const user = users.data.find((u: any) => u.id === userId);
    return user ? `${user.firstname || ''} ${user.realname || ''}`.trim() || user.name : '-';
  };

  const getEntityName = (entityId: number) => {
    if (!entityId || !entities.data) return '-';
    const entity = entities.data.find((e: any) => e.id === entityId);
    return entity?.name || '-';
  };

  const getCategoryName = (categoryId: number) => {
    if (!categoryId || !itilCategories.data) return '-';
    const category = itilCategories.data.find((c: any) => c.id === categoryId);
    return category?.name || category?.completename || '-';
  };

  const getEntityColor = (entityId: number) => {
    const colors = [
      'bg-blue-900/30 text-blue-300',
      'bg-purple-900/30 text-purple-300',
      'bg-green-900/30 text-green-300',
      'bg-yellow-900/30 text-yellow-300',
      'bg-orange-900/30 text-orange-300',
      'bg-pink-900/30 text-pink-300',
      'bg-indigo-900/30 text-indigo-300',
      'bg-cyan-900/30 text-cyan-300',
    ];
    return colors[entityId % colors.length];
  };

  if (tickets.isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Carregando chamados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar chamados: {tickets.error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar tickets baseado no toggle
  const ticketsList = Array.isArray(tickets.data) 
    ? tickets.data.filter((ticket: any) => {
        // Se showOpenOnly for true, mostra apenas tickets não solucionados e não fechados
        if (showOpenOnly) {
          return ticket.status !== 5 && ticket.status !== 6;
        }
        return true;
      })
    : [];

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Chamados GLPI</CardTitle>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              Apenas chamados em aberto
            </label>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsNewTicketDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Chamado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ticketsList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
              <p>Não há chamados disponíveis no momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Título</TableHead>
                  <TableHead className="text-gray-300">Técnico</TableHead>
                  <TableHead className="text-gray-300">Categoria</TableHead>
                  <TableHead className="text-gray-300">Entidade</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Prioridade</TableHead>
                  <TableHead className="text-gray-300">Data</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsList.map((ticket: any) => (
                  <TableRow key={ticket.id} className="border-gray-700">
                    <TableCell className="text-gray-300 font-mono py-2">
                      #{ticket.id}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">{ticket.name || 'Sem título'}</span>
                        {ticket.content && (
                          <span className="text-gray-400 text-sm line-clamp-1">
                            {ticket.content}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300 py-2 text-sm">
                      {getUserName(ticket.users_id_assign || ticket._users_id_assign)}
                    </TableCell>
                    <TableCell className="text-gray-300 py-2 text-sm">
                      {getCategoryName(ticket.itilcategories_id || ticket.categories_id)}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getEntityColor(ticket.entities_id)}`}>
                        {getEntityName(ticket.entities_id)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {getStatusText(ticket.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 py-2">
                      {ticket.date ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(ticket.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{new Date(ticket.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          title="Editar Chamado"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicketForRemote(ticket);
                            setRemoteAccessDialogOpen(true);
                          }}
                          className="border-gray-600 text-blue-400 hover:bg-blue-900/20"
                          title="Acesso Remoto"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTicketToDelete(ticket)}
                          className="border-gray-600 text-red-400 hover:bg-red-900/20"
                          title="Excluir Chamado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {ticket.status !== 5 && ticket.status !== 6 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCloseTicket(ticket.id)}
                            disabled={updateTicket.isPending}
                            className="border-gray-600 text-green-400 hover:bg-green-900/20"
                            title="Encerrar Chamado"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Detalhes do Chamado #{selectedTicket?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 text-gray-300">
              <div>
                <label className="text-sm font-medium text-gray-400">Título:</label>
                <p className="text-white">{selectedTicket.name || 'Sem título'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Conteúdo:</label>
                <p className="text-white whitespace-pre-wrap">
                  {selectedTicket.content || 'Sem conteúdo'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Status:</label>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusText(selectedTicket.status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Prioridade:</label>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {getPriorityText(selectedTicket.priority)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Data de Criação:</label>
                <p className="text-white">
                  {selectedTicket.date 
                    ? new Date(selectedTicket.date).toLocaleString('pt-BR')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Ticket Dialog */}
      <GLPINewTicketDialog
        open={isNewTicketDialogOpen}
        onOpenChange={setIsNewTicketDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir o chamado #{ticketToDelete?.id} - "{ticketToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setTicketToDelete(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              disabled={deleteTicket.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTicket.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remote Access Dialog */}
      <GLPIRemoteAccessDialog
        open={remoteAccessDialogOpen}
        onOpenChange={setRemoteAccessDialogOpen}
        itemName={selectedTicketForRemote?.name}
      />
    </div>
  );
};

export { GLPITicketsGrid };
