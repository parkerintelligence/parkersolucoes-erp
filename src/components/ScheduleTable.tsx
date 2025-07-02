import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Calendar, Building, Search } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      'Atualização': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}>{type}</Badge>;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === '' || typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueTypes = [...new Set(items.map(item => item.type))];

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Lista de Agendamentos
        </CardTitle>
        
        {/* Filtros */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por título ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
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
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const daysUntil = getDaysUntilDue(item.due_date);
              
              return (
                <TableRow key={item.id} className="hover:bg-blue-50">
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      {item.company}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {daysUntil >= 0 ? `${daysUntil} dias` : `${Math.abs(daysUntil)} dias atrás`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status, daysUntil)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const newStatus = item.status === 'completed' ? 'pending' : 'completed';
                          onUpdate(item.id, { status: newStatus });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento encontrado com os filtros aplicados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};