import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock, 
  User, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2
} from 'lucide-react';
import { useGLPIExpanded, GLPITicket } from '@/hooks/useGLPIExpanded';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GLPITicketsGrid = () => {
  const { tickets, entities, getStatusText, getPriorityText } = useGLPIExpanded();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [groupByEntity, setGroupByEntity] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<GLPITicket | null>(null);
  const itemsPerPage = 20;

  const getEntityName = (entityId: number) => {
    const entity = entities.data?.find(e => e.id === entityId);
    return entity?.name || `Entidade ${entityId}`;
  };

  const filteredTickets = useMemo(() => {
    if (!tickets.data) return [];
    
    return tickets.data.filter((ticket: GLPITicket) => {
      const matchesSearch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.id.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || ticket.status.toString() === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority.toString() === priorityFilter;
      const matchesEntity = entityFilter === 'all' || ticket.entities_id.toString() === entityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesEntity;
    });
  }, [tickets.data, searchTerm, statusFilter, priorityFilter, entityFilter]);

  const groupedTickets = useMemo(() => {
    if (!groupByEntity) {
      return { 'Todos os Chamados': filteredTickets };
    }

    const grouped = filteredTickets.reduce((acc, ticket) => {
      const entityName = getEntityName(ticket.entities_id);
      if (!acc[entityName]) {
        acc[entityName] = [];
      }
      acc[entityName].push(ticket);
      return acc;
    }, {} as Record<string, GLPITicket[]>);

    return grouped;
  }, [filteredTickets, groupByEntity, entities.data]);

  const paginatedTickets = useMemo(() => {
    if (groupByEntity) {
      return groupedTickets;
    }
    const allTickets = groupedTickets['Todos os Chamados'] || [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return { 'Todos os Chamados': allTickets.slice(startIndex, startIndex + itemsPerPage) };
  }, [groupedTickets, currentPage, groupByEntity]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 6:
        return <Badge className="bg-red-600 text-white">Crítica</Badge>;
      case 5:
        return <Badge className="bg-red-500 text-white">Muito Alta</Badge>;
      case 4:
        return <Badge className="bg-orange-500 text-white">Alta</Badge>;
      case 3:
        return <Badge className="bg-yellow-500 text-white">Média</Badge>;
      case 2:
        return <Badge className="bg-green-500 text-white">Baixa</Badge>;
      case 1:
        return <Badge className="bg-green-600 text-white">Muito Baixa</Badge>;
      default:
        return <Badge>{getPriorityText(priority)}</Badge>;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-red-100 text-red-800 border-red-200">Novo</Badge>;
      case 2:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em Andamento</Badge>;
      case 3:
        return <Badge className="bg-blue-200 text-blue-900 border-blue-300">Planejado</Badge>;
      case 4:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 5:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Resolvido</Badge>;
      case 6:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Fechado</Badge>;
      default:
        return <Badge>{getStatusText(status)}</Badge>;
    }
  };

  const getUrgencyText = (urgency: number) => {
    const urgencyMap: Record<number, string> = {
      1: 'Muito Baixa',
      2: 'Baixa',
      3: 'Média',
      4: 'Alta',
      5: 'Muito Alta'
    };
    return urgencyMap[urgency] || `Urgência ${urgency}`;
  };

  const renderTicketTable = (tickets: GLPITicket[], groupName: string) => (
    <div key={groupName} className="mb-8">
      {groupByEntity && (
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">{groupName}</h3>
          <Badge variant="outline">{tickets.length} chamados</Badge>
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-[140px]">Entidade</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Prioridade</TableHead>
              <TableHead className="w-[100px]">Urgência</TableHead>
              <TableHead className="w-[100px]">Impacto</TableHead>
              <TableHead className="w-[130px]">Criado em</TableHead>
              <TableHead className="w-[130px]">Modificado</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-blue-50">
                <TableCell className="font-medium">#{ticket.id}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate font-medium">{ticket.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {ticket.content.substring(0, 50)}...
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {getEntityName(ticket.entities_id)}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getUrgencyText(ticket.urgency)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getUrgencyText(ticket.impact)}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(ticket.date), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(ticket.date_mod), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-blue-600" />
                          Chamado #{selectedTicket?.id} - {selectedTicket?.name}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedTicket && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Status</label>
                              <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Prioridade</label>
                              <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Urgência</label>
                              <div className="mt-1">
                                <Badge variant="outline">{getUrgencyText(selectedTicket.urgency)}</Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Impacto</label>
                              <div className="mt-1">
                                <Badge variant="outline">{getUrgencyText(selectedTicket.impact)}</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Entidade</label>
                              <div className="mt-1">
                                <Badge variant="outline" className="gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {getEntityName(selectedTicket.entities_id)}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">ID da Entidade</label>
                              <p className="mt-1 text-sm text-gray-600">#{selectedTicket.entities_id}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Criado em</label>
                              <p className="mt-1 text-sm text-gray-600">
                                {format(new Date(selectedTicket.date), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Última Modificação</label>
                              <p className="mt-1 text-sm text-gray-600">
                                {format(new Date(selectedTicket.date_mod), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                          </div>

                          {selectedTicket.solvedate && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Resolvido em</label>
                              <p className="mt-1 text-sm text-gray-600">
                                {format(new Date(selectedTicket.solvedate), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium text-gray-700">Descrição Completa</label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{selectedTicket.content}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <label className="font-medium text-gray-700">Solicitante</label>
                              <p className="text-gray-600">ID: {selectedTicket.users_id_requester}</p>
                            </div>
                            <div>
                              <label className="font-medium text-gray-700">Atribuído</label>
                              <p className="text-gray-600">ID: {selectedTicket.users_id_assign || 'Não atribuído'}</p>
                            </div>
                            <div>
                              <label className="font-medium text-gray-700">Entidade</label>
                              <p className="text-gray-600">ID: {selectedTicket.entities_id}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Chamados - Gestão Completa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por ID, título ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="1">Novo</SelectItem>
                <SelectItem value="2">Em Andamento</SelectItem>
                <SelectItem value="3">Planejado</SelectItem>
                <SelectItem value="4">Pendente</SelectItem>
                <SelectItem value="5">Resolvido</SelectItem>
                <SelectItem value="6">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="6">Crítica</SelectItem>
                <SelectItem value="5">Muito Alta</SelectItem>
                <SelectItem value="4">Alta</SelectItem>
                <SelectItem value="3">Média</SelectItem>
                <SelectItem value="2">Baixa</SelectItem>
                <SelectItem value="1">Muito Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Entidades</SelectItem>
                {entities.data?.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={groupByEntity ? "default" : "outline"}
              onClick={() => setGroupByEntity(!groupByEntity)}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              {groupByEntity ? "Desagrupar" : "Agrupar por Entidade"}
            </Button>

            <Button variant="outline" onClick={() => tickets.refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Resultados */}
          <div className="text-sm text-gray-600">
            Mostrando {filteredTickets.length} chamados
            {groupByEntity && ` em ${Object.keys(groupedTickets).length} entidade(s)`}
          </div>

          {/* Tabelas */}
          <div className="space-y-6">
            {Object.entries(paginatedTickets).map(([groupName, ticketList]) => 
              renderTicketTable(ticketList, groupName)
            )}
          </div>

          {/* Paginação - apenas quando não agrupado */}
          {!groupByEntity && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
