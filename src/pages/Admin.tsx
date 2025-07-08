
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Settings, Users, BarChart3, Calendar, MessageSquare, Cloud, Database, HardDrive, Activity, Monitor } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import { useSystemSettings, useCreateSystemSetting } from "@/hooks/useSystemSettings"
import { useAuth } from "@/contexts/AuthContext"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GuacamoleAdminConfig } from '@/components/GuacamoleAdminConfig';

const Admin = () => {
  const { toast } = useToast()
  const { isMaster } = useAuth()
  const { data: settings } = useSystemSettings()
  const createSetting = useCreateSystemSetting()

  const [newSetting, setNewSetting] = useState({
    setting_key: "",
    setting_value: "",
    description: "",
    category: "general",
  })

  const [showGuacamoleConfig, setShowGuacamoleConfig] = useState(false);
  const [showZabbixConfig, setShowZabbixConfig] = useState(false);
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);

  const handleCreateSetting = async () => {
    try {
      await createSetting.mutateAsync({
        ...newSetting,
        setting_type: "text",
      })
      setNewSetting({
        setting_key: "",
        setting_value: "",
        description: "",
        category: "general",
      })
      toast({
        title: "Sucesso!",
        description: "Configuração criada com sucesso.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Falha ao criar configuração.",
      })
    }
  }

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
            {/* WhatsApp Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Integrações WhatsApp</CardTitle>
                      <CardDescription>
                        Gerencie as integrações com o WhatsApp Business API
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowWhatsAppConfig(!showWhatsAppConfig)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
              {showWhatsAppConfig && (
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <p className="text-blue-800">
                      Configure aqui as integrações com WhatsApp Business API, Evolution API e outras plataformas de mensagens.
                    </p>
                  </div>
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
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <p className="text-red-800">
                      Configure aqui as credenciais do Zabbix para monitoramento de infraestrutura.
                    </p>
                  </div>
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

            {/* Cloud Storage Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Cloud className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Armazenamento na Nuvem</CardTitle>
                      <CardDescription>
                        Configure integrações com serviços de armazenamento
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* FTP Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <HardDrive className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Servidores FTP</CardTitle>
                      <CardDescription>
                        Configure conexões FTP para backup e transferência
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Settings className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Configurações do Sistema</CardTitle>
                    <CardDescription>
                      Gerencie as configurações do sistema
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setting_key">Chave da Configuração</Label>
                    <Input
                      id="setting_key"
                      placeholder="Nome da configuração"
                      value={newSetting.setting_key}
                      onChange={(e) =>
                        setNewSetting({ ...newSetting, setting_key: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setting_value">Valor da Configuração</Label>
                    <Input
                      id="setting_value"
                      placeholder="Valor da configuração"
                      value={newSetting.setting_value}
                      onChange={(e) =>
                        setNewSetting({ ...newSetting, setting_value: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição da configuração"
                    value={newSetting.description}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, description: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleCreateSetting}>Criar Configuração</Button>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Configurações Existentes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings?.map((setting) => (
                      <Card key={setting.id}>
                        <CardHeader>
                          <CardTitle>{setting.setting_key}</CardTitle>
                          <CardDescription>{setting.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {setting.setting_value}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
