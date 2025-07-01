
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Monitor, 
  Printer, 
  Server, 
  HardDrive,
  Wifi,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GLPIInventory = () => {
  const { 
    computers, 
    monitors, 
    printers, 
    networkEquipment, 
    software 
  } = useGLPIExpanded();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filterAssets = (assets: any[]) => {
    if (!assets) return [];
    
    return assets.filter((asset) => {
      const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.id?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && asset.is_deleted === 0) ||
                           (statusFilter === 'deleted' && asset.is_deleted === 1);
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredComputers = useMemo(() => filterAssets(computers.data), [computers.data, searchTerm, statusFilter]);
  const filteredMonitors = useMemo(() => filterAssets(monitors.data), [monitors.data, searchTerm, statusFilter]);
  const filteredPrinters = useMemo(() => filterAssets(printers.data), [printers.data, searchTerm, statusFilter]);
  const filteredNetworkEquipment = useMemo(() => filterAssets(networkEquipment.data), [networkEquipment.data, searchTerm, statusFilter]);
  const filteredSoftware = useMemo(() => filterAssets(software.data), [software.data, searchTerm, statusFilter]);

  const FilterControls = () => (
    <div className="flex flex-wrap gap-4 items-center mb-4">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nome, serial ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="deleted">Excluídos</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={() => {
        computers.refetch();
        monitors.refetch();
        printers.refetch();
        networkEquipment.refetch();
        software.refetch();
      }}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Atualizar
      </Button>
    </div>
  );

  const ComputersTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Serial</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Última Modificação</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredComputers.map((computer) => (
          <TableRow key={computer.id} className="hover:bg-blue-50">
            <TableCell className="font-medium">{computer.id}</TableCell>
            <TableCell>{computer.name}</TableCell>
            <TableCell>{computer.serial || '-'}</TableCell>
            <TableCell>{computer.contact || '-'}</TableCell>
            <TableCell>{computer.locations_id || '-'}</TableCell>
            <TableCell>{computer.states_id || '-'}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {computer.date_mod ? format(new Date(computer.date_mod), 'dd/MM/yy', { locale: ptBR }) : '-'}
            </TableCell>
            <TableCell>
              {computer.is_deleted === 0 ? 
                <Badge className="bg-green-100 text-green-800">Ativo</Badge> : 
                <Badge className="bg-red-100 text-red-800">Excluído</Badge>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const MonitorsTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Serial</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Conexões</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredMonitors.map((monitor) => (
          <TableRow key={monitor.id} className="hover:bg-blue-50">
            <TableCell className="font-medium">{monitor.id}</TableCell>
            <TableCell>{monitor.name}</TableCell>
            <TableCell>{monitor.serial || '-'}</TableCell>
            <TableCell>{monitor.size ? `${monitor.size}"` : '-'}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {monitor.have_hdmi && <Badge variant="outline" className="text-xs">HDMI</Badge>}
                {monitor.have_dvi && <Badge variant="outline" className="text-xs">DVI</Badge>}
                {monitor.have_displayport && <Badge variant="outline" className="text-xs">DP</Badge>}
              </div>
            </TableCell>
            <TableCell>{monitor.locations_id || '-'}</TableCell>
            <TableCell>
              {monitor.is_deleted === 0 ? 
                <Badge className="bg-green-100 text-green-800">Ativo</Badge> : 
                <Badge className="bg-red-100 text-red-800">Excluído</Badge>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const PrintersTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Serial</TableHead>
          <TableHead>Conexões</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPrinters.map((printer) => (
          <TableRow key={printer.id} className="hover:bg-blue-50">
            <TableCell className="font-medium">{printer.id}</TableCell>
            <TableCell>{printer.name}</TableCell>
            <TableCell>{printer.serial || '-'}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {printer.have_usb && <Badge variant="outline" className="text-xs">USB</Badge>}
                {printer.have_ethernet && <Badge variant="outline" className="text-xs">Ethernet</Badge>}
                {printer.have_wifi && <Badge variant="outline" className="text-xs">Wi-Fi</Badge>}
              </div>
            </TableCell>
            <TableCell>{printer.locations_id || '-'}</TableCell>
            <TableCell>
              {printer.is_deleted === 0 ? 
                <Badge className="bg-green-100 text-green-800">Ativo</Badge> : 
                <Badge className="bg-red-100 text-red-800">Excluído</Badge>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const NetworkTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Serial</TableHead>
          <TableHead>Firmware</TableHead>
          <TableHead>RAM</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredNetworkEquipment.map((equipment) => (
          <TableRow key={equipment.id} className="hover:bg-blue-50">
            <TableCell className="font-medium">{equipment.id}</TableCell>
            <TableCell>{equipment.name}</TableCell>
            <TableCell>{equipment.serial || '-'}</TableCell>
            <TableCell>{equipment.firmware || '-'}</TableCell>
            <TableCell>{equipment.ram || '-'}</TableCell>
            <TableCell>{equipment.locations_id || '-'}</TableCell>
            <TableCell>
              {equipment.is_deleted === 0 ? 
                <Badge className="bg-green-100 text-green-800">Ativo</Badge> : 
                <Badge className="bg-red-100 text-red-800">Excluído</Badge>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const SoftwareTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Comentário</TableHead>
          <TableHead>Fabricante</TableHead>
          <TableHead>Entidade</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSoftware.map((sw) => (
          <TableRow key={sw.id} className="hover:bg-blue-50">
            <TableCell className="font-medium">{sw.id}</TableCell>
            <TableCell>{sw.name}</TableCell>
            <TableCell className="max-w-xs truncate">{sw.comment || '-'}</TableCell>
            <TableCell>{sw.manufacturers_id || '-'}</TableCell>
            <TableCell>{sw.entities_id || '-'}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {sw.date_creation ? format(new Date(sw.date_creation), 'dd/MM/yy', { locale: ptBR }) : '-'}
            </TableCell>
            <TableCell>
              {sw.is_deleted === 0 ? 
                <Badge className="bg-green-100 text-green-800">Ativo</Badge> : 
                <Badge className="bg-red-100 text-red-800">Excluído</Badge>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Inventário Completo de Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterControls />
        
        <Tabs defaultValue="computers" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="computers" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Computadores ({filteredComputers.length})
            </TabsTrigger>
            <TabsTrigger value="monitors" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitores ({filteredMonitors.length})
            </TabsTrigger>
            <TabsTrigger value="printers" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Impressoras ({filteredPrinters.length})
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Rede ({filteredNetworkEquipment.length})
            </TabsTrigger>
            <TabsTrigger value="software" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Software ({filteredSoftware.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="computers" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <ComputersTable />
            </div>
          </TabsContent>

          <TabsContent value="monitors" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <MonitorsTable />
            </div>
          </TabsContent>

          <TabsContent value="printers" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <PrintersTable />
            </div>
          </TabsContent>

          <TabsContent value="network" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <NetworkTable />
            </div>
          </TabsContent>

          <TabsContent value="software" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <SoftwareTable />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
