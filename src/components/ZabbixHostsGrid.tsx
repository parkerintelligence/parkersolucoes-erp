
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Server, 
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useZabbixIntegration, ZabbixHost } from '@/hooks/useZabbixIntegration';

export const ZabbixHostsGrid = () => {
  const { hosts, refetchAll, isLoading } = useZabbixIntegration();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);

  const filteredHosts = useMemo(() => {
    return hosts.filter((host) => {
      const matchesSearch = host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           host.host.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || host.available === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [hosts, searchTerm, statusFilter]);

  const getStatusBadge = (available: string) => {
    switch (available) {
      case '1':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Disponível</Badge>;
      case '2':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Indisponível</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Clock className="h-3 w-3 mr-1" />Desconhecido</Badge>;
    }
  };

  const getMonitoringStatus = (status: string) => {
    return status === '0' ? 'Monitorado' : 'Não Monitorado';
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Server className="h-5 w-5" />
            Hosts - Monitoramento Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome ou host..."
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
                <SelectItem value="1">Disponível</SelectItem>
                <SelectItem value="2">Indisponível</SelectItem>
                <SelectItem value="0">Desconhecido</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Resultado */}
          <div className="text-sm text-gray-600">
            Mostrando {filteredHosts.length} de {hosts.length} hosts
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monitoramento</TableHead>
                  <TableHead>Interface</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHosts.map((host) => (
                  <TableRow key={host.hostid} className="hover:bg-blue-50">
                    <TableCell className="font-medium">#{host.hostid}</TableCell>
                    <TableCell className="font-medium">{host.name}</TableCell>
                    <TableCell>{host.host}</TableCell>
                    <TableCell>{getStatusBadge(host.available)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getMonitoringStatus(host.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {host.interfaces[0] && (
                        <div className="text-sm">
                          <div>{host.interfaces[0].ip}</div>
                          <div className="text-gray-500">:{host.interfaces[0].port}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {host.error && (
                        <Badge variant="destructive" className="text-xs">
                          Erro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedHost(host)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Server className="h-5 w-5 text-blue-600" />
                              Host #{selectedHost?.hostid} - {selectedHost?.name}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedHost && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Status</label>
                                  <div className="mt-1">{getStatusBadge(selectedHost.available)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Monitoramento</label>
                                  <div className="mt-1">
                                    <Badge variant="outline">
                                      {getMonitoringStatus(selectedHost.status)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-700">Nome do Host</label>
                                <p className="mt-1 text-sm text-gray-600">{selectedHost.name}</p>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-700">Host Técnico</label>
                                <p className="mt-1 text-sm text-gray-600">{selectedHost.host}</p>
                              </div>

                              {selectedHost.interfaces.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Interfaces</label>
                                  <div className="mt-2 space-y-2">
                                    {selectedHost.interfaces.map((interface, index) => (
                                      <div key={index} className="p-2 bg-gray-50 rounded">
                                        <div className="text-sm font-medium">Interface {index + 1}</div>
                                        <div className="text-sm text-gray-600">
                                          IP: {interface.ip}:{interface.port}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {selectedHost.error && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Erro</label>
                                  <div className="mt-1 p-2 bg-red-50 rounded text-sm text-red-700">
                                    {selectedHost.error}
                                  </div>
                                </div>
                              )}
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
        </CardContent>
      </Card>
    </div>
  );
};
