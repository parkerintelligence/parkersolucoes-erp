import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, RefreshCw, Plus, Trash2, Power } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MikrotikFirewallDialog } from './MikrotikFirewallDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const getChainColor = (chain: string) => {
  switch (chain) {
    case 'input':
      return 'bg-blue-900/30 dark:bg-blue-900/50 hover:bg-blue-900/40 dark:hover:bg-blue-900/60';
    case 'forward':
      return 'bg-green-900/30 dark:bg-green-900/50 hover:bg-green-900/40 dark:hover:bg-green-900/60';
    case 'output':
      return 'bg-yellow-900/30 dark:bg-yellow-900/50 hover:bg-yellow-900/40 dark:hover:bg-yellow-900/60';
    default:
      return 'hover:bg-muted/50';
  }
};

export const MikrotikFirewall = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<any>(null);

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

  const toggleRule = async (id: string, currentDisabled: boolean) => {
    try {
      await callAPI(`/ip/firewall/filter/${id}`, 'PATCH', { disabled: !currentDisabled });
      toast({
        title: 'Sucesso',
        description: currentDisabled ? 'Regra ativada com sucesso' : 'Regra desativada com sucesso',
      });
      loadRules();
    } catch (error) {
      console.error('Erro ao alternar regra:', error);
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

  const handleDelete = (rule: any) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete['.id']);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
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
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
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
              <TableHead>Porta Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Porta Destino</TableHead>
              <TableHead>Interface</TableHead>
              <TableHead>Comentário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule['.id']} className={getChainColor(rule.chain)}>
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
                <TableCell className="max-w-[150px] truncate">
                  {rule['src-address'] || 'any'}
                </TableCell>
                <TableCell>{rule['src-port'] || '-'}</TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {rule['dst-address'] || 'any'}
                </TableCell>
                <TableCell>{rule['dst-port'] || '-'}</TableCell>
                <TableCell className="text-xs">
                  {rule['in-interface'] || rule['out-interface'] || '-'}
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs">
                  {rule.comment || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={rule.disabled ? 'secondary' : 'default'}>
                    {rule.disabled ? 'Inativa' : 'Ativa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="xs"
                      variant={rule.disabled ? 'default' : 'outline'}
                      onClick={() => toggleRule(rule['.id'], rule.disabled)}
                    >
                      <Power className="h-3 w-3" />
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDelete(rule)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
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
      
      <MikrotikFirewallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadRules}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra de firewall? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
