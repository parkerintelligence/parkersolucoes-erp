import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Settings, Users, BarChart3, Calendar, MessageSquare, Cloud, Database, HardDrive, Activity, Monitor } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { useUserProfiles } from "@/hooks/useUserProfiles"
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
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/users/columns"
import { ZabbixAdminConfig } from '@/components/ZabbixAdminConfig';
import { FTPAdminConfig } from '@/components/FTPAdminConfig';
import { GLPIAdminConfig } from '@/components/GLPIAdminConfig';
import { WasabiAdminConfig } from '@/components/WasabiAdminConfig';
import { GuacamoleAdminConfig } from '@/components/GuacamoleAdminConfig';

const Admin = () => {
  const { toast } = useToast()
  const { isMaster } = useAuth()
  const { settings, createSetting, updateSetting, deleteSetting } = useSystemSettings()
  const { profiles, createProfile, updateProfile, deleteProfile } = useUserProfiles()

  const [newSetting, setNewSetting] = useState({
    setting_key: "",
    setting_value: "",
    description: "",
    category: "general",
  })

  const [newProfile, setNewProfile] = useState({
    email: "",
    role: "user",
  })

  const handleCreateSetting = async () => {
    try {
      await createSetting({
        ...newSetting,
        setting_type: "string",
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

  const handleCreateProfile = async () => {
    try {
      await createProfile({
        ...newProfile,
      })
      setNewProfile({
        email: "",
        role: "user",
      })
      toast({
        title: "Sucesso!",
        description: "Perfil criado com sucesso.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Falha ao criar perfil.",
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Integrações WhatsApp</CardTitle>
                    <CardDescription>
                      Gerencie as integrações com o WhatsApp
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve, você poderá gerenciar as integrações com o WhatsApp
                  aqui.
                </p>
              </CardContent>
            </Card>

            <ZabbixAdminConfig />
            
            <FTPAdminConfig />

            <GLPIAdminConfig />

            <WasabiAdminConfig />
            
            {/* Apache Guacamole Integration */}
            <GuacamoleAdminConfig />
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Gerenciar Usuários</CardTitle>
                      <CardDescription>
                        Adicione, edite e remova usuários do sistema
                      </CardDescription>
                    </div>
                  </div>
                  {isMaster && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">Adicionar Usuário</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Adicionar Usuário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Adicione um novo usuário ao sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                              Email
                            </Label>
                            <Input
                              type="email"
                              id="email"
                              value={newProfile.email}
                              onChange={(e) =>
                                setNewProfile({ ...newProfile, email: e.target.value })
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                              Role
                            </Label>
                            <select
                              id="role"
                              className="col-span-3 rounded-md border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary"
                              value={newProfile.role}
                              onChange={(e) =>
                                setNewProfile({ ...newProfile, role: e.target.value })
                              }
                            >
                              <option value="user">User</option>
                              <option value="master">Master</option>
                            </select>
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCreateProfile}>
                            Continuar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isMaster ? (
                  <DataTable columns={columns} data={profiles} />
                ) : (
                  <p className="text-muted-foreground">
                    Você não tem permissão para gerenciar usuários.
                  </p>
                )}
              </CardContent>
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
                    {settings.map((setting) => (
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
