import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Building2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GLPITicket } from '@/hooks/useGLPIExpanded';

interface GLPIModernTicketTableProps {
  tickets: GLPITicket[];
  getEntityName: (entityId: number) => string;
  getPriorityText: (priority: number) => string;
  getStatusText: (status: number) => string;
}

export const GLPIModernTicketTable = ({ 
  tickets, 
  getEntityName, 
  getPriorityText, 
  getStatusText 
}: GLPIModernTicketTableProps) => {
  const [selectedTicket, setSelectedTicket] = useState<GLPITicket | null>(null);

  const getPriorityBadge = (priority: number) => {
    const variants: Record<number, { variant: any; className: string }> = {
      6: { variant: 'destructive', className: 'bg-glpi-error text-white' },
      5: { variant: 'destructive', className: 'bg-glpi-error/80 text-white' },
      4: { variant: 'default', className: 'bg-glpi-warning text-white' },
      3: { variant: 'secondary', className: 'bg-glpi-text-muted/20 text-glpi-text' },
      2: { variant: 'outline', className: 'bg-glpi-success/10 text-glpi-success border-glpi-success/20' },
      1: { variant: 'outline', className: 'bg-glpi-success/20 text-glpi-success border-glpi-success/20' }
    };
    
    const config = variants[priority] || { variant: 'outline', className: '' };
    return (
      <Badge className={`text-xs ${config.className}`}>
        {getPriorityText(priority)}
      </Badge>
    );
  };

  const getStatusBadge = (status: number) => {
    const variants: Record<number, { className: string }> = {
      1: { className: 'bg-glpi-error/10 text-glpi-error border-glpi-error/20' },
      2: { className: 'bg-glpi-info/10 text-glpi-info border-glpi-info/20' },
      3: { className: 'bg-glpi-secondary/10 text-glpi-secondary border-glpi-secondary/20' },
      4: { className: 'bg-glpi-warning/10 text-glpi-warning border-glpi-warning/20' },
      5: { className: 'bg-glpi-success/10 text-glpi-success border-glpi-success/20' },
      6: { className: 'bg-glpi-text-muted/10 text-glpi-text-muted border-glpi-text-muted/20' }
    };
    
    const config = variants[status] || { className: 'bg-glpi-surface-2 text-glpi-text' };
    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {getStatusText(status)}
      </Badge>
    );
  };

  return (
    <div className="bg-glpi-surface rounded-lg border border-glpi-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-glpi-surface-2 hover:bg-glpi-surface-2">
            <TableHead className="w-[80px] text-glpi-text font-medium">ID</TableHead>
            <TableHead className="text-glpi-text font-medium">Título</TableHead>
            <TableHead className="w-[140px] text-glpi-text font-medium">Entidade</TableHead>
            <TableHead className="w-[100px] text-glpi-text font-medium">Status</TableHead>
            <TableHead className="w-[100px] text-glpi-text font-medium">Prioridade</TableHead>
            <TableHead className="w-[120px] text-glpi-text font-medium">Criado em</TableHead>
            <TableHead className="w-[80px] text-glpi-text font-medium">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket, index) => (
            <TableRow 
              key={ticket.id} 
              className={`
                hover:bg-glpi-surface-2/50 transition-colors border-b border-glpi-border/50
                ${index % 2 === 0 ? 'bg-glpi-surface' : 'bg-glpi-background/30'}
              `}
            >
              <TableCell className="font-mono text-sm text-glpi-text-muted">
                #{ticket.id}
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate font-medium text-glpi-text text-sm">
                  {ticket.name}
                </div>
                <div className="text-xs text-glpi-text-muted truncate mt-1">
                  {ticket.content.substring(0, 60)}...
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs bg-glpi-surface-2 text-glpi-text border-glpi-border">
                  <Building2 className="h-3 w-3 mr-1" />
                  {getEntityName(ticket.entities_id)}
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
              <TableCell className="text-xs text-glpi-text-muted">
                {format(new Date(ticket.date), 'dd/MM/yy', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                      className="h-8 w-8 p-0 hover:bg-glpi-surface-2"
                    >
                      <Eye className="h-4 w-4 text-glpi-text-muted" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-glpi-text">
                        <AlertTriangle className="h-5 w-5 text-glpi-secondary" />
                        Chamado #{selectedTicket?.id} - {selectedTicket?.name}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedTicket && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-glpi-text-muted">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-glpi-text-muted">Prioridade</label>
                            <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-glpi-text-muted">Entidade</label>
                            <div className="mt-1">
                              <Badge variant="outline" className="bg-glpi-surface-2 text-glpi-text border-glpi-border">
                                <Building2 className="h-3 w-3 mr-1" />
                                {getEntityName(selectedTicket.entities_id)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-glpi-text-muted">Criado em</label>
                            <p className="mt-1 text-sm text-glpi-text">
                              {format(new Date(selectedTicket.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-glpi-text-muted">Descrição</label>
                          <div className="mt-2 p-4 bg-glpi-surface-2 rounded-lg border border-glpi-border">
                            <p className="text-sm text-glpi-text whitespace-pre-wrap">
                              {selectedTicket.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};