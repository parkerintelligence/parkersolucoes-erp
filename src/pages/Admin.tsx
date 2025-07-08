
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Settings, Users, BarChart3, Calendar, MessageSquare, Cloud, Database, HardDrive, Activity, Monitor, Server, Wrench } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { GuacamoleAdminConfig } from '@/components/GuacamoleAdminConfig';
import ZabbixAdminConfig from '@/components/ZabbixAdminConfig';
import { GLPIConfig } from '@/components/GLPIConfig';
import { FtpAdminConfig } from '@/components/FtpAdminConfig';
import { WasabiAdminConfig } from '@/components/WasabiAdminConfig';
import { ChatwootAdminConfig } from '@/components/ChatwootAdminConfig';
import { EvolutionAPIAdminConfig } from '@/components/EvolutionAPIAdminConfig';
import { GrafanaAdminConfig } from '@/components/GrafanaAdminConfig';
import { BomControleAdminConfig } from '@/components/BomControleAdminConfig';
import SystemSettingsPanel from '@/components/SystemSettingsPanel';

const Admin = () => {
  const { toast } = useToast()
  const { isMaster } = useAuth()

  const [showGuacamoleConfig, setShowGuacamoleConfig] = useState(false);
  const [showZabbixConfig, setShowZabbixConfig] = useState(false);
  const [showGLPIConfig, setShowGLPIConfig] = useState(false);
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [showFtpConfig, setShowFtpConfig] = useState(false);
  const [showWasabiConfig, setShowWasabiConfig] = useState(false);
  const [showChatwootConfig, setShowChatwootConfig] = useState(false);
  const [showEvolutionConfig, setShowEvolutionConfig] = useState(false);
  const [showGrafanaConfig, setShowGrafanaConfig] = useState(false);
  const [showBomControleConfig, setShowBomControleConfig] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-secondary p-2 rounded-lg">
          <Shield className="h-6 w-6 text-secondary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Administração</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema e usuários
          </p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-6">
            {/* GLPI Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Server className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>GLPI</CardTitle>
                      <CardDescription>
                        Configure a integração com GLPI para gestão de tickets e inventário
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowGLPIConfig(!showGLPIConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showGLPIConfig && (
                <CardContent>
                  <GLPIConfig />
                </CardContent>
              )}
            </Card>

            {/* WhatsApp Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Evolution API</CardTitle>
                      <CardDescription>
                        Gerencie as integrações com Evolution API para WhatsApp
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowEvolutionConfig(!showEvolutionConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showEvolutionConfig && (
                <CardContent>
                  <EvolutionAPIAdminConfig />
                </CardContent>
              )}
            </Card>

            {/* Chatwoot Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle>Chatwoot</CardTitle>
                      <CardDescription>
                        Configure a integração com Chatwoot para atendimento
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowChatwootConfig(!showChatwootConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showChatwootConfig && (
                <CardContent>
                  <ChatwootAdminConfig />
                </CardContent>
              )}
            </Card>

            {/* Zabbix Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Activity className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>Configuração Zabbix</CardTitle>
                      <CardDescription>
                        Configure a integração com o Zabbix para monitoramento
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowZabbixConfig(!showZabbixConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showZabbixConfig && (
                <CardContent>
                  <ZabbixAdminConfig />
                </CardContent>
              )}
            </Card>
            
            {/* Apache Guacamole Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Monitor className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Apache Guacamole</CardTitle>
                      <CardDescription>
                        Configure a integração com Apache Guacamole para acesso remoto
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowGuacamoleConfig(!showGuacamoleConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showGuacamoleConfig && (
                <CardContent>
                  <GuacamoleAdminConfig />
                </CardContent>
              )}
            </Card>

            {/* Grafana Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle>Grafana</CardTitle>
                      <CardDescription>
                        Configure a integração com Grafana para dashboards
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowGrafanaConfig(!showGrafanaConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showGrafanaConfig && (
                <CardContent>
                  <GrafanaAdminConfig />
                </CardContent>
              )}
            </Card>

            {/* BomControle Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-100 p-2 rounded-lg">
                      <Wrench className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle>BomControle</CardTitle>
                      <CardDescription>
                        Configure a integração com BomControle
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowBomControleConfig(!showBomControleConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showBomControleConfig && (
                <CardContent>
                  <BomControleAdminConfig />
                </CardContent>
              )}
            </Card>

            {/* Cloud Storage Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Cloud className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Wasabi Cloud Storage</CardTitle>
                      <CardDescription>
                        Configure integrações com Wasabi para armazenamento
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowWasabiConfig(!showWasabiConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showWasabiConfig && (
                <CardContent>
                  <WasabiAdminConfig />
                </CardContent>
              )}
            </Card>

            {/* FTP Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <HardDrive className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle>Servidores FTP</CardTitle>
                      <CardDescription>
                        Configure conexões FTP para backup e transferência
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowFtpConfig(!showFtpConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showFtpConfig && (
                <CardContent>
                  <FtpAdminConfig />
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemSettingsPanel />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle>Relatórios</CardTitle>
                  <CardDescription>
                    Visualize os relatórios do sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Em breve, você poderá visualizar os relatórios do sistema aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
