import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Network, RefreshCw, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const MikrotikNAT = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [natRules, setNatRules] = useState<any[]>([]);

  useEffect(() => {
    loadNATRules();
  }, []);

  const loadNATRules = async () => {
    try {
      const data = await callAPI('/ip/firewall/nat');
      if (data) {
        setNatRules(data);
      }
    } catch (error) {
      console.error('Erro ao carregar regras NAT:', error);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await callAPI(`/ip/firewall/nat/${id}`, 'DELETE');
      toast({
        title: 'Sucesso',
        description: 'Regra NAT removida com sucesso',
      });
      loadNATRules();
    } catch (error) {
      console.error('Erro ao remover regra:', error);
    }
  };

  if (loading && natRules.length === 0) {
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
            <CardTitle>Regras NAT</CardTitle>
            <CardDescription>Gerenciar regras de NAT do MikroTik</CardDescription>
          </div>
          <Button onClick={loadNATRules} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chain</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Interface</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {natRules.map((rule) => (
              <TableRow key={rule['.id']}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-purple-500" />
                    {rule.chain}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge>{rule.action}</Badge>
                </TableCell>
                <TableCell>{rule['src-address'] || 'any'}</TableCell>
                <TableCell>{rule['dst-address'] || 'any'}</TableCell>
                <TableCell>{rule['out-interface'] || rule['in-interface'] || 'any'}</TableCell>
                <TableCell>
                  <Badge variant={rule.disabled ? 'secondary' : 'default'}>
                    {rule.disabled ? 'Inativa' : 'Ativa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRule(rule['.id'])}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {natRules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma regra NAT configurada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
