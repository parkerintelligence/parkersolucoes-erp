import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';

export const ZabbixServicesGrid = () => {
  const { services, isLoading } = useZabbixIntegration();

  const getServiceStatus = (status: string) => {
    switch (status) {
      case '0': return { text: 'OK', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case '1': return { text: 'Problema', color: 'bg-red-100 text-red-800', icon: XCircle };
      default: return { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const getAlgorithmText = (algorithm: string) => {
    const algorithms: Record<string, string> = {
      '0': 'Não calcular',
      '1': 'Problema se um filho tem problema',
      '2': 'Problema se todos filhos têm problema'
    };
    return algorithms[algorithm] || 'Desconhecido';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando serviços...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Serviços IT ({services.length})
          </h2>
          <p className="text-muted-foreground">Monitoramento de serviços de negócio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((service: any) => {
          const status = getServiceStatus(service.status);
          const StatusIcon = status.icon;
          
          return (
            <Card key={service.serviceid} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{service.name}</span>
                  <Badge className={status.color} variant="outline">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Algoritmo de Cálculo</div>
                    <p className="text-sm text-muted-foreground">
                      {getAlgorithmText(service.algorithm)}
                    </p>
                  </div>

                  {service.parents && service.parents.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Serviços Pai</div>
                      <div className="flex flex-wrap gap-1">
                        {service.parents.map((parent: any) => (
                          <Badge key={parent.serviceid} variant="outline" className="text-xs">
                            {parent.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.dependencies && service.dependencies.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Dependências</div>
                      <div className="flex flex-wrap gap-1">
                        {service.dependencies.map((dep: any) => (
                          <Badge key={dep.serviceid} variant="secondary" className="text-xs">
                            {dep.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>ID: {service.serviceid}</span>
                    <Button size="sm" variant="outline">
                      Configurar SLA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
            <p className="text-muted-foreground">
              Configure serviços IT no Zabbix para monitoramento de negócio e SLA
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};