
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Eye, 
  AlertTriangle, 
  RefreshCw,
  CalendarIcon
} from 'lucide-react';
import { useZabbixIntegration, ZabbixProblem } from '@/hooks/useZabbixIntegration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const ZabbixProblemsGrid = () => {
  const { problems, refetchAll, isLoading } = useZabbixIntegration();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState('all');
  const [selectedProblem, setSelectedProblem] = useState<ZabbixProblem | null>(null);
  
  // Date filter states
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const [dateFrom, setDateFrom] = useState<Date>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<Date>(lastDayOfMonth);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch = problem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           problem.hosts[0]?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === 'all' || problem.severity === severityFilter;
      const matchesAcknowledged = acknowledgedFilter === 'all' || 
                                 (acknowledgedFilter === '1' && problem.acknowledged === '1') ||
                                 (acknowledgedFilter === '0' && problem.acknowledged === '0');
      
      // Date filter
      const problemDate = new Date(parseInt(problem.clock) * 1000);
      const matchesDate = problemDate >= dateFrom && problemDate <= dateTo;
      
      return matchesSearch && matchesSeverity && matchesAcknowledged && matchesDate;
    });
  }, [problems, searchTerm, severityFilter, acknowledgedFilter, dateFrom, dateTo]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case '5':
        return <Badge className="bg-red-600 text-white">Desastre</Badge>;
      case '4':
        return <Badge className="bg-red-500 text-white">Alto</Badge>;
      case '3':
        return <Badge className="bg-orange-500 text-white">Médio</Badge>;
      case '2':
        return <Badge className="bg-yellow-500 text-white">Aviso</Badge>;
      case '1':
        return <Badge className="bg-blue-500 text-white">Informação</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Desconhecido</Badge>;
    }
  };

  const getSeverityText = (severity: string) => {
    const severityMap: Record<string, string> = {
      '5': 'Desastre',
      '4': 'Alto',
      '3': 'Médio',
      '2': 'Aviso',
      '1': 'Informação',
      '0': 'Não classificado'
    };
    return severityMap[severity] || 'Desconhecido';
  };

  return (
    <div className="space-y-6">
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Problemas - Gestão Completa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por problema ou host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
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
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
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
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="5">Desastre</SelectItem>
                <SelectItem value="4">Alto</SelectItem>
                <SelectItem value="3">Médio</SelectItem>
                <SelectItem value="2">Aviso</SelectItem>
                <SelectItem value="1">Informação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={acknowledgedFilter} onValueChange={setAcknowledgedFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="0">Não Reconhecido</SelectItem>
                <SelectItem value="1">Reconhecido</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Resultado */}
          <div className="text-sm text-gray-600">
            Mostrando {filteredProblems.length} de {problems.length} problemas
            <span className="ml-2 text-orange-600">
              ({format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })} até {format(dateTo, 'dd/MM/yyyy', { locale: ptBR })})
            </span>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>ID</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Iniciado</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProblems.map((problem) => {
                  const startTime = new Date(parseInt(problem.clock) * 1000);
                  const endTime = problem.r_clock !== '0' ? new Date(parseInt(problem.r_clock) * 1000) : new Date();
                  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // em minutos
                  
                  return (
                    <TableRow key={problem.eventid} className="hover:bg-orange-50">
                      <TableCell className="font-medium">#{problem.eventid}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{problem.name}</div>
                      </TableCell>
                      <TableCell>
                        {problem.hosts[0]?.name || 'Desconhecido'}
                      </TableCell>
                      <TableCell>{getSeverityBadge(problem.severity)}</TableCell>
                      <TableCell>
                        {problem.acknowledged === '1' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Reconhecido
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Ativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(startTime, 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedProblem(problem)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                Problema #{selectedProblem?.eventid}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedProblem && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                                  <p className="mt-1 text-sm text-gray-600">{selectedProblem.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Severidade</label>
                                    <div className="mt-1">{getSeverityBadge(selectedProblem.severity)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">
                                      {selectedProblem.acknowledged === '1' ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                          Reconhecido
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-100 text-red-800 border-red-200">
                                          Ativo
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-gray-700">Host Afetado</label>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {selectedProblem.hosts[0]?.name || 'Desconhecido'} 
                                    (ID: {selectedProblem.hosts[0]?.hostid})
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Iniciado em</label>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {format(new Date(parseInt(selectedProblem.clock) * 1000), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                    </p>
                                  </div>
                                  {selectedProblem.r_clock !== '0' && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Resolvido em</label>
                                      <p className="mt-1 text-sm text-gray-600">
                                        {format(new Date(parseInt(selectedProblem.r_clock) * 1000), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
