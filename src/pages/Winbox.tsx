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
import { useMikrotikContext } from "@/contexts/MikrotikContext";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";

const Winbox = () => {
  const { selectedClient, disconnectClient } = useMikrotikContext();
  const { callAPI } = useMikrotikAPI();
  const [isRebooting, setIsRebooting] = useState(false);

  if (!selectedClient) {
    return <MikrotikClientSelector />;
  }

  const handleReboot = async () => {
    try {
      setIsRebooting(true);
      toast({
        title: "Reiniciando MikroTik",
        description: "O dispositivo está sendo reiniciado. Aguarde alguns instantes...",
      });
      
      await callAPI('/system/reboot', 'POST');
      
      toast({
        title: "Reinício iniciado",
        description: "O MikroTik foi reiniciado com sucesso. A conexão será restabelecida em breve.",
      });
      
      // Desconectar após 2 segundos
      setTimeout(() => {
        disconnectClient();
      }, 2000);
    } catch (error) {
      console.error('Erro ao reiniciar MikroTik:', error);
      toast({
        title: "Erro ao reiniciar",
        description: error instanceof Error ? error.message : "Não foi possível reiniciar o MikroTik.",
        variant: "destructive",
      });
    } finally {
      setIsRebooting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-900 p-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  MikroTik - {selectedClient.name}
                </h1>
                <p className="text-slate-400 text-sm">
                  {selectedClient.base_url}
                </p>
              </div>
              <Badge className="bg-green-600 text-white">Conectado</Badge>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-orange-600/50 text-orange-400 hover:bg-orange-600/20"
                    disabled={isRebooting}
                  >
                    <RotateCcw className={`mr-2 h-4 w-4 ${isRebooting ? 'animate-spin' : ''}`} />
                    Reiniciar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Confirmar Reinício</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Tem certeza que deseja reiniciar o MikroTik <strong>{selectedClient.name}</strong>?
                      <br /><br />
                      Esta ação irá desconectar todos os clientes temporariamente e você precisará reconectar após o reinício.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleReboot}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                      disabled={isRebooting}
                    >
                      {isRebooting ? 'Reiniciando...' : 'Sim, Reiniciar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button variant="outline" onClick={disconnectClient} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Power className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="dhcp" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              DHCP
            </TabsTrigger>
            <TabsTrigger value="ppp" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              VPN (PPP)
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              IP Addresses
            </TabsTrigger>
            <TabsTrigger value="firewall" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Firewall
            </TabsTrigger>
            <TabsTrigger value="nat" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              NAT
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <MikrotikDashboard />
          </TabsContent>

          <TabsContent value="dhcp" className="mt-6">
            <MikrotikDHCP />
          </TabsContent>

          <TabsContent value="ppp" className="mt-6">
            <MikrotikPPP />
          </TabsContent>

          <TabsContent value="addresses" className="mt-6">
            <MikrotikAddresses />
          </TabsContent>

          <TabsContent value="firewall" className="mt-6">
            <MikrotikFirewall />
          </TabsContent>

          <TabsContent value="nat" className="mt-6">
            <MikrotikNAT />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <MikrotikLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Winbox;
