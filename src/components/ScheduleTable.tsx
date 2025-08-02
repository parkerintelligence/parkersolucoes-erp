import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Calendar, Building, Search, ExternalLink, MessageCircle, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<ScheduleItem | null>(null);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = React.useState(false);
  const [showGLPIConfirm, setShowGLPIConfirm] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ScheduleItem | null>(null);
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
  const getTypeBadge = (type: string) => {
    // Usar cores escuras seguindo o padrão do sistema
    const typeColors = {
      'Backup': 'bg-blue-800 text-blue-100 border-blue-700',
      'Manutenção': 'bg-green-800 text-green-100 border-green-700',
      'Atualização': 'bg-purple-800 text-purple-100 border-purple-700',
      'Renovação': 'bg-orange-800 text-orange-100 border-orange-700',
      'Instalação': 'bg-cyan-800 text-cyan-100 border-cyan-700',
      'Configuração': 'bg-indigo-800 text-indigo-100 border-indigo-700',
      'Monitoramento': 'bg-emerald-800 text-emerald-100 border-emerald-700',
      'Suporte': 'bg-pink-800 text-pink-100 border-pink-700',
      'Migração': 'bg-violet-800 text-violet-100 border-violet-700',
      'Teste': 'bg-amber-800 text-amber-100 border-amber-700'
    };
    
    // Se o tipo não estiver mapeado, gerar uma cor baseada no hash do texto
    const defaultColor = typeColors[type as keyof typeof typeColors];
    if (defaultColor) {
      return <Badge className={defaultColor}>{type}</Badge>;
    }
    
    // Gerar cor automática para tipos não mapeados usando cores escuras
    const hash = type.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colors = [
      'bg-slate-800 text-slate-100 border-slate-700',
      'bg-gray-800 text-gray-100 border-gray-700',
      'bg-zinc-800 text-zinc-100 border-zinc-700',
      'bg-stone-800 text-stone-100 border-stone-700',
      'bg-red-800 text-red-100 border-red-700',
      'bg-yellow-800 text-yellow-100 border-yellow-700',
      'bg-lime-800 text-lime-100 border-lime-700',
      'bg-teal-800 text-teal-100 border-teal-700',
      'bg-sky-800 text-sky-100 border-sky-700',
      'bg-rose-800 text-rose-100 border-rose-700'
    ];
    
    const colorIndex = hash % colors.length;
    return <Badge className={colors[colorIndex]}>{type}</Badge>;
  };

  const getStatusIcon = (daysUntil: number) => {
    if (daysUntil < 0) {
      // Vencido - ícone de X vermelho
      return (
        <div className="flex items-center gap-1" title="Vencido">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-xs text-red-500 font-medium whitespace-nowrap">Vencido</span>
        </div>
      );
    }
    if (daysUntil < 7) {
      // Crítico <7 dias - ícone de alerta amarelo
      return (
        <div className="flex items-center gap-1" title="Crítico - vence em menos de 7 dias">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span className="text-xs text-yellow-500 font-medium whitespace-nowrap">Crítico</span>
        </div>
      );
    }
    if (daysUntil >= 10) {
      // Bom >10 dias - ícone de check verde
      return (
        <div className="flex items-center gap-1" title="Ok - vence em mais de 10 dias">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-xs text-green-500 font-medium whitespace-nowrap">A Vencer</span>
        </div>
      );
    }
    // Entre 7-10 dias - ícone de relógio amarelo
    return (
      <div className="flex items-center gap-1" title="Atenção - vence entre 7-10 dias">
        <Clock className="h-5 w-5 text-yellow-500" />
        <span className="text-xs text-yellow-500 font-medium whitespace-nowrap">Atenção</span>
      </div>
    );
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
              <TableHead className="py-2 text-gray-300">Status</TableHead>
              <TableHead className="py-2 text-gray-300">Vencimento</TableHead>
              <TableHead className="py-2 w-32 text-gray-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => {
            const daysUntil = getDaysUntilDue(item.due_date);
            return <TableRow key={item.id} className="h-12 hover:bg-gray-700 border-gray-700">
                  <TableCell className="font-medium py-2 text-white max-w-xs">
                    <div className="whitespace-normal break-words">{item.title}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-300 whitespace-normal break-words">{item.company}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="py-2">{getStatusIcon(daysUntil)}</TableCell>
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
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreateTicket} className="bg-blue-800 hover:bg-blue-700 text-white">
              Criar Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
};
