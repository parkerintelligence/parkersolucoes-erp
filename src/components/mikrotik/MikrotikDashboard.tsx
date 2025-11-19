import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { MikrotikResourceMonitor } from './MikrotikResourceMonitor';
import { Loader2, Wifi, Users, Clock } from 'lucide-react';

export const MikrotikDashboard = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const [identity, setIdentity] = useState<any>(null);
  const [resource, setResource] = useState<any>(null);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [dhcpLeases, setDhcpLeases] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [identityData, resourceData, interfacesData, leasesData] = await Promise.all([
        callAPI('/system/identity'),
        callAPI('/system/resource'),
        callAPI('/interface'),
        callAPI('/ip/dhcp-server/lease'),
      ]);

      if (identityData && identityData.length > 0) {
        setIdentity(identityData[0]);
      }
      if (resourceData && resourceData.length > 0) {
        setResource(resourceData[0]);
      }
      if (interfacesData) {
        setInterfaces(interfacesData);
      }
      if (leasesData) {
        setDhcpLeases(leasesData.filter((l: any) => l.status === 'bound'));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  if (loading && !identity) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const activeInterfaces = interfaces.filter((i) => !i.disabled);
  const runningInterfaces = interfaces.filter((i) => i.running);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivo</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{identity?.name || 'MikroTik'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {runningInterfaces.length} de {activeInterfaces.length} interfaces ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes DHCP</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dhcpLeases.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Dispositivos conectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resource?.uptime || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tempo ligado
            </p>
          </CardContent>
        </Card>
      </div>

      <MikrotikResourceMonitor />

      <Card>
        <CardHeader>
          <CardTitle>Interfaces Recentes</CardTitle>
          <CardDescription>Status das interfaces de rede</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {interfaces.slice(0, 5).map((iface) => (
              <div key={iface['.id']} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wifi className={`h-5 w-5 ${iface.running ? 'text-green-500' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium">{iface.name}</div>
                    <div className="text-sm text-muted-foreground">{iface.type}</div>
                  </div>
                </div>
                <Badge variant={iface.running ? 'default' : 'secondary'}>
                  {iface.running ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
