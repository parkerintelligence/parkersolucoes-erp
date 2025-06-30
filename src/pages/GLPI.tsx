
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Headphones, AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';

const GLPI = () => {
  const tickets = [
    { id: '1234', title: 'Problema de rede no setor financeiro', priority: 'Alta', status: 'Aberto', assigned: 'João Silva', created: '2024-06-30 09:15' },
    { id: '1235', title: 'Instalação de software', priority: 'Média', status: 'Em Andamento', assigned: 'Maria Santos', created: '2024-06-30 10:30' },
    { id: '1236', title: 'Manutenção preventiva servidor', priority: 'Baixa', status: 'Aguardando', assigned: 'Pedro Costa', created: '2024-06-29 14:20' },
    { id: '1237', title: 'Configuração de impressora', priority: 'Média', status: 'Resolvido', assigned: 'Ana Lima', created: '2024-06-29 11:45' },
  ];

  const equipment = [
    { id: 'PC001', name: 'Desktop - Financeiro 01', type: 'Computador', status: 'Ativo', location: 'Sala 101' },
    { id: 'SRV001', name: 'Servidor Principal', type: 'Servidor', status: 'Ativo', location: 'Data Center' },
    { id: 'IMP001', name: 'Impressora HP LaserJet', type: 'Impressora', status: 'Manutenção', location: 'Sala 205' },
    { id: 'NET001', name: 'Switch Principal', type: 'Rede', status: 'Ativo', location: 'Data Center' },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alta</Badge>;
      case 'Média':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Média</Badge>;
      case 'Baixa':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Baixa</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aberto':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Aberto</Badge>;
      case 'Em Andamento':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em Andamento</Badge>;
      case 'Aguardando':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Aguardando</Badge>;
      case 'Resolvido':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Resolvido</Badge>;
      case 'Ativo':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>;
      case 'Manutenção':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Manutenção</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
          <Button className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">3</p>
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
                  <p className="text-2xl font-bold text-blue-900">8</p>
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
                  <p className="text-2xl font-bold text-blue-900">15</p>
                  <p className="text-sm text-blue-600">Resolvidos Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">26</p>
                  <p className="text-sm text-blue-600">Total Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Chamados Recentes</CardTitle>
            <CardDescription>Lista dos chamados mais recentes no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atribuído</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{ticket.assigned}</TableCell>
                    <TableCell className="text-gray-600">{ticket.created}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Equipment Table */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Inventário de Equipamentos</CardTitle>
            <CardDescription>Lista dos equipamentos cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GLPI;
