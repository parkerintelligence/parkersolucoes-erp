
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Headphones, AlertCircle, Clock, CheckCircle, RefreshCw, Plus, Settings, Loader2 } from 'lucide-react';
import { useGLPI } from '@/hooks/useGLPI';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GLPI = () => {
  const { 
    glpiIntegration, 
    tickets, 
    computers, 
    users, 
    createTicket, 
    updateTicket, 
    getStatusText, 
    getPriorityText,
    initSession 
  } = useGLPI();

  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '',
    content: '',
    priority: 3,
    urgency: 3,
    impact: 3,
    type: 1,
  });

  const handleCreateTicket = async () => {
    if (!newTicket.name || !newTicket.content) return;
    
    try {
      await createTicket.mutateAsync(newTicket);
      setNewTicket({
        name: '',
        content: '',
        priority: 3,
        urgency: 3,
        impact: 3,
        type: 1,
      });
      setIsCreatingTicket(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 5:
      case 6:
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alta</Badge>;
      case 3:
      case 4:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Média</Badge>;
      case 1:
      case 2:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Baixa</Badge>;
      default:
        return <Badge>{getPriorityText(priority)}</Badge>;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
      case 2:
        return <Badge className="bg-red-100 text-red-800 border-red-200">{getStatusText(status)}</Badge>;
      case 3:
      case 4:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{getStatusText(status)}</Badge>;
      case 5:
        return <Badge className="bg-green-100 text-green-800 border-green-200">{getStatusText(status)}</Badge>;
      case 6:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{getStatusText(status)}</Badge>;
      default:
        return <Badge>{getStatusText(status)}</Badge>;
    }
  };

  if (!glpiIntegration) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Headphones className="h-8 w-8" />
                GLPI - Chamados e Equipamentos
              </h1>
              <p className="text-blue-600">Integração com sistema GLPI</p>
            </div>
          </div>

          <Card className="border-blue-200">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">GLPI não configurado</h3>
              <p className="text-gray-600 mb-4">
                Configure a integração com GLPI no painel administrativo para começar a gerenciar chamados e equipamentos.
              </p>
              <Button onClick={() => window.location.href = '/admin'}>
                <Settings className="mr-2 h-4 w-4" />
                Ir para Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Headphones className="h-8 w-8" />
              GLPI - Chamados e Equipamentos
            </h1>
            <p className="text-blue-600">Gerenciamento de chamados e inventário de equipamentos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => initSession.mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconectar
            </Button>
            <Dialog open={isCreatingTicket} onOpenChange={setIsCreatingTicket}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Chamado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Chamado</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo chamado no GLPI
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ticket-name">Título do Chamado</Label>
                    <Input
                      id="ticket-name"
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      placeholder="Descreva brevemente o problema"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket-content">Descrição</Label>
                    <Textarea
                      id="ticket-content"
                      value={newTicket.content}
                      onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                      placeholder="Descreva detalhadamente o problema"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={newTicket.priority.toString()} onValueChange={(value) => setNewTicket({ ...newTicket, priority: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Muito Baixa</SelectItem>
                          <SelectItem value="2">Baixa</SelectItem>
                          <SelectItem value="3">Média</SelectItem>
                          <SelectItem value="4">Alta</SelectItem>
                          <SelectItem value="5">Muito Alta</SelectItem>
                          <SelectItem value="6">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgência</Label>
                      <Select value={newTicket.urgency.toString()} onValueChange={(value) => setNewTicket({ ...newTicket, urgency: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Muito Baixa</SelectItem>
                          <SelectItem value="2">Baixa</SelectItem>
                          <SelectItem value="3">Média</SelectItem>
                          <SelectItem value="4">Alta</SelectItem>
                          <SelectItem value="5">Muito Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="impact">Impacto</Label>
                      <Select value={newTicket.impact.toString()} onValueChange={(value) => setNewTicket({ ...newTicket, impact: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Muito Baixo</SelectItem>
                          <SelectItem value="2">Baixo</SelectItem>
                          <SelectItem value="3">Médio</SelectItem>
                          <SelectItem value="4">Alto</SelectItem>
                          <SelectItem value="5">Muito Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateTicket} disabled={createTicket.isPending || !newTicket.name || !newTicket.content}>
                      {createTicket.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Criar Chamado
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreatingTicket(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {tickets.data?.filter(t => t.priority >= 5).length || 0}
                  </p>
                  <p className="text-sm text-blue-600">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {tickets.data?.filter(t => t.status === 2 || t.status === 3).length || 0}
                  </p>
                  <p className="text-sm text-blue-600">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {tickets.data?.filter(t => t.status === 5).length || 0}
                  </p>
                  <p className="text-sm text-blue-600">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {tickets.data?.filter(t => t.status !== 6).length || 0}
                  </p>
                  <p className="text-sm text-blue-600">Total Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {tickets.isLoading && (
          <Card className="border-blue-200">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p>Carregando dados do GLPI...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {tickets.error && (
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-4">Erro ao carregar dados: {tickets.error.message}</p>
              <Button onClick={() => tickets.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tickets Table */}
        {tickets.data && tickets.data.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Chamados Recentes</CardTitle>
              <CardDescription>Lista dos chamados mais recentes no sistema GLPI</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Modificado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.data.slice(0, 10).map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.name}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(ticket.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(ticket.date_mod), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Equipment Table */}
        {computers.data && computers.data.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Inventário de Equipamentos</CardTitle>
              <CardDescription>Lista dos equipamentos cadastrados no GLPI</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Última Modificação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computers.data.slice(0, 10).map((computer) => (
                    <TableRow key={computer.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{computer.id}</TableCell>
                      <TableCell>{computer.name}</TableCell>
                      <TableCell>{computer.serial || '-'}</TableCell>
                      <TableCell>{computer.contact || '-'}</TableCell>
                      <TableCell>{computer.locations_id || '-'}</TableCell>
                      <TableCell className="text-gray-600">
                        {computer.date_mod ? format(new Date(computer.date_mod), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GLPI;
