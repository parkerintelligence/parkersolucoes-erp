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
    if (!userId) {
      console.log(`👤 [GLPI] getUserName - userId inválido:`, userId);
      return '-';
    }
    const user = users.data?.find((u: any) => u.id === userId);
    const name = user?.name || user?.realname || `Usuário ${userId}`;
    console.log(`👤 [GLPI] getUserName(${userId}):`, { 
      user, 
      name,
      totalUsers: users.data?.length || 0 
    });
    return name;
  };

  const getEntityName = (entityId: number) => {
    if (!entityId) return '-';
    const entity = entities.data?.find((e: any) => e.id === entityId);
    return entity?.name || entity?.completename || `Entidade ${entityId}`;
  };

  const getCategoryName = (categoryId: number) => {
    if (!categoryId) {
      console.log(`🏷️ [GLPI] getCategoryName - categoryId inválido:`, categoryId);
      return '-';
    }
    const category = itilCategories.data?.find((c: any) => c.id === categoryId);
    const name = category?.name || category?.completename || `Categoria ${categoryId}`;
    console.log(`🏷️ [GLPI] getCategoryName(${categoryId}):`, { 
      category, 
      name, 
      allCategories: itilCategories.data?.length || 0,
      firstCategory: itilCategories.data?.[0]
    });
    return name;
  };

  const parseGLPIDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;

    try {
      const cleaned = dateString.trim().replace(' ', 'T');
      const hasTimezone = /([zZ]|[+\-]\d{2}:?\d{2})$/.test(cleaned);

      // GLPI desta instância retorna timestamps sem timezone no fuso do servidor (UTC+2)
      // Ao anexar +02:00, o JS converte corretamente para o timezone local do usuário
      const normalized = hasTimezone ? cleaned : `${cleaned}+02:00`;
      return new Date(normalized);
    } catch (error) {
      console.error('❌ [GLPI] Erro ao fazer parse de data:', error, dateString);
      return null;
    }
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
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando chamados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
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
    <div className="space-y-2">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-foreground text-base">Chamados GLPI</CardTitle>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                className="rounded border-border bg-muted"
              />
              Apenas em aberto
            </label>
            <Button 
              size="sm" 
              className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setIsNewTicketDialogOpen(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Novo Chamado
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ticketsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium mb-1">Nenhum chamado encontrado</p>
              <p className="text-xs">Não há chamados disponíveis no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">ID{getSortIcon('id')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">Título{getSortIcon('name')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('technician')}
                  >
                    <div className="flex items-center">Técnico{getSortIcon('technician')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">Categoria{getSortIcon('category')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('entity')}
                  >
                    <div className="flex items-center">Entidade{getSortIcon('entity')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">Status{getSortIcon('status')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center">Prioridade{getSortIcon('priority')}</div>
                  </TableHead>
                  <TableHead 
                    className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">Data{getSortIcon('date')}</div>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsList.map((ticket: any) => (
                  <TableRow key={ticket.id} className="border-border/50 hover:bg-muted/20">
                    <TableCell className="text-muted-foreground font-mono text-[11px] py-1">
                      #{ticket.id}
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground truncate max-w-[250px]">{ticket.name || 'Sem título'}</span>
                        {ticket.content && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[250px]">
                            {ticket.content}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-1 text-[11px]">
                      {(() => {
                        return ticket.users_id_assign || ticket._users_id_assign 
                          ? getUserName(ticket.users_id_assign || ticket._users_id_assign)
                          : <span className="text-muted-foreground/50 italic">Não atribuído</span>;
                      })()}
                    </TableCell>
                    <TableCell className="py-1">
                      {ticket.itilcategories_id || ticket.categories_id ? (
                        <Badge className={`text-[10px] px-1.5 py-0 ${getCategoryColor(ticket.itilcategories_id || ticket.categories_id)}`}>
                          {getCategoryName(ticket.itilcategories_id || ticket.categories_id)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1">
                      <Badge className={`text-[10px] px-1.5 py-0 ${getEntityColor(ticket.entities_id)}`}>
                        {getEntityName(ticket.entities_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1">
                      <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(ticket.status)}`}>
                        <div className="flex items-center gap-0.5">
                          {getStatusIcon(ticket.status)}
                          {getStatusText(ticket.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1">
                      <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-1 text-[11px]">
                      {(() => {
                        const ticketDate = parseGLPIDate(ticket.date_creation || ticket.date);
                        if (!ticketDate) return 'N/A';
                        return (
                          <span>
                            {ticketDate.toLocaleDateString('pt-BR')}
                            <span className="text-muted-foreground/50 ml-1">
                              {ticketDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="py-1 text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicketForRemote(ticket);
                            setRemoteAccessDialogOpen(true);
                          }}
                          className="h-6 w-6 p-0"
                          title="Acesso Remoto"
                        >
                          <Monitor className="h-2.5 w-2.5" />
                        </Button>
                        {ticket.status !== 5 && ticket.status !== 6 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCloseTicket(ticket.id)}
                            disabled={updateTicket.isPending}
                            className="h-6 w-6 p-0 text-green-500 hover:bg-green-500/10"
                            title="Encerrar Chamado"
                          >
                            <CheckCheck className="h-2.5 w-2.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTicketToDelete(ticket)}
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                          title="Excluir Chamado"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {ticketsList.length > 0 && (
            <div className="mt-2 flex items-center justify-between border-t border-border px-4 py-2">
              <span className="text-[11px] text-muted-foreground">
                {startIndex + 1}–{Math.min(endIndex, totalItems)} de {totalItems}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Por página:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                    <SelectTrigger className="w-16 h-6 text-[11px] bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-6 w-6 p-0" title="Primeira página">
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-6 w-6 p-0">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-[11px] text-muted-foreground px-2">{currentPage}/{totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-6 w-6 p-0">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-6 w-6 p-0" title="Última página">
                    <ChevronsRight className="h-3 w-3" />
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
                  {(() => {
                    const createdAt = parseGLPIDate(selectedTicket.date_creation || selectedTicket.date);
                    return createdAt ? createdAt.toLocaleString('pt-BR') : 'N/A';
                  })()}
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
