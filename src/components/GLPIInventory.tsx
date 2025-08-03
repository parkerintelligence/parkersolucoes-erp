import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Wifi, 
  RefreshCw,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPIInventoryFilters } from './GLPIInventoryFilters';
import { toast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  location?: string;
  status: string;
  serial?: string;
  model?: string;
}

const GLPIInventory = () => {
  const { tickets } = useGLPIExpanded();
  const [filters, setFilters] = React.useState({
    type: '',
    location: '',
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = React.useState(false);

  const assets = tickets.data?.inventory || [];

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'computer':
        return <Monitor className="h-4 w-4" />;
      case 'processor':
        return <Cpu className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssets = assets.filter((asset: InventoryItem) => {
    if (filters.type && asset.type !== filters.type) return false;
    if (filters.location && asset.location !== filters.location) return false;
    if (filters.status && asset.status !== filters.status) return false;
    if (filters.search && !asset.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleRefresh = async () => {
    try {
      await tickets.refetch();
      toast({
        title: "Dados atualizados",
        description: "Inventário atualizado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o inventário.",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    if (!assets || assets.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há itens de inventário para exportar.",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['ID', 'Nome', 'Tipo', 'Localização', 'Status', 'Série', 'Modelo'].join(','),
      ...assets.map((asset: InventoryItem) => [
        asset.id,
        asset.name,
        asset.type,
        asset.location || 'N/A',
        asset.status,
        asset.serial || 'N/A',
        asset.model || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glpi-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (tickets.isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Carregando inventário...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <p>Erro ao carregar inventário: {tickets.error.message}</p>
            <Button 
              onClick={handleRefresh}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Inventário GLPI
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t border-gray-700 pt-4">
            <GLPIInventoryFilters
              onFiltersChange={setFilters}
              onRefresh={handleRefresh}
            />
          </CardContent>
        )}
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-lg font-medium mb-2">Nenhum item encontrado</p>
              <p>Não há itens de inventário disponíveis no momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Localização</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Série</TableHead>
                  <TableHead className="text-gray-300">Modelo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset: InventoryItem) => (
                  <TableRow key={asset.id} className="border-gray-700">
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(asset.type)}
                        {asset.type}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {asset.name}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {asset.location || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono">
                      {asset.serial || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {asset.model || 'N/A'}
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

export { GLPIInventory };
