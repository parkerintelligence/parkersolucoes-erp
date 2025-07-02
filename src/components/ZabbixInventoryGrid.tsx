import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Monitor, Cpu, HardDrive, Search } from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';
import { useState } from 'react';

export const ZabbixInventoryGrid = () => {
  const { inventory, isLoading } = useZabbixIntegration();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter((item: any) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventory?.hardware?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventory?.software?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando inventário...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventário de Hardware ({inventory.length})
          </h2>
          <p className="text-muted-foreground">Inventário detalhado de hardware e software</p>
        </div>
        <div className="w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no inventário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInventory.map((item: any) => (
          <Card key={item.hostid} className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{item.name}</span>
                <Badge variant="outline">
                  {item.inventory?.os || 'SO Desconhecido'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.inventory && (
                <div className="grid grid-cols-2 gap-4">
                  {item.inventory.hardware && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Cpu className="h-4 w-4" />
                        Hardware
                      </div>
                      <p className="text-sm text-muted-foreground">{item.inventory.hardware}</p>
                    </div>
                  )}
                  
                  {item.inventory.software && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Monitor className="h-4 w-4" />
                        Software
                      </div>
                      <p className="text-sm text-muted-foreground">{item.inventory.software}</p>
                    </div>
                  )}
                  
                  {item.inventory.serialno_a && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <HardDrive className="h-4 w-4" />
                        Serial
                      </div>
                      <p className="text-sm text-muted-foreground">{item.inventory.serialno_a}</p>
                    </div>
                  )}
                  
                  {item.inventory.tag && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4" />
                        Tag
                      </div>
                      <p className="text-sm text-muted-foreground">{item.inventory.tag}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Host ID: {item.hostid}</span>
                  <Button size="sm" variant="outline">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum item encontrado' : 'Nenhum inventário disponível'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Tente ajustar o termo de busca'
                : 'Configure o inventário automático no Zabbix para coletar informações de hardware'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};