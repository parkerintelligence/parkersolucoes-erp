import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi, RefreshCw, Power, PowerOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const MikrotikInterfaces = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [interfaces, setInterfaces] = useState<any[]>([]);

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interfaces de Rede</CardTitle>
            <CardDescription>Gerenciar interfaces do MikroTik</CardDescription>
          </div>
          <Button onClick={loadInterfaces} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>RX</TableHead>
              <TableHead>TX</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interfaces.map((iface) => (
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
      </CardContent>
    </Card>
  );
};
