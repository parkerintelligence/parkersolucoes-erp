import { Shield, Network, Users, Power, KeyRound, Globe, FileText, LayoutDashboard, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MikrotikFirewall } from "@/components/mikrotik/MikrotikFirewall";
import { MikrotikNAT } from "@/components/mikrotik/MikrotikNAT";
import { MikrotikDHCP } from "@/components/mikrotik/MikrotikDHCP";
import { MikrotikPPP } from "@/components/mikrotik/MikrotikPPP";
import { MikrotikAddresses } from "@/components/mikrotik/MikrotikAddresses";
import { MikrotikLogs } from "@/components/mikrotik/MikrotikLogs";
import { MikrotikClientSelector } from "@/components/mikrotik/MikrotikClientSelector";
import { MikrotikDashboard } from "@/components/mikrotik/MikrotikDashboard";
import { MikrotikHeaderSelector } from "@/components/mikrotik/MikrotikHeaderSelector";
import { useMikrotikContext } from "@/contexts/MikrotikContext";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const TABS = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'dhcp', label: 'DHCP', icon: Users },
  { value: 'ppp', label: 'VPN (PPP)', icon: KeyRound },
  { value: 'addresses', label: 'IP Addresses', icon: Globe },
  { value: 'firewall', label: 'Firewall', icon: Shield },
  { value: 'nat', label: 'NAT', icon: Network },
  { value: 'logs', label: 'Logs', icon: FileText },
] as const;

const Winbox = () => {
  const { selectedClient, disconnectClient } = useMikrotikContext();
  const { callAPI } = useMikrotikAPI();
  const { confirm } = useConfirmDialog();
  const [isRebooting, setIsRebooting] = useState(false);

  if (!selectedClient) {
    return <MikrotikClientSelector />;
  }

  const handleReboot = async () => {
    const ok = await confirm({
      title: 'Confirmar Reinício',
      description: `Reiniciar o MikroTik "${selectedClient.name}"? Todos os clientes serão desconectados temporariamente.`,
      confirmText: 'Sim, Reiniciar',
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      setIsRebooting(true);
      toast({ title: "Reiniciando MikroTik", description: "O dispositivo está sendo reiniciado..." });
      await callAPI('/system/reboot', 'POST');
      toast({ title: "Reinício iniciado", description: "A conexão será restabelecida em breve." });
      setTimeout(() => disconnectClient(), 2000);
    } catch (error) {
      console.error('Erro ao reiniciar MikroTik:', error);
      toast({ title: "Erro ao reiniciar", description: error instanceof Error ? error.message : "Não foi possível reiniciar.", variant: "destructive" });
    } finally {
      setIsRebooting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              MikroTik
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <MikrotikHeaderSelector />
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                Conectado
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={handleReboot}
            disabled={isRebooting}
          >
            <RotateCcw className={`mr-1.5 h-3.5 w-3.5 ${isRebooting ? 'animate-spin' : ''}`} />
            Reiniciar
          </Button>
          <Button variant="outline" size="sm" onClick={disconnectClient} className="h-8 text-xs">
            <Power className="mr-1.5 h-3.5 w-3.5" />
            Desconectar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border flex-wrap h-auto gap-0.5 p-1">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard"><MikrotikDashboard /></TabsContent>
        <TabsContent value="dhcp"><MikrotikDHCP /></TabsContent>
        <TabsContent value="ppp"><MikrotikPPP /></TabsContent>
        <TabsContent value="addresses"><MikrotikAddresses /></TabsContent>
        <TabsContent value="firewall"><MikrotikFirewall /></TabsContent>
        <TabsContent value="nat"><MikrotikNAT /></TabsContent>
        <TabsContent value="logs"><MikrotikLogs /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Winbox;
