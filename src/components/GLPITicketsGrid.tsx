
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Building2,
  CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useGLPIExpanded, GLPITicket } from '@/hooks/useGLPIExpanded';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const GLPITicketsGrid = () => {
  const { tickets, entities, getStatusText, getPriorityText } = useGLPIExpanded();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [groupByEntity, setGroupByEntity] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<GLPITicket | null>(null);
  
  // Sorting states
  const [sortField, setSortField] = useState<keyof GLPITicket>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Date filter states - defaulting to current month
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const [dateFrom, setDateFrom] = useState<Date>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<Date>(lastDayOfMonth);
  
  const itemsPerPage = 20;

  // Load saved sorting preferences
  useEffect(() => {
    const savedSortField = localStorage.getItem('glpi-sort-field') as keyof GLPITicket;
    const savedSortDirection = localStorage.getItem('glpi-sort-direction') as 'asc' | 'desc';
    
    if (savedSortField) setSortField(savedSortField);
    if (savedSortDirection) setSortDirection(savedSortDirection);
  }, []);

  // Save sorting preferences
  const updateSort = (field: keyof GLPITicket) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    
    localStorage.setItem('glpi-sort-field', field);
    localStorage.setItem('glpi-sort-direction', newDirection);
  };

  const getEntityName = (entityId: number) => {
    const entity = entities.data?.find(e => e.id === entityId);
    return entity?.name || `Entidade ${entityId}`;
  };

  const filteredTickets = useMemo(() => {
    if (!tickets.data) return [];
    
    let filtered = tickets.data.filter((ticket: GLPITicket) => {
      const matchesSearch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.id.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || ticket.status.toString() === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority.toString() === priorityFilter;
      const matchesEntity = entityFilter === 'all' || ticket.entities_id.toString() === entityFilter;
      
      // Date filter
      const ticketDate = new Date(ticket.date);
      const matchesDate = ticketDate >= dateFrom && ticketDate <= dateTo;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesEntity && matchesDate;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date fields
      if (sortField === 'date' || sortField === 'date_mod' || sortField === 'solvedate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string fields
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [tickets.data, searchTerm, statusFilter, priorityFilter, entityFilter, dateFrom, dateTo, sortField, sortDirection]);

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
        return <Badge className="bg-slate-600 text-white">{getPriorityText(priority)}</Badge>;
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
        return <Badge className="bg-slate-600 text-white">{getStatusText(status)}</Badge>;
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

  const getSortIcon = (field: keyof GLPITicket) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const renderTicketTable = (tickets: GLPITicket[], groupName: string) => (
    <div key={groupName} className="mb-8">
      {groupByEntity && (
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{groupName}</h3>
          <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">{tickets.length} chamados</Badge>
        </div>
      )}
      
      <div className="bg-slate-800 border border-slate-700 overflow-hidden shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
              <TableHead 
                className="w-[80px] text-white font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => updateSort('id')}
              >
                <div className="flex items-center gap-1">
                  ID {getSortIcon('id')}
                </div>
              </TableHead>
              <TableHead 
                className="text-white font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => updateSort('name')}
              >
                <div className="flex items-center gap-1">
                  Título {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead className="w-[140px] text-white font-semibold">Entidade</TableHead>
              <TableHead 
                className="w-[120px] text-white font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => updateSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[120px] text-white font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => updateSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Prioridade {getSortIcon('priority')}
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-white font-semibold">Urgência</TableHead>
              <TableHead 
                className="w-[130px] text-white font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => updateSort('date')}
              >
                <div className="flex items-center gap-1">
                  Criado em {getSortIcon('date')}
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-white font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-slate-700 transition-colors border-b border-slate-600 text-white">
                <TableCell className="font-medium text-white">#{ticket.id}</TableCell>
                <TableCell className="max-w-xs text-white">
                  <div className="truncate font-medium">{ticket.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {ticket.content.substring(0, 50)}...
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 bg-slate-700 text-slate-200 border-slate-600">
                    <Building2 className="h-3 w-3" />
                    {getEntityName(ticket.entities_id)}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">{getUrgencyText(ticket.urgency)}</Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-300">
                  {format(new Date(ticket.date), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-slate-200 hover:bg-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                          <AlertTriangle className="h-5 w-5 text-blue-400" />
                          Chamado #{selectedTicket?.id} - {selectedTicket?.name}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedTicket && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium text-slate-300">Status</label>
                              <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Prioridade</label>
                              <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Urgência</label>
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">{getUrgencyText(selectedTicket.urgency)}</Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Impacto</label>
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">{getUrgencyText(selectedTicket.impact)}</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-slate-300">Entidade</label>
                              <div className="mt-1">
                                <Badge variant="outline" className="gap-1 bg-slate-700 text-slate-200 border-slate-600">
                                  <Building2 className="h-3 w-3" />
                                  {getEntityName(selectedTicket.entities_id)}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">ID da Entidade</label>
                              <p className="mt-1 text-sm text-slate-400">#{selectedTicket.entities_id}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-slate-300">Criado em</label>
                              <p className="mt-1 text-sm text-slate-400">
                                {format(new Date(selectedTicket.date), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Última Modificação</label>
                              <p className="mt-1 text-sm text-slate-400">
                                {format(new Date(selectedTicket.date_mod), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                          </div>

                          {selectedTicket.solvedate && (
                            <div>
                              <label className="text-sm font-medium text-slate-300">Resolvido em</label>
                              <p className="mt-1 text-sm text-slate-400">
                                {format(new Date(selectedTicket.solvedate), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium text-slate-300">Descrição Completa</label>
                            <div className="mt-2 p-4 bg-slate-700">
                              <p className="text-sm whitespace-pre-wrap text-slate-400">{selectedTicket.content}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <label className="font-medium text-slate-300">Solicitante</label>
                              <p className="text-slate-400">ID: {selectedTicket.users_id_requester}</p>
                            </div>
                            <div>
                              <label className="font-medium text-slate-300">Atribuído</label>
                              <p className="text-slate-400">ID: {selectedTicket.users_id_assign || 'Não atribuído'}</p>
                            </div>
                            <div>
                              <label className="font-medium text-slate-300">Entidade</label>
                              <p className="text-slate-400">ID: {selectedTicket.entities_id}</p>
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
    <div className="space-y-6 bg-slate-900 min-h-screen p-6">
      <Card className="bg-slate-800 border-slate-700 shadow-xl">
        <CardHeader className="bg-slate-700 text-white border-b border-slate-600">
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-6 w-6" />
            Central de Chamados GLPI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-slate-800">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por ID, título ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                      !dateFrom && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                    className={cn("p-3 bg-slate-800 text-white")}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                      !dateTo && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                    className={cn("p-3 bg-slate-800 text-white")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="text-white">Todos Status</SelectItem>
                <SelectItem value="1" className="text-white">Novo</SelectItem>
                <SelectItem value="2" className="text-white">Em Andamento</SelectItem>
                <SelectItem value="3" className="text-white">Planejado</SelectItem>
                <SelectItem value="4" className="text-white">Pendente</SelectItem>
                <SelectItem value="5" className="text-white">Resolvido</SelectItem>
                <SelectItem value="6" className="text-white">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="text-white">Todas</SelectItem>
                <SelectItem value="6" className="text-white">Crítica</SelectItem>
                <SelectItem value="5" className="text-white">Muito Alta</SelectItem>
                <SelectItem value="4" className="text-white">Alta</SelectItem>
                <SelectItem value="3" className="text-white">Média</SelectItem>
                <SelectItem value="2" className="text-white">Baixa</SelectItem>
                <SelectItem value="1" className="text-white">Muito Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="text-white">Todas Entidades</SelectItem>
                {entities.data?.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()} className="text-white">
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={groupByEntity ? "default" : "outline"}
              onClick={() => setGroupByEntity(!groupByEntity)}
              className={`gap-2 ${groupByEntity ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'}`}
            >
              <Building2 className="h-4 w-4" />
              {groupByEntity ? "Desagrupar" : "Agrupar por Entidade"}
            </Button>

            <Button variant="outline" onClick={() => tickets.refetch()} className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Resultados */}
          <div className="text-sm text-slate-400">
            Mostrando {filteredTickets.length} chamados
            {groupByEntity && ` em ${Object.keys(groupedTickets).length} entidade(s)`}
            <span className="ml-2 text-blue-400">
              ({format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })} até {format(dateTo, 'dd/MM/yyyy', { locale: ptBR })})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabelas */}
      <div className="space-y-6">
        {(Object.entries(paginatedTickets) as [string, GLPITicket[]][]).map(([groupName, ticketList]) => 
          renderTicketTable(ticketList, groupName)
        )}
      </div>

      {/* Paginação - apenas quando não agrupado */}
      {!groupByEntity && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
