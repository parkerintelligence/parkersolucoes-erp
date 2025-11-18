
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
import { GLPIRemoteAccessDialog } from './GLPIRemoteAccessDialog';
import { useState, useMemo } from 'react';

export const GLPIInventory = () => {
  const { computers, monitors, printers, networkEquipment, entities } = useGLPIExpanded();
  const [filters, setFilters] = useState({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [remoteAccessDialogOpen, setRemoteAccessDialogOpen] = useState(false);
  const [selectedItemForRemote, setSelectedItemForRemote] = useState<any>(null);

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

  // Agrupar itens por entidade
  const itemsByEntity = useMemo(() => {
    const grouped = new Map<number, { entity: any; items: any[] }>();
    
    allInventoryItems.forEach(item => {
      const entityId = item.entities_id;
      if (!grouped.has(entityId)) {
        const entity = entities.data?.find(e => e.id === entityId);
        grouped.set(entityId, {
          entity: entity || { id: entityId, name: `Entidade ${entityId}` },
          items: []
        });
      }
      grouped.get(entityId)!.items.push(item);
    });

    return Array.from(grouped.values()).sort((a, b) => 
      a.entity.name.localeCompare(b.entity.name)
    );
  }, [allInventoryItems, entities.data]);

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
            <div className="space-y-6">
              {itemsByEntity.map(({ entity, items }) => (
                <div key={entity.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1 bg-gray-700/50 rounded-md">
                    <Building2 className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-orange-400">{entity.name}</h3>
                    <Badge variant="outline" className="ml-auto text-xs bg-gray-700 text-gray-300 border-gray-600">
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">ID</TableHead>
                        <TableHead className="text-gray-300">Nome</TableHead>
                        <TableHead className="text-gray-300">Tipo</TableHead>
                        <TableHead className="text-gray-300">Serial</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
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
                          <TableCell className="text-gray-400 text-xs font-mono">
                            {item.serial || item.otherserial || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.states_id || 1)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedItem(item)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                    title="Ver Detalhes"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
...
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItemForRemote(item);
                                  setRemoteAccessDialogOpen(true);
                                }}
                                className="border-gray-600 text-blue-400 hover:bg-blue-900/20"
                                title="Acesso Remoto"
                              >
                                <Monitor className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remote Access Dialog */}
      <GLPIRemoteAccessDialog
        open={remoteAccessDialogOpen}
        onOpenChange={setRemoteAccessDialogOpen}
        itemName={selectedItemForRemote?.name}
      />
    </div>
  );
};
