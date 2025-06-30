
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Server, Database, HardDrive, FileText, Save, TestTube } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Admin = () => {
  const { isMaster } = useAuth();

  if (!isMaster) {
    return <Navigate to="/dashboard" />;
  }

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas!",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };

  const handleTestConnection = (service: string) => {
    toast({
      title: `Testando ${service}...`,
      description: "Verificando conectividade com o serviço.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Painel de Administração
          </h1>
          <p className="text-slate-600">Configurações avançadas do sistema - Acesso Master</p>
        </div>

        <Tabs defaultValue="glpi" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="glpi">GLPI</TabsTrigger>
            <TabsTrigger value="zabbix">Zabbix</TabsTrigger>
            <TabsTrigger value="backup">Backup FTP</TabsTrigger>
            <TabsTrigger value="googledrive">Google Drive</TabsTrigger>
          </TabsList>

          <TabsContent value="glpi" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configuração GLPI
                </CardTitle>
                <CardDescription>
                  Configure a integração com o sistema GLPI para gerenciar chamados e equipamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="glpi-url">URL do GLPI</Label>
                    <Input id="glpi-url" placeholder="https://glpi.empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="glpi-token">Token de API</Label>
                    <Input id="glpi-token" type="password" placeholder="App-Token" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="glpi-user-token">User Token</Label>
                    <Input id="glpi-user-token" type="password" placeholder="User-Token" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="glpi-session">Session Token</Label>
                    <Input id="glpi-session" type="password" placeholder="Session-Token" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                  <Button variant="outline" onClick={() => handleTestConnection('GLPI')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>
                  <span className="text-sm text-gray-600">Última sincronização: 5 min atrás</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zabbix" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configuração Zabbix
                </CardTitle>
                <CardDescription>
                  Configure a integração com o Zabbix para monitoramento de infraestrutura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zabbix-url">URL do Zabbix</Label>
                    <Input id="zabbix-url" placeholder="https://zabbix.empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zabbix-user">Usuário</Label>
                    <Input id="zabbix-user" placeholder="admin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zabbix-password">Senha</Label>
                    <Input id="zabbix-password" type="password" placeholder="Senha do usuário" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zabbix-token">API Token</Label>
                    <Input id="zabbix-token" type="password" placeholder="Token de API (opcional)" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zabbix-groups">Grupos de Hosts (separados por vírgula)</Label>
                  <Input id="zabbix-groups" placeholder="Servidores, Rede, Aplicações" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                  <Button variant="outline" onClick={() => handleTestConnection('Zabbix')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>
                  <span className="text-sm text-gray-600">45 hosts monitorados</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Configuração Backup FTP
                </CardTitle>
                <CardDescription>
                  Configure os servidores FTP para verificação automática de backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Servidor FTP Principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ftp1-host">Servidor</Label>
                      <Input id="ftp1-host" placeholder="ftp.empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp1-port">Porta</Label>
                      <Input id="ftp1-port" placeholder="21" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp1-user">Usuário</Label>
                      <Input id="ftp1-user" placeholder="backup_user" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp1-password">Senha</Label>
                      <Input id="ftp1-password" type="password" placeholder="Senha FTP" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Servidor FTP Secundário</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ftp2-host">Servidor</Label>
                      <Input id="ftp2-host" placeholder="ftp2.empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp2-port">Porta</Label>
                      <Input id="ftp2-port" placeholder="21" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp2-user">Usuário</Label>
                      <Input id="ftp2-user" placeholder="backup_user" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp2-password">Senha</Label>
                      <Input id="ftp2-password" type="password" placeholder="Senha FTP" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-schedule">Horário de Verificação</Label>
                  <Input id="backup-schedule" placeholder="08:00" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                  <Button variant="outline" onClick={() => handleTestConnection('FTP')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexões
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">FTP1 Online</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">FTP2 Online</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="googledrive" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Configuração Google Drive
                </CardTitle>
                <CardDescription>
                  Configure a integração com Google Drive para gerenciamento de documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gdrive-client-id">Client ID</Label>
                    <Input id="gdrive-client-id" placeholder="Google Client ID" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gdrive-client-secret">Client Secret</Label>
                    <Input id="gdrive-client-secret" type="password" placeholder="Google Client Secret" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gdrive-redirect-uri">Redirect URI</Label>
                    <Input id="gdrive-redirect-uri" placeholder="https://app.empresa.com/callback" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gdrive-refresh-token">Refresh Token</Label>
                    <Input id="gdrive-refresh-token" type="password" placeholder="Token de atualização" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gdrive-folder-id">ID da Pasta Principal</Label>
                  <Input id="gdrive-folder-id" placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gdrive-sync-interval">Intervalo de Sincronização (minutos)</Label>
                  <Input id="gdrive-sync-interval" placeholder="30" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                  <Button variant="outline" onClick={() => handleTestConnection('Google Drive')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>
                  <span className="text-sm text-gray-600">2.5 GB de 15 GB usados</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
