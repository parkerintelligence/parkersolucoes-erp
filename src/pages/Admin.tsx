
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import AdminApiPanel from '@/components/AdminApiPanel';
import { AdminCompaniesPanel } from '@/components/AdminCompaniesPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, Database, Key, Building, Activity, DollarSign, MessageCircle, HardDrive, Monitor } from 'lucide-react';

const Admin = () => {
  const { isMaster } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');

  if (!isMaster) {
    return <Navigate to="/dashboard" />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'integrations':
        return <AdminApiPanel />;
      case 'companies':
        return <AdminCompaniesPanel />;
      case 'users':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Controle de acesso e permissões dos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gerenciamento de usuários em desenvolvimento.</p>
                <p className="text-sm mt-2">Em breve você poderá gerenciar permissões e acessos.</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'overview':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('integrations')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Key className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Integrações & APIs</h3>
                    <p className="text-sm text-blue-600">Configure WhatsApp, Wasabi, Grafana, Bom Controle, Zabbix</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('companies')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Empresas</h3>
                    <p className="text-sm text-green-600">Gerenciar cadastro de empresas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('users')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Usuários</h3>
                    <p className="text-sm text-purple-600">Controle de acesso e permissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Database className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">Banco de Dados</h3>
                    <p className="text-sm text-orange-600">Backup e configurações</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Monitor className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-indigo-900">Monitoramento</h3>
                    <p className="text-sm text-indigo-600">Status do sistema</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Settings className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">Configurações</h3>
                    <p className="text-sm text-red-600">Parâmetros gerais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-7 w-7" />
              Painel de Administração Master
            </h1>
            <p className="text-slate-600 text-sm">Configurações e gerenciamento do sistema</p>
          </div>
          {activeSection !== 'overview' && (
            <Button 
              variant="outline" 
              onClick={() => setActiveSection('overview')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Voltar ao Menu
            </Button>
          )}
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold text-blue-900">15</p>
                  <p className="text-xs text-blue-600">Usuários Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold text-green-900">4</p>
                  <p className="text-xs text-green-600">APIs Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xl font-bold text-purple-900">12</p>
                  <p className="text-xs text-purple-600">Empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xl font-bold text-orange-900">98%</p>
                  <p className="text-xs text-orange-600">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navegação por Breadcrumb */}
        {activeSection !== 'overview' && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button onClick={() => setActiveSection('overview')} className="hover:text-blue-600">
              Painel
            </button>
            <span>/</span>
            <span className="font-medium text-slate-900">
              {activeSection === 'integrations' && 'Integrações & APIs'}
              {activeSection === 'companies' && 'Empresas'}
              {activeSection === 'users' && 'Usuários'}
            </span>
          </div>
        )}

        {/* Conteúdo da Seção Ativa */}
        {renderContent()}
      </div>
    </Layout>
  );
};

export default Admin;
