import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Settings, LayoutDashboard, Wifi, Shield, Network, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MikrotikDashboard } from "@/components/mikrotik/MikrotikDashboard";
import { MikrotikInterfaces } from "@/components/mikrotik/MikrotikInterfaces";
import { MikrotikFirewall } from "@/components/mikrotik/MikrotikFirewall";
import { MikrotikNAT } from "@/components/mikrotik/MikrotikNAT";
import { MikrotikDHCP } from "@/components/mikrotik/MikrotikDHCP";

const Winbox = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadIntegration();
    }
  }, [user]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("type", "mikrotik")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      setIntegration(data);

      if (!data) {
        toast({
          title: "Configuração não encontrada",
          description: "Configure o Winbox no painel de Administração primeiro",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar integração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração do Winbox",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando Winbox...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                Winbox não configurado
              </CardTitle>
              <CardDescription>
                Configure o acesso ao Winbox para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para utilizar esta funcionalidade, você precisa configurar o acesso ao Winbox (MikroTik)
                  no painel de administração.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/admin")} className="flex-1">
                  <Settings className="mr-2 h-4 w-4" />
                  Ir para Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">MikroTik - {integration.name}</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento completo via API REST
          </p>
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
