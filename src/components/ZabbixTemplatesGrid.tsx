import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Server, Activity, AlertTriangle, Search } from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';
import { useState } from 'react';

export const ZabbixTemplatesGrid = () => {
  const { templates, isLoading } = useZabbixIntegration();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter((template: any) =>
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Templates de Monitoramento ({templates.length})
          </h2>
          <p className="text-muted-foreground">Templates configurados para coleta de dados</p>
        </div>
        <div className="w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template: any) => (
          <Card key={template.templateid} className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{template.name}</span>
                <Badge variant="outline">
                  Template
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Server className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xs text-muted-foreground">Hosts</div>
                  <div className="text-sm font-medium">{template.hosts?.length || 0}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div className="text-sm font-medium">{template.items || 0}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-xs text-muted-foreground">Triggers</div>
                  <div className="text-sm font-medium">{template.triggers || 0}</div>
                </div>
              </div>

              {template.hosts && template.hosts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Hosts Vinculados:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.hosts.slice(0, 2).map((host: any) => (
                      <Badge key={host.hostid} variant="secondary" className="text-xs">
                        {host.name}
                      </Badge>
                    ))}
                    {template.hosts.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.hosts.length - 2} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>ID: {template.templateid}</span>
                  <Button size="sm" variant="outline">
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Tente ajustar o termo de busca'
                : 'Importe ou crie templates no Zabbix para monitoramento automático'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};