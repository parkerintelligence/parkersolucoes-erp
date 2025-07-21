
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Monitor,
  Server,
  Smartphone,
  Laptop,
  Printer,
  Building2
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPIInventoryFilters } from './GLPIInventoryFilters';
import React, { useState, useMemo } from 'react';

export const GLPIInventory = () => {
  const { computers, monitors, printers, networkEquipment, entities } = useGLPIExpanded();
  const [filters, setFilters] = useState({});
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

  const handleRefresh = () => {
    computers.refetch();
    monitors.refetch();
    printers.refetch();
    networkEquipment.refetch();
  };

  return (
    <div className="space-y-4">
      <GLPIInventoryFilters
        onFiltersChange={setFilters}
        onRefresh={handleRefresh}
        isLoading={computers.isLoading || monitors.isLoading}
        totalItems={allInventoryItems.length}
      />

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Inventário de Ativos GLPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allInventoryItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-lg font-medium mb-2">Nenhum item encontrado</p>
              <p>Não há itens de inventário disponíveis no momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Entidade</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInventoryItems.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} className="border-gray-700">
                    <TableCell className="text-gray-300 font-mono">
                      #{item.id}
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        {item.name || 'Sem nome'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-700 text-gray-200 border-gray-600">
                        {getTypeName(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 bg-gray-700 text-gray-200 border-gray-600">
                        <Building2 className="h-3 w-3" />
                        {getEntityName(item.entities_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.states_id || 1)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-white">
                              {getTypeIcon(selectedItem?.type)}
                              {getTypeName(selectedItem?.type)} #{selectedItem?.id}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-300">Nome</label>
                                  <p className="text-gray-400">{selectedItem.name || 'Sem nome'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-300">Tipo</label>
                                  <div className="mt-1">
                                    <Badge variant="outline" className="bg-gray-700 text-gray-200 border-gray-600">
                                      {getTypeName(selectedItem.type)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {selectedItem.serial && (
                                <div>
                                  <label className="text-sm font-medium text-gray-300">Número de Série</label>
                                  <p className="text-gray-400">{selectedItem.serial}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
