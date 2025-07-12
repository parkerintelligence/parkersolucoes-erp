import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Calendar, Building, Search, ExternalLink, MessageCircle } from 'lucide-react';
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
export const ScheduleTable = ({
  items,
  onUpdate,
  onDelete
}: ScheduleTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [showGLPIConfirm, setShowGLPIConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const {
    createTicket
  } = useGLPIExpanded();
  const handleOpenGLPITicket = (item: ScheduleItem) => {
    setSelectedItem(item);
    setShowGLPIConfirm(true);
  };
  const confirmCreateTicket = async () => {
    if (!selectedItem) return;
    try {
      const ticketData = {
        name: `${selectedItem.title} - ${selectedItem.type}`,
        content: `Empresa: ${selectedItem.company}\nTipo: ${selectedItem.type}\nVencimento: ${format(new Date(selectedItem.due_date), 'dd/MM/yyyy', {
          locale: ptBR
        })}\nDescrição: ${selectedItem.description || 'N/A'}`,
        urgency: 3,
        impact: 3,
        priority: 3,
        status: 1,
        type: 1
      };
      await createTicket.mutateAsync(ticketData);
      toast({
        title: "✅ Ticket criado com sucesso!",
        description: "O ticket foi criado no GLPI."
      });
      setShowGLPIConfirm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "❌ Erro ao criar ticket",
        description: "Não foi possível criar o ticket no GLPI. Verifique a configuração.",
        variant: "destructive"
      });
    }
  };
  const handleWhatsAppShare = (item: ScheduleItem) => {
    setSelectedItem(item);
    setShowWhatsAppDialog(true);
  };
  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };
  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };
  const getStatusBadge = (status: string, daysUntil: number) => {
    if (status === 'completed') {
      return <Badge className="bg-green-800 text-green-100 border-green-700">Concluído</Badge>;
    }
    if (daysUntil < 0) {
      return <Badge className="bg-red-800 text-red-100 border-red-700">Vencido</Badge>;
    }
    if (daysUntil <= 30) {
      return <Badge className="bg-orange-800 text-orange-100 border-orange-700">Crítico</Badge>;
    }
    return <Badge className="bg-blue-800 text-blue-100 border-blue-700">Pendente</Badge>;
  };
  const getTypeBadge = (type: string, daysUntil: number) => {
    // Cores baseadas no status de vencimento
    let badgeColor = '';
    if (daysUntil < 0) {
      // Vencido - vermelho
      badgeColor = 'bg-red-800 text-red-100 border-red-700';
    } else {
      // A vencer - verde
      badgeColor = 'bg-green-800 text-green-100 border-green-700';
    }
    
    return <Badge className={badgeColor}>{type}</Badge>;
  };
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === '' || typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  const uniqueTypes = [...new Set(items.map(item => item.type))];
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="rounded-sm bg-gray-800">
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5" />
          Lista de Agendamentos
        </CardTitle>
        
        {/* Filtros */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por título ou empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-600">Todos</SelectItem>
              <SelectItem value="pending" className="text-white hover:bg-gray-600">Pendente</SelectItem>
              <SelectItem value="completed" className="text-white hover:bg-gray-600">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-600">Todos os tipos</SelectItem>
              {uniqueTypes.map(type => <SelectItem key={type} value={type} className="text-white hover:bg-gray-600">{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="h-10 border-gray-700">
              <TableHead className="bg-gray-800 py-2 text-gray-300">Título</TableHead>
              <TableHead className="py-2 text-gray-300">Empresa</TableHead>
              <TableHead className="py-2 text-gray-300">Tipo</TableHead>
              <TableHead className="py-2 text-gray-300">Vencimento</TableHead>
              <TableHead className="py-2 w-32 text-gray-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => {
            const daysUntil = getDaysUntilDue(item.due_date);
            const isUrgent = daysUntil <= 7;
            const isGood = daysUntil > 7;
            return <TableRow key={item.id} className={`h-12 hover:bg-gray-700 border-gray-700 ${isUrgent ? 'bg-red-900/20 border-l-4 border-l-red-500' : isGood ? 'bg-green-900/20 border-l-4 border-l-green-500' : ''}`}>
                  <TableCell className="font-medium py-2 text-white">{item.title}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{item.company}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">{getTypeBadge(item.type, daysUntil)}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-white">
                        {format(new Date(item.due_date), 'dd/MM/yyyy', {
                      locale: ptBR
                    })}
                      </div>
                      <div className="text-xs text-gray-400">
                        ({daysUntil >= 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d atrás`})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleEditItem(item)} className="h-8 w-8 text-white bg-blue-800 hover:bg-blue-700 border-blue-700" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleOpenGLPITicket(item)} className="h-8 w-8 bg-blue-800 hover:bg-blue-700 text-white border-blue-700" title="Criar ticket GLPI">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-8 w-8 bg-red-800 hover:bg-red-700 text-white" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleWhatsAppShare(item)} className="h-8 w-8 bg-green-700 hover:bg-green-600 text-white border-green-600" title="Compartilhar via WhatsApp">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
        
        {filteredItems.length === 0 && <div className="text-center py-8 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento encontrado com os filtros aplicados.</p>
          </div>}
      </CardContent>

      {/* Dialog para edição */}
      {editingItem && <ScheduleDialog open={showEditDialog} onOpenChange={setShowEditDialog} editingItem={editingItem} onUpdate={onUpdate} />}

      {/* Dialog para WhatsApp */}
      {selectedItem && <WhatsAppScheduleDialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog} scheduleItem={selectedItem} />}

      {/* Dialog de confirmação GLPI */}
      <AlertDialog open={showGLPIConfirm} onOpenChange={setShowGLPIConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              Criar Ticket GLPI
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja criar um ticket no GLPI para o agendamento "{selectedItem?.title}" da empresa "{selectedItem?.company}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreateTicket} className="bg-blue-600 hover:bg-blue-700">
              Criar Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
};