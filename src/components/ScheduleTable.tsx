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
      return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
    }
    if (daysUntil < 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>;
    }
    if (daysUntil <= 30) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Crítico</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pendente</Badge>;
  };
  const getTypeBadge = (type: string) => {
    const colors = {
      'Certificado SSL': 'bg-blue-100 text-blue-800 border-blue-200',
      'Licença Software': 'bg-purple-100 text-purple-800 border-purple-200',
      'Renovação Domínio': 'bg-green-100 text-green-800 border-green-200',
      'Backup': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Manutenção': 'bg-gray-100 text-gray-800 border-gray-200',
      'Atualização': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}>{type}</Badge>;
  };
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === '' || typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  const uniqueTypes = [...new Set(items.map(item => item.type))];
  return <Card className="border-blue-200">
      <CardHeader className="rounded-sm bg-gray-900">
        <CardTitle className="flex items-center gap-2 text-slate-50">
          <Calendar className="h-5 w-5" />
          Lista de Agendamentos
        </CardTitle>
        
        {/* Filtros */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar por título ou empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {uniqueTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="bg-gray-900 py-2">Título</TableHead>
              <TableHead className="py-2">Empresa</TableHead>
              <TableHead className="py-2">Tipo</TableHead>
              <TableHead className="py-2">Vencimento</TableHead>
              <TableHead className="py-2 w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => {
            const daysUntil = getDaysUntilDue(item.due_date);
            const isUrgent = daysUntil <= 7;
            const isGood = daysUntil > 7;
            return <TableRow key={item.id} className={`h-12 hover:bg-blue-50 ${isUrgent ? 'bg-red-50 border-l-4 border-l-red-500' : isGood ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
                  <TableCell className="font-medium py-2">{item.title}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      {item.company}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {format(new Date(item.due_date), 'dd/MM/yyyy', {
                      locale: ptBR
                    })}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({daysUntil >= 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d atrás`})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleEditItem(item)} className="h-8 w-8 text-slate-50 bg-blue-900 hover:bg-blue-800" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleOpenGLPITicket(item)} className="h-8 w-8 bg-blue-900 hover:bg-blue-800 text-slate-50" title="Criar ticket GLPI">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-8 w-8 bg-red-800 hover:bg-red-700 text-slate-50" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleWhatsAppShare(item)} className="h-8 w-8 bg-green-700 hover:bg-green-600 text-slate-50" title="Compartilhar via WhatsApp">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
        
        {filteredItems.length === 0 && <div className="text-center py-8 text-gray-500">
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