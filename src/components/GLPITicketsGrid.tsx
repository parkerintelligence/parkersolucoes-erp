import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, 
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  CheckCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Resetar para primeira página quando filtros ou ordenação mudarem
  React.useEffect(() => {
    setCurrentPage(1);
  }, [showOpenOnly, sortColumn, sortDirection, itemsPerPage]);

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
      'bg-blue-600 text-white',
      'bg-purple-600 text-white',
      'bg-green-600 text-white',
      'bg-yellow-600 text-white',
      'bg-orange-600 text-white',
      'bg-pink-600 text-white',
      'bg-indigo-600 text-white',
      'bg-cyan-600 text-white',
    ];
    return colors[entityId % colors.length];
  };

  const getCategoryColor = (categoryId: number) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-purple-600 text-white',
      'bg-green-600 text-white',
      'bg-yellow-600 text-white',
      'bg-orange-600 text-white',
      'bg-pink-600 text-white',
      'bg-indigo-600 text-white',
      'bg-cyan-600 text-white',
      'bg-teal-600 text-white',
      'bg-red-600 text-white',
    ];
    return colors[categoryId % colors.length];
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline-block" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 inline-block" />
      : <ArrowDown className="h-4 w-4 ml-1 inline-block" />;
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

  // Filtrar e ordenar tickets
  const filteredAndSortedTickets = Array.isArray(tickets.data) 
    ? tickets.data
        .filter((ticket: any) => {
          // Se showOpenOnly for true, mostra apenas tickets não solucionados e não fechados
          if (showOpenOnly) {
            return ticket.status !== 5 && ticket.status !== 6;
          }
          return true;
        })
        .sort((a: any, b: any) => {
          let aValue, bValue;
          
          switch (sortColumn) {
            case 'id':
              aValue = a.id;
              bValue = b.id;
              break;
            case 'name':
              aValue = (a.name || '').toLowerCase();
              bValue = (b.name || '').toLowerCase();
              break;
            case 'technician':
              aValue = getUserName(a.users_id_assign || a._users_id_assign).toLowerCase();
              bValue = getUserName(b.users_id_assign || b._users_id_assign).toLowerCase();
              break;
            case 'category':
              aValue = getCategoryName(a.itilcategories_id || a.categories_id).toLowerCase();
              bValue = getCategoryName(b.itilcategories_id || b.categories_id).toLowerCase();
              break;
            case 'entity':
              aValue = getEntityName(a.entities_id).toLowerCase();
              bValue = getEntityName(b.entities_id).toLowerCase();
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            case 'priority':
              aValue = a.priority;
              bValue = b.priority;
              break;
            case 'date':
              aValue = new Date(a.date || 0).getTime();
              bValue = new Date(b.date || 0).getTime();
              break;
            default:
              aValue = a.id;
              bValue = b.id;
          }

          if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        })
    : [];

  // Calcular paginação
  const totalItems = filteredAndSortedTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const ticketsList = filteredAndSortedTickets.slice(startIndex, endIndex);

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
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      ID
                      {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Título
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('technician')}
                  >
                    <div className="flex items-center">
                      Técnico
                      {getSortIcon('technician')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Categoria
                      {getSortIcon('category')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('entity')}
                  >
                    <div className="flex items-center">
                      Entidade
                      {getSortIcon('entity')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center">
                      Prioridade
                      {getSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Data
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
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
                    <TableCell className="py-2">
                      {ticket.itilcategories_id || ticket.categories_id ? (
                        <Badge className={getCategoryColor(ticket.itilcategories_id || ticket.categories_id)}>
                          {getCategoryName(ticket.itilcategories_id || ticket.categories_id)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`${getEntityColor(ticket.entities_id)}`}>
                        {getEntityName(ticket.entities_id)}
                      </Badge>
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

          {/* Controles de Paginação */}
          {ticketsList.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Exibindo {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} chamados
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Select de itens por página */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Registros por página:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white z-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 z-50">
                      <SelectItem value="25" className="text-white hover:bg-gray-600">25</SelectItem>
                      <SelectItem value="50" className="text-white hover:bg-gray-600">50</SelectItem>
                      <SelectItem value="100" className="text-white hover:bg-gray-600">100</SelectItem>
                      <SelectItem value="200" className="text-white hover:bg-gray-600">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Navegação de páginas */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-300 px-3">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    title="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    title="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
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
        entityName={getEntityName(selectedTicketForRemote?.entities_id)}
      />
    </div>
  );
};

export { GLPITicketsGrid };
