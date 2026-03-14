import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Calendar, Building, Search, ExternalLink, MessageCircle, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleDialog } from './ScheduleDialog';
import { toast } from '@/hooks/use-toast';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { WhatsAppScheduleDialog } from './WhatsAppScheduleDialog';

interface ScheduleItem {
  id: string;
  title: string;
  company: string;
  type: string;
  status: string;
  due_date: string;
  description?: string;
}

interface ScheduleTableProps {
  items: ScheduleItem[];
  onUpdate: (id: string, updates: Partial<ScheduleItem>) => void;
  onDelete: (id: string) => void;
}

export const ScheduleTable = ({ items, onUpdate, onDelete }: ScheduleTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [showGLPIConfirm, setShowGLPIConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const { createTicket } = useGLPIExpanded();
  const { confirm } = useConfirmDialog();

  const handleOpenGLPITicket = (item: ScheduleItem) => {
    setSelectedItem(item);
    setShowGLPIConfirm(true);
  };

  const confirmCreateTicket = async () => {
    if (!selectedItem) return;
    try {
      const ticketData = {
        name: `${selectedItem.title} - ${selectedItem.type}`,
        content: `Empresa: ${selectedItem.company}\nTipo: ${selectedItem.type}\nVencimento: ${format(new Date(selectedItem.due_date), 'dd/MM/yyyy', { locale: ptBR })}\nDescrição: ${selectedItem.description || 'N/A'}`,
        urgency: 3, impact: 3, priority: 3, status: 1, type: 1
      };
      await createTicket.mutateAsync(ticketData);
      toast({ title: "✅ Ticket criado com sucesso!", description: "O ticket foi criado no GLPI." });
      setShowGLPIConfirm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({ title: "❌ Erro ao criar ticket", description: "Não foi possível criar o ticket no GLPI.", variant: "destructive" });
    }
  };

  const getDaysUntilDue = (dueDate: string) => differenceInDays(new Date(dueDate), new Date());

  const getStatusIcon = (daysUntil: number) => {
    if (daysUntil < 0) return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    if (daysUntil < 7) return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    if (daysUntil < 10) return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  };

  const getStatusLabel = (daysUntil: number) => {
    if (daysUntil < 0) return { text: 'Vencido', cls: 'border-red-500/30 text-red-400 bg-red-500/10' };
    if (daysUntil < 7) return { text: 'Crítico', cls: 'border-amber-500/30 text-amber-400 bg-amber-500/10' };
    if (daysUntil < 10) return { text: 'Atenção', cls: 'border-amber-400/30 text-amber-300 bg-amber-400/10' };
    return { text: 'A Vencer', cls: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' };
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      'Backup': 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      'Manutenção': 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      'Atualização': 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      'Renovação': 'border-orange-500/30 text-orange-400 bg-orange-500/10',
      'Instalação': 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      'Configuração': 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
      'Monitoramento': 'border-teal-500/30 text-teal-400 bg-teal-500/10',
      'Suporte': 'border-pink-500/30 text-pink-400 bg-pink-500/10',
    };
    return typeColors[type] || 'border-muted text-muted-foreground bg-muted/30';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === '' || typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueTypes = [...new Set(items.map(item => item.type))];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar título ou empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs bg-background border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos</SelectItem>
              <SelectItem value="pending" className="text-xs">Pendente</SelectItem>
              <SelectItem value="completed" className="text-xs">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os tipos</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs h-8 px-3">Título</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3">Empresa</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3">Tipo</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3">Vencimento</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3 w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => {
                const daysUntil = getDaysUntilDue(item.due_date);
                const statusInfo = getStatusLabel(daysUntil);
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <TableRow className="border-border hover:bg-muted/30 cursor-default group">
                        <TableCell className="py-1.5 px-3">
                          <span className="text-xs font-medium text-foreground line-clamp-1">{item.title}</span>
                        </TableCell>
                        <TableCell className="py-1.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground line-clamp-1">{item.company}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-3">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getTypeBadge(item.type)}`}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 px-3">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${statusInfo.cls}`}>
                            {getStatusIcon(daysUntil)}
                            {statusInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">
                              {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({daysUntil >= 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d atrás`})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-3">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setShowEditDialog(true); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-primary" title="Editar">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenGLPITicket(item)} className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-400" title="Criar ticket GLPI">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setShowWhatsAppDialog(true); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-400" title="WhatsApp">
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" title="Excluir">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="max-w-sm">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">{item.title}</p>
                        <p><span className="text-muted-foreground">Empresa:</span> {item.company}</p>
                        <p><span className="text-muted-foreground">Tipo:</span> {item.type}</p>
                        <p><span className="text-muted-foreground">Vencimento:</span> {format(new Date(item.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                        {item.description && <p><span className="text-muted-foreground">Descrição:</span> {item.description}</p>}
                        <p><span className="text-muted-foreground">Situação:</span> {statusInfo.text} — {daysUntil >= 0 ? `faltam ${daysUntil} dias` : `vencido há ${Math.abs(daysUntil)} dias`}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TableBody>
          </Table>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>
      </div>

      {editingItem && <ScheduleDialog open={showEditDialog} onOpenChange={setShowEditDialog} editingItem={editingItem} onUpdate={onUpdate} />}
      {selectedItem && <WhatsAppScheduleDialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog} scheduleItem={selectedItem} />}

      <AlertDialog open={showGLPIConfirm} onOpenChange={setShowGLPIConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4 text-primary" />
              Criar Ticket GLPI
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Criar ticket para "{selectedItem?.title}" — {selectedItem?.company}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreateTicket} className="h-8 text-xs">Criar Ticket</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};
