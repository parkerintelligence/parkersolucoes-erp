import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi, RefreshCw, Power, PowerOff, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MikrotikTableFilter } from './MikrotikTableFilter';
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateInterfacesSummary, formatBytes } from '@/utils/mikrotikExportFormatters';

export const MikrotikInterfaces = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadInterfaces();
  }, []);

  const loadInterfaces = async () => {
    try {
      const data = await callAPI('/interface');
      if (data) {
        setInterfaces(data);
      }
    } catch (error) {
      console.error('Erro ao carregar interfaces:', error);
    }
  };

  const toggleInterface = async (id: string, disabled: boolean) => {
    try {
      await callAPI(`/interface/${id}`, 'PATCH', { disabled: !disabled });
      toast({
        title: 'Sucesso',
        description: `Interface ${disabled ? 'ativada' : 'desativada'} com sucesso`,
      });
      loadInterfaces();
    } catch (error) {
      console.error('Erro ao alterar interface:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedInterfaces = useMemo(() => {
    let filtered = interfaces.filter((iface) => {
      const searchTerm = filter.toLowerCase();
      return (
        iface.name?.toLowerCase().includes(searchTerm) ||
        iface.type?.toLowerCase().includes(searchTerm)
      );
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [interfaces, filter, sortField, sortDirection]);

  if (loading && interfaces.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (iface: any) => {
    if (iface.disabled === "true" || iface.disabled === true) {
      return <Badge className="bg-red-600/80 text-white">Desativada</Badge>;
    }
    if (iface.running) {
      return <Badge className="bg-green-600/80 text-white">Conectada</Badge>;
    }
    return <Badge className="bg-yellow-600/80 text-white">Desconectada</Badge>;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-white">Interfaces de Rede</CardTitle>
            <CardDescription className="text-slate-400">Gerenciar interfaces do MikroTik</CardDescription>
          </div>
          <div className="flex gap-2">
            <MikrotikExportActions
              data={interfaces}
              filteredData={filteredAndSortedInterfaces}
              columns={[
                { key: 'name', label: 'Nome' },
                { key: 'type', label: 'Tipo' },
                { key: 'running', label: 'Status', formatter: (val) => val === 'true' ? '✅ Conectado' : '❌ Desconectado' },
                { key: 'rx-byte', label: 'RX', formatter: (val) => formatBytes(parseInt(val || '0')) },
                { key: 'tx-byte', label: 'TX', formatter: (val) => formatBytes(parseInt(val || '0')) },
                { key: 'comment', label: 'Comentário' }
              ]}
              gridTitle="Interfaces de Rede"
              getSummary={() => generateInterfacesSummary(filteredAndSortedInterfaces)}
            />
            <Button onClick={loadInterfaces} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar interfaces..." />
      </CardHeader>
          <Button onClick={loadInterfaces} disabled={loading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar interfaces..." />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-slate-700/30">
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 px-2">
                  Nome
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">
                <Button variant="ghost" size="sm" onClick={() => handleSort('type')} className="h-8 px-2">
                  Tipo
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">RX</TableHead>
              <TableHead className="text-slate-300">TX</TableHead>
              <TableHead className="text-slate-300 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedInterfaces.map((iface) => (
              <TableRow key={iface['.id']} className="hover:bg-slate-700/50">
                <TableCell className="font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-4 w-4 ${iface.running ? 'text-green-500' : 'text-slate-400'}`} />
                    {iface.name}
                  </div>
                </TableCell>
                <TableCell className="text-slate-200">{iface.type}</TableCell>
                <TableCell className="text-slate-200">
                  {getStatusBadge(iface)}
                </TableCell>
                <TableCell className="text-slate-200">{formatBytes(iface['rx-byte'])}</TableCell>
                <TableCell className="text-slate-200">{formatBytes(iface['tx-byte'])}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => toggleInterface(iface['.id'], iface.disabled)}
                    className={iface.disabled ? "border-green-600/50 text-green-400 hover:bg-green-600/20" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  >
                    {iface.disabled ? (
                      <Power className="h-3 w-3" />
                    ) : (
                      <PowerOff className="h-3 w-3" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAndSortedInterfaces.length === 0 && interfaces.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma interface encontrada com o filtro aplicado
          </div>
        )}

        {interfaces.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma interface encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
