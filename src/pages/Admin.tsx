import { useState } from 'react';
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
import RustDeskAdminConfig from "@/components/RustDeskAdminConfig";
import { AdminCompaniesPanel } from "@/components/AdminCompaniesPanel";
import SystemSettingsPanel from "@/components/SystemSettingsPanel";
import { BrandingSettingsPanel } from "@/components/BrandingSettingsPanel";
import AdminUsersPanel from "@/components/AdminUsersPanel";
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
  Router,
  Users,
  Monitor,
  ArrowLeft,
  Plug,
  Cog
} from "lucide-react";

interface AdminButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  description?: string;
}

const integrationButtons: AdminButton[] = [
  { id: "chatwoot", label: "Chatwoot", icon: <MessageCircle className="h-4 w-4" />, component: ChatwootSimpleConfig, description: "Atendimento" },
  { id: "evolution", label: "Evolution API", icon: <MessageCircle className="h-4 w-4" />, component: EvolutionAPIAdminConfig, description: "WhatsApp" },
  { id: "wasabi", label: "Wasabi", icon: <Cloud className="h-4 w-4" />, component: WasabiAdminConfig, description: "Storage S3" },
  { id: "grafana", label: "Grafana", icon: <BarChart3 className="h-4 w-4" />, component: GrafanaAdminConfig, description: "Dashboards" },
  { id: "zabbix", label: "Zabbix", icon: <Shield className="h-4 w-4" />, component: ZabbixAdminConfig, description: "Monitoramento" },
  { id: "wazuh", label: "Wazuh", icon: <Shield className="h-4 w-4" />, component: WazuhAdminConfig, description: "Segurança" },
  { id: "ftp", label: "FTP", icon: <HardDrive className="h-4 w-4" />, component: FtpAdminConfig, description: "Transferência" },
  { id: "glpi", label: "GLPI", icon: <Database className="h-4 w-4" />, component: GLPIConfig, description: "Helpdesk" },
  { id: "guacamole", label: "Guacamole", icon: <Server className="h-4 w-4" />, component: GuacamoleAdminConfig, description: "Acesso Remoto" },
  { id: "bacula", label: "Bacula", icon: <Archive className="h-4 w-4" />, component: BaculaAdminConfig, description: "Backup" },
  { id: "hostinger", label: "Hostinger", icon: <Server className="h-4 w-4" />, component: HostingerAdminConfig, description: "VPS" },
  { id: "bomcontrole", label: "BomControle", icon: <Activity className="h-4 w-4" />, component: BomControleAdminConfig, description: "ERP" },
  { id: "unifi", label: "UniFi", icon: <Wifi className="h-4 w-4" />, component: UniFiAdminConfig, description: "Rede Wi-Fi" },
  { id: "mikrotik", label: "Winbox", icon: <Router className="h-4 w-4" />, component: MikrotikAdminConfig, description: "Roteadores" },
  { id: "rustdesk", label: "RustDesk", icon: <Monitor className="h-4 w-4" />, component: RustDeskAdminConfig, description: "Desktop Remoto" },
];

const systemButtons: AdminButton[] = [
  { id: "users", label: "Usuários", icon: <Users className="h-4 w-4" />, component: AdminUsersPanel, description: "Gerenciar acessos" },
  { id: "companies", label: "Empresas", icon: <Building className="h-4 w-4" />, component: AdminCompaniesPanel, description: "Cadastros" },
  { id: "settings", label: "Configurações", icon: <Settings className="h-4 w-4" />, component: SystemSettingsPanel, description: "Parâmetros" },
  { id: "branding", label: "Visual", icon: <Palette className="h-4 w-4" />, component: BrandingSettingsPanel, description: "Aparência" },
];

const Admin = () => {
  const [activePanel, setActivePanel] = useState("");

  const getActiveComponent = () => {
    const allButtons = [...integrationButtons, ...systemButtons];
    const activeButton = allButtons.find(button => button.id === activePanel);
    if (!activeButton) return null;
    const Component = activeButton.component as React.ComponentType;
    return <Component />;
  };

  const activeLabel = [...integrationButtons, ...systemButtons].find(b => b.id === activePanel)?.label;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {activePanel ? (
            <Button
              onClick={() => setActivePanel("")}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Voltar
            </Button>
          ) : (
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Cog className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              {activePanel ? activeLabel : 'Administração'}
            </h1>
          </div>
          {!activePanel && (
            <div className="flex items-center gap-1.5 ml-2">
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-0">
                <Plug className="h-2.5 w-2.5 mr-0.5" />
                {integrationButtons.length} integrações
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground border-0">
                <Cog className="h-2.5 w-2.5 mr-0.5" />
                {systemButtons.length} sistema
              </Badge>
            </div>
          )}
        </div>
      </div>

      {!activePanel ? (
        <div className="space-y-4">
          {/* Integrações */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Plug className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">Integrações</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {integrationButtons.map((button) => (
                <button
                  key={button.id}
                  onClick={() => setActivePanel(button.id)}
                  className="group bg-card border border-border rounded-lg p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all duration-150"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                      {button.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{button.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{button.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sistema */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cog className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">Sistema</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {systemButtons.map((button) => (
                <button
                  key={button.id}
                  onClick={() => setActivePanel(button.id)}
                  className="group bg-card border border-border rounded-lg p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all duration-150"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {button.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{button.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{button.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>{getActiveComponent()}</div>
      )}
    </div>
  );
};

export default Admin;
