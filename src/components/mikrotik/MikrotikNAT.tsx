import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Network, RefreshCw, Trash2, Plus, Power } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MikrotikNATDialog } from './MikrotikNATDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const MikrotikNAT = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [natRules, setNatRules] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<any>(null);

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

  const toggleRule = async (id: string, currentDisabled: boolean) => {
    try {
      await callAPI(`/ip/firewall/nat/${id}`, 'PATCH', { disabled: !currentDisabled });
      toast({
        title: 'Sucesso',
        description: currentDisabled ? 'Regra NAT ativada com sucesso' : 'Regra NAT desativada com sucesso',
      });
      loadNATRules();
    } catch (error) {
      console.error('Erro ao alternar regra:', error);
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
          <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra NAT
            </Button>
            <Button onClick={loadNATRules} disabled={loading} size="sm" variant="outline">
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
              <TableHead>To Address</TableHead>
              <TableHead>To Port</TableHead>
              <TableHead>Interface</TableHead>
              <TableHead>Comentário</TableHead>
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
                <TableCell>{rule.protocol || 'all'}</TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {rule['src-address'] || 'any'}
                </TableCell>
                <TableCell>{rule['src-port'] || '-'}</TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {rule['dst-address'] || 'any'}
                </TableCell>
                <TableCell>{rule['dst-port'] || '-'}</TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {rule['to-addresses'] || '-'}
                </TableCell>
                <TableCell>{rule['to-ports'] || '-'}</TableCell>
                <TableCell className="text-xs">
                  {rule['out-interface'] || rule['in-interface'] || '-'}
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
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant={rule.disabled ? 'default' : 'outline'}
                      onClick={() => toggleRule(rule['.id'], rule.disabled)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(rule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
      
      <MikrotikNATDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadNATRules}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra NAT? Esta ação não pode ser desfeita.
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
