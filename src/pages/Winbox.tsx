import { LayoutDashboard, Wifi, Shield, Network, Users, Power } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MikrotikDashboard } from "@/components/mikrotik/MikrotikDashboard";
import { MikrotikInterfaces } from "@/components/mikrotik/MikrotikInterfaces";
import { MikrotikFirewall } from "@/components/mikrotik/MikrotikFirewall";
import { MikrotikNAT } from "@/components/mikrotik/MikrotikNAT";
import { MikrotikDHCP } from "@/components/mikrotik/MikrotikDHCP";
import { MikrotikClientSelector } from "@/components/mikrotik/MikrotikClientSelector";
import { useMikrotikContext } from "@/contexts/MikrotikContext";

const Winbox = () => {
  const { selectedClient, disconnectClient } = useMikrotikContext();

  if (!selectedClient) {
    return <MikrotikClientSelector />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">MikroTik - {selectedClient.name}</h1>
              <Badge variant="default">Conectado</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedClient.base_url}
            </p>
          </div>
          <Button variant="outline" onClick={disconnectClient}>
            <Power className="mr-2 h-4 w-4" />
            Desconectar
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="dhcp" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              DHCP
            </TabsTrigger>
            <TabsTrigger value="interfaces" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Interfaces
            </TabsTrigger>
            <TabsTrigger value="firewall" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Firewall
            </TabsTrigger>
            <TabsTrigger value="nat" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              NAT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <MikrotikDashboard />
          </TabsContent>

          <TabsContent value="dhcp" className="mt-6">
            <MikrotikDHCP />
          </TabsContent>

          <TabsContent value="interfaces" className="mt-6">
            <MikrotikInterfaces />
          </TabsContent>

          <TabsContent value="firewall" className="mt-6">
            <MikrotikFirewall />
          </TabsContent>

          <TabsContent value="nat" className="mt-6">
            <MikrotikNAT />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Winbox;
