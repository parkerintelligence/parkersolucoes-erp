
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BomControleAdminConfig } from "@/components/BomControleAdminConfig";
import { ChatwootSimpleConfig } from "@/components/ChatwootSimpleConfig";
import { EvolutionAPIAdminConfig } from "@/components/EvolutionAPIAdminConfig";
import { WasabiAdminConfig } from "@/components/WasabiAdminConfig";
import { GrafanaAdminConfig } from "@/components/GrafanaAdminConfig";
import ZabbixAdminConfig from "@/components/ZabbixAdminConfig";
import WazuhAdminConfig from "@/components/WazuhAdminConfig";
import { FtpAdminConfig } from "@/components/FtpAdminConfig";
import { GLPIConfig } from "@/components/GLPIConfig";
import GuacamoleAdminConfig from "@/components/GuacamoleAdminConfig";
import { BaculaAdminConfig } from "@/components/BaculaAdminConfig";
import { HostingerAdminConfig } from "@/components/HostingerAdminConfig";
import { MikrotikAdminConfig } from "@/components/MikrotikAdminConfig";
import UniFiAdminConfig from "@/components/UniFiAdminConfig";
import { AdminCompaniesPanel } from "@/components/AdminCompaniesPanel";
import SystemSettingsPanel from "@/components/SystemSettingsPanel";
import { BrandingSettingsPanel } from "@/components/BrandingSettingsPanel";
import { 
  Settings, 
  Building, 
  Palette, 
  MessageCircle, 
  Cloud, 
  BarChart3, 
  Shield, 
  HardDrive,
  Database,
  Server,
  Archive,
  Activity,
  Wifi,
  Router
} from "lucide-react";

const Admin = () => {
  const [activePanel, setActivePanel] = useState("");

  const integrationButtons = [
    {
      id: "chatwoot",
      label: "Chatwoot",
      icon: <MessageCircle className="h-5 w-5" />,
      component: ChatwootSimpleConfig
    },
    {
      id: "evolution",
      label: "Evolution API",
      icon: <MessageCircle className="h-5 w-5" />,
      component: EvolutionAPIAdminConfig
    },
    {
      id: "wasabi",
      label: "Wasabi",
      icon: <Cloud className="h-5 w-5" />,
      component: WasabiAdminConfig
    },
    {
      id: "grafana",
      label: "Grafana",
      icon: <BarChart3 className="h-5 w-5" />,
      component: GrafanaAdminConfig
    },
    {
      id: "zabbix",
      label: "Zabbix",
      icon: <Shield className="h-5 w-5" />,
      component: ZabbixAdminConfig
    },
    {
      id: "wazuh",
      label: "Wazuh",
      icon: <Shield className="h-5 w-5 text-orange-500" />,
      component: WazuhAdminConfig
    },
    {
      id: "ftp",
      label: "FTP",
      icon: <HardDrive className="h-5 w-5" />,
      component: FtpAdminConfig
    },
    {
      id: "glpi",
      label: "GLPI",
      icon: <Database className="h-5 w-5" />,
      component: GLPIConfig
    },
    {
      id: "guacamole",
      label: "Guacamole",
      icon: <Server className="h-5 w-5" />,
      component: GuacamoleAdminConfig
    },
    {
      id: "bacula",
      label: "Bacula",
      icon: <Archive className="h-5 w-5" />,
      component: BaculaAdminConfig
    },
    {
      id: "hostinger",
      label: "Hostinger",
      icon: <Server className="h-5 w-5 text-orange-500" />,
      component: HostingerAdminConfig
    },
    {
      id: "bomcontrole",
      label: "BomControle",
      icon: <Activity className="h-5 w-5" />,
      component: BomControleAdminConfig
    },
    {
      id: "unifi",
      label: "UniFi",
      icon: <Wifi className="h-5 w-5 text-blue-400" />,
      component: UniFiAdminConfig
    },
    {
      id: "mikrotik",
      label: "Winbox",
      icon: <Router className="h-5 w-5 text-cyan-400" />,
      component: MikrotikAdminConfig
    }
  ];

  const systemButtons = [
    {
      id: "companies",
      label: "Empresas",
      icon: <Building className="h-5 w-5" />,
      component: AdminCompaniesPanel
    },
    {
      id: "settings",
      label: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      component: SystemSettingsPanel
    },
    {
      id: "branding",
      label: "Visual",
      icon: <Palette className="h-5 w-5" />,
      component: BrandingSettingsPanel
    }
  ];

  const getActiveComponent = () => {
    const allButtons = [...integrationButtons, ...systemButtons];
    const activeButton = allButtons.find(button => button.id === activePanel);
    if (!activeButton) return null;
    
    const Component = activeButton.component as React.ComponentType;
    return <Component />;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Administração</h1>
            <p className="text-slate-400">Configure integrações e parâmetros do sistema</p>
          </div>
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            Admin Panel
          </Badge>
        </div>

        {!activePanel ? (
          <div className="space-y-8">
            {/* Integrações */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Integrações</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure as integrações com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {integrationButtons.map((button) => (
                    <Button
                      key={button.id}
                      onClick={() => setActivePanel(button.id)}
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 text-white border-0 transition-colors"
                    >
                      {button.icon}
                      <span className="text-sm font-medium">{button.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sistema */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sistema</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure parâmetros e configurações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {systemButtons.map((button) => (
                    <Button
                      key={button.id}
                      onClick={() => setActivePanel(button.id)}
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 text-white border-0 transition-colors"
                    >
                      {button.icon}
                      <span className="text-sm font-medium">{button.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              onClick={() => setActivePanel("")}
              variant="outline"
              className="text-slate-300 border-slate-600 hover:bg-slate-800"
            >
              ← Voltar ao Painel Principal
            </Button>
            {getActiveComponent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
