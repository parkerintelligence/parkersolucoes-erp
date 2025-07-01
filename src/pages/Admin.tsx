
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AdminApiPanel } from '@/components/AdminApiPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, Database, Key, DollarSign, Activity } from 'lucide-react';

const Admin = () => {
  const { isMaster } = useAuth();

  if (!isMaster) {
    return <Navigate to="/dashboard" />;
  }

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

        {/* Estatísticas Administrativas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">15</p>
                  <p className="text-sm text-blue-600">Usuários Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">4</p>
                  <p className="text-sm text-blue-600">APIs Conectadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">98%</p>
                  <p className="text-sm text-blue-600">Uptime Sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">12</p>
                  <p className="text-sm text-blue-600">Configurações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Configuração */}
        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitoramento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="mt-6">
            <AdminApiPanel />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gerenciamento de Usuários
                </CardTitle>
                <CardDescription>
                  Controle de acesso e permissões dos usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gerenciamento de usuários em desenvolvimento.</p>
                  <p className="text-sm mt-2">Em breve você poderá gerenciar permissões e acessos.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Configurações Financeiras
                </CardTitle>
                <CardDescription>
                  Integração com Bom Controle e outras ferramentas financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações financeiras em desenvolvimento.</p>
                  <p className="text-sm mt-2">Em breve você poderá integrar com o Bom Controle.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="mt-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Configurações de Monitoramento
                </CardTitle>
                <CardDescription>
                  Configurações do Grafana, Zabbix e outras ferramentas de monitoramento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações de monitoramento em desenvolvimento.</p>
                  <p className="text-sm mt-2">Em breve você poderá configurar credenciais do Grafana.</p>
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
