import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Server, AlertTriangle } from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ZabbixMaintenanceGrid = () => {
  const { maintenances, isLoading } = useZabbixIntegration();

  const getMaintenanceStatus = (maintenance: any) => {
    const now = Date.now() / 1000;
    const activeSince = parseInt(maintenance.active_since);
    const activeTill = parseInt(maintenance.active_till);
    
    if (now >= activeSince && now <= activeTill) {
      return { status: 'active', text: 'Ativa', color: 'bg-green-100 text-green-800' };
    } else if (now < activeSince) {
      return { status: 'scheduled', text: 'Agendada', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'completed', text: 'Concluída', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando manutenções...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Janelas de Manutenção ({maintenances.length})
          </h2>
          <p className="text-muted-foreground">Períodos de manutenção programada e histórico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {maintenances.map((maintenance: any) => {
          const status = getMaintenanceStatus(maintenance);
          
          return (
            <Card key={maintenance.maintenanceid} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{maintenance.name}</span>
                  <Badge className={status.color} variant="outline">
                    {status.text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {maintenance.description && (
                  <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Início
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(parseInt(maintenance.active_since) * 1000), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Fim
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(parseInt(maintenance.active_till) * 1000), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {maintenance.hosts && maintenance.hosts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Server className="h-4 w-4" />
                      Hosts Afetados ({maintenance.hosts.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {maintenance.hosts.slice(0, 3).map((host: any) => (
                        <Badge key={host.hostid} variant="outline" className="text-xs">
                          {host.name}
                        </Badge>
                      ))}
                      {maintenance.hosts.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{maintenance.hosts.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>ID: {maintenance.maintenanceid}</span>
                    <Button size="sm" variant="outline">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {maintenances.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma manutenção encontrada</h3>
            <p className="text-muted-foreground">
              Configure janelas de manutenção no Zabbix para pausar alertas durante atualizações
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};