import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  CalendarIcon,
  Building2,
  RefreshCw
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GLPIModernTicketTable } from './glpi/GLPIModernTicketTable';

export const GLPITicketsGrid = () => {
  const { tickets, entities, getStatusText, getPriorityText } = useGLPIExpanded();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Date filter states - defaulting to current month
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const [dateFrom, setDateFrom] = useState<Date>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<Date>(lastDayOfMonth);
  
  const itemsPerPage = 15;

  const getEntityName = (entityId: number) => {
    const entity = entities.data?.find(e => e.id === entityId);
    return entity?.name || `Entidade ${entityId}`;
  };

  const filteredTickets = useMemo(() => {
    if (!tickets.data) return [];
    
    return tickets.data.filter((ticket: any) => {
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
  }, [tickets.data, searchTerm, statusFilter, priorityFilter, entityFilter, dateFrom, dateTo]);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card className="border-glpi-border bg-glpi-surface">
        <CardHeader className="bg-glpi-surface-2 border-b border-glpi-border pb-4">
          <CardTitle className="flex items-center gap-2 text-glpi-text">
            <Search className="h-5 w-5 text-glpi-secondary" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {/* Primeira linha de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-glpi-text">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-glpi-text-muted" />
                <Input
                  placeholder="ID, título ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-glpi-border bg-glpi-surface text-glpi-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-glpi-text">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-glpi-border bg-glpi-surface text-glpi-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Novo</SelectItem>
                  <SelectItem value="2">Em Andamento</SelectItem>
                  <SelectItem value="3">Planejado</SelectItem>
                  <SelectItem value="4">Pendente</SelectItem>
                  <SelectItem value="5">Resolvido</SelectItem>
                  <SelectItem value="6">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-glpi-text">Prioridade</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-glpi-border bg-glpi-surface text-glpi-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="1">Muito Baixa</SelectItem>
                  <SelectItem value="2">Baixa</SelectItem>
                  <SelectItem value="3">Média</SelectItem>
                  <SelectItem value="4">Alta</SelectItem>
                  <SelectItem value="5">Muito Alta</SelectItem>
                  <SelectItem value="6">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-glpi-text">Entidade</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="border-glpi-border bg-glpi-surface text-glpi-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {entities.data?.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id.toString()}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Segunda linha - filtros de data */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-glpi-text">Período:</span>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal border-glpi-border bg-glpi-surface text-glpi-text",
                      !dateFrom && "text-glpi-text-muted"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-glpi-text-muted">até</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal border-glpi-border bg-glpi-surface text-glpi-text",
                      !dateTo && "text-glpi-text-muted"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="bg-glpi-info/10 text-glpi-info border-glpi-info/20">
                {filteredTickets.length} chamados encontrados
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Chamados */}
      {filteredTickets.length > 0 ? (
        <>
          <GLPIModernTicketTable 
            tickets={paginatedTickets}
            getEntityName={getEntityName}
            getPriorityText={getPriorityText}
            getStatusText={getStatusText}
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-glpi-text-muted">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTickets.length)} de {filteredTickets.length} chamados
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-glpi-border text-glpi-text hover:bg-glpi-surface-2"
                >
                  Anterior
                </Button>
                <span className="text-sm text-glpi-text">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-glpi-border text-glpi-text hover:bg-glpi-surface-2"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="border-glpi-border bg-glpi-surface">
          <CardContent className="p-8 text-center">
            <div className="text-glpi-text-muted">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum chamado encontrado</h3>
              <p className="text-sm">Tente ajustar os filtros para encontrar chamados.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};