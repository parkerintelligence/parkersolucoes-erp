import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Server, Database, HardDrive, Calendar, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AdminApiPanel = () => {
  // Estados para as configurações do GLPI
  const [glpiUrl, setGlpiUrl] = useState(() => {
    return localStorage.getItem('glpiUrl') || '';
  });
  const [glpiAppToken, setGlpiAppToken] = useState(() => {
    return localStorage.getItem('glpiAppToken') || '';
  });
  const [glpiUserToken, setGlpiUserToken] = useState(() => {
    return localStorage.getItem('glpiUserToken') || '';
  });

  // Estados para as configurações do Zabbix
  const [zabbixApiUrl, setZabbixApiUrl] = useState(() => {
    return localStorage.getItem('zabbixApiUrl') || '';
  });
  const [zabbixUser, setZabbixUser] = useState(() => {
    return localStorage.getItem('zabbixUser') || '';
  });
  const [zabbixPassword, setZabbixPassword] = useState(() => {
    return localStorage.getItem('zabbixPassword') || '';
  });

  // Estados para as configurações do Backup FTP
  const [ftpHost, setFtpHost] = useState(() => {
    return localStorage.getItem('ftpHost') || '';
  });
  const [ftpPort, setFtpPort] = useState(() => {
    return localStorage.getItem('ftpPort') || '21';
  });
  const [ftpUser, setFtpUser] = useState(() => {
    return localStorage.getItem('ftpUser') || '';
  });
  const [ftpPassword, setFtpPassword] = useState(() => {
    return localStorage.getItem('ftpPassword') || '';
  });

  // Estados para as configurações do Google Calendar
  const [googleCalendarApiKey, setGoogleCalendarApiKey] = useState(() => {
    return localStorage.getItem('googleCalendarApiKey') || '';
  });
  const [googleCalendarId, setGoogleCalendarId] = useState(() => {
    return localStorage.getItem('googleCalendarId') || '';
  });

  // Handlers para salvar as configurações do GLPI
  const handleSaveGlpiConfig = () => {
    localStorage.setItem('glpiUrl', glpiUrl);
    localStorage.setItem('glpiAppToken', glpiAppToken);
    localStorage.setItem('glpiUserToken', glpiUserToken);
    toast({
      title: "Sucesso!",
      description: "Configurações do GLPI salvas com sucesso",
    });
  };

  // Handlers para salvar as configurações do Zabbix
  const handleSaveZabbixConfig = () => {
    localStorage.setItem('zabbixApiUrl', zabbixApiUrl);
    localStorage.setItem('zabbixUser', zabbixUser);
    localStorage.setItem('zabbixPassword', zabbixPassword);
    toast({
      title: "Sucesso!",
      description: "Configurações do Zabbix salvas com sucesso",
    });
  };

  // Handlers para salvar as configurações do Backup FTP
  const handleSaveFtpConfig = () => {
    localStorage.setItem('ftpHost', ftpHost);
    localStorage.setItem('ftpPort', ftpPort);
    localStorage.setItem('ftpUser', ftpUser);
    localStorage.setItem('ftpPassword', ftpPassword);
    toast({
      title: "Sucesso!",
      description: "Configurações do Backup FTP salvas com sucesso",
    });
  };

  // Handlers para salvar as configurações do Google Calendar
  const handleSaveGoogleCalendarConfig = () => {
    localStorage.setItem('googleCalendarApiKey', googleCalendarApiKey);
    localStorage.setItem('googleCalendarId', googleCalendarId);
    toast({
      title: "Sucesso!",
      description: "Configurações do Google Calendar salvas com sucesso",
    });
  };

  // Adicionar estado para senha master
  const [masterPassword, setMasterPassword] = useState(() => {
    return localStorage.getItem('systemMasterPassword') || '';
  });

  // Adicionar handler para senha master
  const handleSaveMasterPassword = () => {
    if (!masterPassword.trim()) {
      toast({
        title: "Erro",
        description: "A senha master não pode estar vazia",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('systemMasterPassword', masterPassword);
    toast({
      title: "Sucesso!",
      description: "Senha master salva com sucesso",
    });
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Server className="h-6 w-6" />
          Configurações de Integração e Sistema
        </CardTitle>
        <CardDescription>Configure as integrações com sistemas externos e parâmetros do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="glpi" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="glpi">GLPI</TabsTrigger>
            <TabsTrigger value="zabbix">Zabbix</TabsTrigger>
            <TabsTrigger value="backup">Backup FTP</TabsTrigger>
            <TabsTrigger value="calendar">Google Calendar</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="glpi" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Configurações do GLPI</h3>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="glpiUrl">URL do GLPI</Label>
                  <Input
                    id="glpiUrl"
                    placeholder="https://glpi.example.com"
                    value={glpiUrl}
                    onChange={(e) => setGlpiUrl(e.target.value)}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="glpiAppToken">App Token</Label>
                  <Input
                    id="glpiAppToken"
                    type="password"
                    value={glpiAppToken}
                    onChange={(e) => setGlpiAppToken(e.target.value)}
                    placeholder="GLPI App Token"
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="glpiUserToken">User Token</Label>
                  <Input
                    id="glpiUserToken"
                    type="password"
                    value={glpiUserToken}
                    onChange={(e) => setGlpiUserToken(e.target.value)}
                    placeholder="GLPI User Token"
                    className="border-blue-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveGlpiConfig}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Configurações do GLPI
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="zabbix" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Configurações do Zabbix</h3>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zabbixApiUrl">URL da API do Zabbix</Label>
                  <Input
                    id="zabbixApiUrl"
                    placeholder="https://zabbix.example.com/api_jsonrpc.php"
                    value={zabbixApiUrl}
                    onChange={(e) => setZabbixApiUrl(e.target.value)}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zabbixUser">Usuário do Zabbix</Label>
                  <Input
                    id="zabbixUser"
                    value={zabbixUser}
                    onChange={(e) => setZabbixUser(e.target.value)}
                    placeholder="Usuário Zabbix"
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zabbixPassword">Senha do Zabbix</Label>
                  <Input
                    id="zabbixPassword"
                    type="password"
                    value={zabbixPassword}
                    onChange={(e) => setZabbixPassword(e.target.value)}
                    placeholder="Senha Zabbix"
                    className="border-blue-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveZabbixConfig}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Configurações do Zabbix
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <HardDrive className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Configurações do Backup FTP</h3>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ftpHost">Host FTP</Label>
                  <Input
                    id="ftpHost"
                    placeholder="ftp.example.com"
                    value={ftpHost}
                    onChange={(e) => setFtpHost(e.target.value)}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ftpPort">Porta FTP</Label>
                  <Input
                    id="ftpPort"
                    type="number"
                    value={ftpPort}
                    onChange={(e) => setFtpPort(e.target.value)}
                    placeholder="21"
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ftpUser">Usuário FTP</Label>
                  <Input
                    id="ftpUser"
                    value={ftpUser}
                    onChange={(e) => setFtpUser(e.target.value)}
                    placeholder="Usuário FTP"
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ftpPassword">Senha FTP</Label>
                  <Input
                    id="ftpPassword"
                    type="password"
                    value={ftpPassword}
                    onChange={(e) => setFtpPassword(e.target.value)}
                    placeholder="Senha FTP"
                    className="border-blue-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveFtpConfig}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Configurações do Backup FTP
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Configurações do Google Calendar</h3>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleCalendarApiKey">API Key do Google Calendar</Label>
                  <Input
                    id="googleCalendarApiKey"
                    type="password"
                    value={googleCalendarApiKey}
                    onChange={(e) => setGoogleCalendarApiKey(e.target.value)}
                    placeholder="API Key do Google Calendar"
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleCalendarId">Calendar ID</Label>
                  <Input
                    id="googleCalendarId"
                    value={googleCalendarId}
                    onChange={(e) => setGoogleCalendarId(e.target.value)}
                    placeholder="Calendar ID"
                    className="border-blue-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveGoogleCalendarConfig}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Configurações do Google Calendar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Configurações do Sistema</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="masterPassword">Senha Master do Sistema</Label>
                  <Input
                    id="masterPassword"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Digite a senha master para visualização de senhas"
                    className="border-blue-200"
                  />
                  <p className="text-sm text-gray-600">
                    Esta senha será solicitada para visualizar senhas no sistema
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSaveMasterPassword}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Configurações do Sistema
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
