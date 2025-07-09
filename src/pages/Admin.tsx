
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BomControleAdminConfig } from "@/components/BomControleAdminConfig";
import { ChatwootAdminConfig } from "@/components/ChatwootAdminConfig";
import { EvolutionAPIAdminConfig } from "@/components/EvolutionAPIAdminConfig";
import { WasabiAdminConfig } from "@/components/WasabiAdminConfig";
import { GrafanaAdminConfig } from "@/components/GrafanaAdminConfig";
import ZabbixAdminConfig from "@/components/ZabbixAdminConfig";
import { FtpAdminConfig } from "@/components/FtpAdminConfig";
import { GLPIConfig } from "@/components/GLPIConfig";
import { GuacamoleAdminConfig } from "@/components/GuacamoleAdminConfig";
import { BaculaAdminConfig } from "@/components/BaculaAdminConfig";
import { AdminCompaniesPanel } from "@/components/AdminCompaniesPanel";
import SystemSettingsPanel from "@/components/SystemSettingsPanel";
import { BrandingSettingsPanel } from "@/components/BrandingSettingsPanel";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
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
  Stethoscope
} from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("diagnostic");

  const integrationTabs = [
    {
      id: "diagnostic",
      label: "Diagnóstico",
      icon: <Stethoscope className="h-4 w-4" />,
      component: <DiagnosticPanel />
    },
    {
      id: "chatwoot",
      label: "Chatwoot",
      icon: <MessageCircle className="h-4 w-4" />,
      component: <ChatwootAdminConfig />
    },
    {
      id: "evolution",
      label: "Evolution API",
      icon: <MessageCircle className="h-4 w-4" />,
      component: <EvolutionAPIAdminConfig />
    },
    {
      id: "wasabi",
      label: "Wasabi",
      icon: <Cloud className="h-4 w-4" />,
      component: <WasabiAdminConfig />
    },
    {
      id: "grafana",
      label: "Grafana",
      icon: <BarChart3 className="h-4 w-4" />,
      component: <GrafanaAdminConfig />
    },
    {
      id: "zabbix",
      label: "Zabbix",
      icon: <Shield className="h-4 w-4" />,
      component: <ZabbixAdminConfig />
    },
    {
      id: "ftp",
      label: "FTP",
      icon: <HardDrive className="h-4 w-4" />,
      component: <FtpAdminConfig />
    },
    {
      id: "glpi",
      label: "GLPI",
      icon: <Database className="h-4 w-4" />,
      component: <GLPIConfig />
    },
    {
      id: "guacamole",
      label: "Guacamole",
      icon: <Server className="h-4 w-4" />,
      component: <GuacamoleAdminConfig />
    },
    {
      id: "bacula",
      label: "Bacula",
      icon: <Archive className="h-4 w-4" />,
      component: <BaculaAdminConfig />
    },
    {
      id: "bomcontrole",
      label: "BomControle",
      icon: <Activity className="h-4 w-4" />,
      component: <BomControleAdminConfig />
    }
  ];

  const systemTabs = [
    {
      id: "companies",
      label: "Empresas",
      icon: <Building className="h-4 w-4" />,
      component: <AdminCompaniesPanel />
    },
    {
      id: "settings",
      label: "Configurações",
      icon: <Settings className="h-4 w-4" />,
      component: <SystemSettingsPanel />
    },
    {
      id: "branding",
      label: "Visual",
      icon: <Palette className="h-4 w-4" />,
      component: <BrandingSettingsPanel />
    }
  ];

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 bg-slate-700 p-1">
              {[...integrationTabs.slice(0, 8)].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {integrationTabs.length > 8 && (
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-700 p-1 mt-2">
                {integrationTabs.slice(8).map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <TabsList className="grid grid-cols-3 gap-2 bg-slate-700 p-1 mt-2">
              {systemTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {[...integrationTabs, ...systemTabs].map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
