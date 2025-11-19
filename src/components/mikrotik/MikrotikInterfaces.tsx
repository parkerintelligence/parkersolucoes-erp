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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Interfaces de Rede</CardTitle>
            <CardDescription>Gerenciar interfaces do MikroTik</CardDescription>
          </div>
          <Button onClick={loadInterfaces} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <MikrotikTableFilter value={filter} onChange={setFilter} placeholder="Filtrar interfaces..." />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 px-2">
                  Nome
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('type')} className="h-8 px-2">
                  Tipo
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>RX</TableHead>
              <TableHead>TX</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedInterfaces.map((iface) => (
              <TableRow key={iface['.id']}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-4 w-4 ${iface.running ? 'text-green-500' : 'text-gray-400'}`} />
                    {iface.name}
                  </div>
                </TableCell>
                <TableCell>{iface.type}</TableCell>
                <TableCell>
                  <Badge variant={iface.running ? 'default' : 'secondary'}>
                    {iface.running ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>{formatBytes(iface['rx-byte'])}</TableCell>
                <TableCell>{formatBytes(iface['tx-byte'])}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={iface.disabled ? 'default' : 'outline'}
                    onClick={() => toggleInterface(iface['.id'], iface.disabled)}
                  >
                    {iface.disabled ? (
                      <><Power className="h-4 w-4 mr-2" /> Ativar</>
                    ) : (
                      <><PowerOff className="h-4 w-4 mr-2" /> Desativar</>
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
