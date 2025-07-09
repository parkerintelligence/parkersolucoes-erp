import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  Monitor,
  Server,
  Smartphone,
  Laptop,
  Printer,
  Building2
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { useState, useMemo } from 'react';

export const GLPIInventory = () => {
  const { computers, monitors, printers, networkEquipment, entities } = useGLPIExpanded();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getEntityName = (entityId: number) => {
    const entity = entities.data?.find(e => e.id === entityId);
    return entity?.name || `Entidade ${entityId}`;
  };

  const allInventoryItems = useMemo(() => {
    const items: any[] = [];
    
    if (computers.data) {
      computers.data.forEach(item => items.push({ ...item, type: 'computer', icon: Monitor }));
    }
    if (monitors.data) {
      monitors.data.forEach(item => items.push({ ...item, type: 'monitor', icon: Monitor }));
    }
    if (printers.data) {
      printers.data.forEach(item => items.push({ ...item, type: 'printer', icon: Printer }));
    }
    if (networkEquipment.data) {
      networkEquipment.data.forEach(item => items.push({ ...item, type: 'network', icon: Server }));
    }

    return items;
  }, [computers.data, monitors.data, printers.data, networkEquipment.data]);

  const filteredItems = useMemo(() => {
    return allInventoryItems.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.id?.toString().includes(searchTerm);
      
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesEntity = entityFilter === 'all' || item.entities_id?.toString() === entityFilter;
      
      return matchesSearch && matchesType && matchesEntity;
    });
  }, [allInventoryItems, searchTerm, typeFilter, entityFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'computer':
        return <Laptop className="h-4 w-4" />;
      case 'monitor':
        return <Monitor className="h-4 w-4" />;
      case 'phone':
        return <Smartphone className="h-4 w-4" />;
      case 'printer':
        return <Printer className="h-4 w-4" />;
      case 'network':
        return <Server className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      computer: 'Computador',
      monitor: 'Monitor',
      phone: 'Telefone',
      printer: 'Impressora',
      network: 'Rede'
    };
    return typeNames[type] || type;
  };

  const getStatusBadge = (status: number) => {
    // Simplified status mapping
    switch (status) {
      case 1:
        return <Badge className="bg-green-600 text-white">Ativo</Badge>;
      case 2:
        return <Badge className="bg-yellow-600 text-white">Em Uso</Badge>;
      case 3:
        return <Badge className="bg-red-600 text-white">Inativo</Badge>;
      default:
        return <Badge className="bg-slate-600 text-white">Status {status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 bg-slate-900 min-h-screen p-6">
      <Card className="bg-slate-800 border-slate-700 shadow-xl">
        <CardHeader className="bg-slate-700 text-white border-b border-slate-600">
          <CardTitle className="flex items-center gap-2 text-white">
            <Monitor className="h-6 w-6" />
            Inventário de Ativos GLPI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-slate-800">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por ID ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="text-white">Todos Tipos</SelectItem>
                <SelectItem value="computer" className="text-white">Computador</SelectItem>
                <SelectItem value="monitor" className="text-white">Monitor</SelectItem>
                <SelectItem value="phone" className="text-white">Telefone</SelectItem>
                <SelectItem value="printer" className="text-white">Impressora</SelectItem>
                <SelectItem value="network" className="text-white">Rede</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="text-white">Todas Entidades</SelectItem>
                {entities.data?.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()} className="text-white">
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              computers.refetch();
              monitors.refetch();
              printers.refetch();
              networkEquipment.refetch();
            }} className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Resultados */}
          <div className="text-sm text-slate-400">
            Mostrando {filteredItems.length} itens de inventário
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Inventário */}
      <div className="bg-slate-800 border border-slate-700 overflow-hidden shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
              <TableHead className="w-[80px] text-white font-semibold">ID</TableHead>
              <TableHead className="text-white font-semibold">Nome</TableHead>
              <TableHead className="w-[120px] text-white font-semibold">Tipo</TableHead>
              <TableHead className="w-[140px] text-white font-semibold">Entidade</TableHead>
              <TableHead className="w-[120px] text-white font-semibold">Status</TableHead>
              <TableHead className="w-[100px] text-white font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={`${item.type}-${item.id}`} className="hover:bg-slate-700 transition-colors border-b border-slate-600 text-white">
                <TableCell className="font-medium text-white">#{item.id}</TableCell>
                <TableCell className="text-white">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    {item.name || 'Sem nome'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">
                    {getTypeName(item.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 bg-slate-700 text-slate-200 border-slate-600">
                    <Building2 className="h-3 w-3" />
                    {getEntityName(item.entities_id)}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(item.states_id || 1)}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        className="text-slate-200 hover:bg-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                          {getTypeIcon(selectedItem?.type)}
                          {getTypeName(selectedItem?.type)} #{selectedItem?.id} - {selectedItem?.name}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedItem && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium text-slate-300">ID</label>
                              <p className="mt-1 text-sm text-slate-400">#{selectedItem.id}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Nome</label>
                              <p className="mt-1 text-sm text-slate-400">{selectedItem.name || 'Sem nome'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Tipo</label>
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">
                                  {getTypeName(selectedItem.type)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-slate-300">Entidade</label>
                              <div className="mt-1">
                                <Badge variant="outline" className="gap-1 bg-slate-700 text-slate-200 border-slate-600">
                                  <Building2 className="h-3 w-3" />
                                  {getEntityName(selectedItem.entities_id)}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-300">Status</label>
                              <div className="mt-1">{getStatusBadge(selectedItem.states_id || 1)}</div>
                            </div>
                          </div>

                          {selectedItem.serial && (
                            <div>
                              <label className="text-sm font-medium text-slate-300">Número de Série</label>
                              <p className="mt-1 text-sm text-slate-400">{selectedItem.serial}</p>
                            </div>
                          )}

                          {selectedItem.otherserial && (
                            <div>
                              <label className="text-sm font-medium text-slate-300">Número de Inventário</label>
                              <p className="mt-1 text-sm text-slate-400">{selectedItem.otherserial}</p>
                            </div>
                          )}

                          {selectedItem.comment && (
                            <div>
                              <label className="text-sm font-medium text-slate-300">Comentários</label>
                              <div className="mt-2 p-4 bg-slate-700">
                                <p className="text-sm whitespace-pre-wrap text-slate-400">{selectedItem.comment}</p>
                              </div>
                            </div>
                          )}
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
    </div>
  );
};
