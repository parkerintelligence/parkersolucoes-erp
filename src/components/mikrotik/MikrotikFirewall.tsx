import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, RefreshCw, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const MikrotikFirewall = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await callAPI('/ip/firewall/filter');
      if (data) {
        setRules(data);
      }
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await callAPI(`/ip/firewall/filter/${id}`, 'DELETE');
      toast({
        title: 'Sucesso',
        description: 'Regra removida com sucesso',
      });
      loadRules();
    } catch (error) {
      console.error('Erro ao remover regra:', error);
    }
  };

  if (loading && rules.length === 0) {
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
            <CardTitle>Regras de Firewall</CardTitle>
            <CardDescription>Gerenciar regras de firewall do MikroTik</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadRules} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chain</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Protocolo</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule, index) => (
              <TableRow key={rule['.id']}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    {rule.chain}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={rule.action === 'accept' ? 'default' : 'destructive'}>
                    {rule.action}
                  </Badge>
                </TableCell>
                <TableCell>{rule.protocol || 'all'}</TableCell>
                <TableCell>{rule['src-address'] || 'any'}</TableCell>
                <TableCell>{rule['dst-address'] || 'any'}</TableCell>
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

        {rules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma regra de firewall configurada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
