import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useGLPI } from '@/hooks/useGLPI';
import { GLPITicketConfirmDialog } from './GLPITicketConfirmDialog';
import { GLPINewTicketDialog } from './GLPINewTicketDialog';

interface GLPITicketsGridProps {
  filters?: any;
}

const GLPITicketsGrid = ({ filters = {} }: GLPITicketsGridProps) => {
  const { tickets, getStatusText, getPriorityText } = useGLPI();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-purple-100 text-purple-800';
      case 5: return 'bg-green-100 text-green-800';
      case 6: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      case 4: return 'bg-yellow-100 text-yellow-800';
      case 5: return 'bg-orange-100 text-orange-800';
      case 6: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return <Clock className="h-4 w-4" />;
      case 2: return <User className="h-4 w-4" />;
      case 3: return <AlertTriangle className="h-4 w-4" />;
      case 4: return <Clock className="h-4 w-4" />;
      case 5: return <CheckCircle className="h-4 w-4" />;
      case 6: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  if (tickets.isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Carregando chamados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar chamados: {tickets.error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ticketsList = Array.isArray(tickets.data) ? tickets.data : [];

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Chamados GLPI</CardTitle>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsNewTicketDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Button>
        </CardHeader>
        <CardContent>
          {ticketsList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
              <p>Não há chamados disponíveis no momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Título</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Prioridade</TableHead>
                  <TableHead className="text-gray-300">Data</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsList.map((ticket: any) => (
                  <TableRow key={ticket.id} className="border-gray-700">
                    <TableCell className="text-gray-300 font-mono">
                      #{ticket.id}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {ticket.name || 'Sem título'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {getStatusText(ticket.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {ticket.date ? new Date(ticket.date).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Detalhes do Chamado #{selectedTicket?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 text-gray-300">
              <div>
                <label className="text-sm font-medium text-gray-400">Título:</label>
                <p className="text-white">{selectedTicket.name || 'Sem título'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Conteúdo:</label>
                <p className="text-white whitespace-pre-wrap">
                  {selectedTicket.content || 'Sem conteúdo'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Status:</label>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusText(selectedTicket.status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Prioridade:</label>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {getPriorityText(selectedTicket.priority)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Data de Criação:</label>
                <p className="text-white">
                  {selectedTicket.date 
                    ? new Date(selectedTicket.date).toLocaleString('pt-BR')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Ticket Dialog */}
      <GLPINewTicketDialog
        open={isNewTicketDialogOpen}
        onOpenChange={setIsNewTicketDialogOpen}
      />
    </div>
  );
};

export { GLPITicketsGrid };
