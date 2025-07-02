
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import AdminApiPanel from '@/components/AdminApiPanel';
import { AdminCompaniesPanel } from '@/components/AdminCompaniesPanel';
import { GLPIConfig } from '@/components/GLPIConfig';
import { ChatwootAdminConfig } from '@/components/ChatwootAdminConfig';
import { EvolutionAPIAdminConfig } from '@/components/EvolutionAPIAdminConfig';
import { GrafanaAdminConfig } from '@/components/GrafanaAdminConfig';
import { BomControleAdminConfig } from '@/components/BomControleAdminConfig';
import { FtpAdminConfig } from '@/components/FtpAdminConfig';
import { WasabiAdminConfig } from '@/components/WasabiAdminConfig';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, Database, Key, Building, Activity, DollarSign, MessageCircle, HardDrive, Monitor, Headphones, Router, BarChart3, FileText, MessageSquare, Wifi, Cloud } from 'lucide-react';

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
      case 'glpi':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <Headphones className="h-5 w-5" />
                Configuração GLPI
              </CardTitle>
              <CardDescription>
                Configure a integração com o sistema GLPI para chamados e inventário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GLPIConfig />
            </CardContent>
          </Card>
        );
      case 'chatwoot':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Configuração Chatwoot
              </CardTitle>
              <CardDescription>
                Configure a integração com o Chatwoot para atendimento ao cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatwootAdminConfig />
            </CardContent>
          </Card>
        );
      case 'evolution_api':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5" />
                Configuração Evolution API
              </CardTitle>
              <CardDescription>
                Configure a integração com a Evolution API para WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvolutionAPIAdminConfig />
            </CardContent>
          </Card>
        );
      case 'wasabi':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <Cloud className="h-5 w-5" />
                Configuração Wasabi
              </CardTitle>
              <CardDescription>
                Configure a integração com o Wasabi Cloud Storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WasabiAdminConfig />
            </CardContent>
          </Card>
        );
      case 'grafana':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Configuração Grafana
              </CardTitle>
              <CardDescription>
                Configure a integração com o Grafana para dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GrafanaAdminConfig />
            </CardContent>
          </Card>
        );
      case 'bomcontrole':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Configuração Bom Controle
              </CardTitle>
              <CardDescription>
                Configure a integração com o sistema Bom Controle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BomControleAdminConfig />
            </CardContent>
          </Card>
        );
      case 'ftp':
        return (
          <Card className="border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
                <HardDrive className="h-5 w-5" />
                Configuração FTP
              </CardTitle>
              <CardDescription>
                Configure a integração com servidor FTP para backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FtpAdminConfig />
            </CardContent>
          </Card>
        );
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
          <div className="space-y-6">
            {/* Seção de Integrações */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Key className="h-6 w-6" />
                Integrações de Sistemas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-cyan-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('glpi')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-cyan-100 p-3 rounded-lg">
                        <Headphones className="h-6 w-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-cyan-900">GLPI</h3>
                        <p className="text-sm text-cyan-600">Service Desk e Inventário</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('chatwoot')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Chatwoot</h3>
                        <p className="text-sm text-blue-600">Atendimento ao Cliente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('evolution_api')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">Evolution API</h3>
                        <p className="text-sm text-green-600">WhatsApp Business</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('wasabi')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Cloud className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Wasabi</h3>
                        <p className="text-sm text-purple-600">Cloud Storage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('grafana')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 p-3 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-900">Grafana</h3>
                        <p className="text-sm text-indigo-600">Dashboards Avançados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('bomcontrole')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-900">Bom Controle</h3>
                        <p className="text-sm text-orange-600">Gestão Empresarial</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('ftp')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <HardDrive className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">FTP</h3>
                        <p className="text-sm text-gray-600">Backup e Transferências</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>


              </div>
            </div>

            {/* Seção de Administração */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Administração Geral
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <p className="text-sm text-purple-600">Controle de acesso e permissões</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('integrations')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Key className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">APIs Gerais</h3>
                        <p className="text-sm text-blue-600">Configurações de API não específicas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-end">
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
                  <p className="text-xl font-bold text-green-900">5</p>
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
              {activeSection === 'integrations' && 'APIs Gerais'}
              {activeSection === 'companies' && 'Empresas'}
              {activeSection === 'users' && 'Usuários'}
              {activeSection === 'glpi' && 'GLPI'}
              {activeSection === 'zabbix' && 'Zabbix'}
              {activeSection === 'mikrotik' && 'Mikrotik'}
              {activeSection === 'chatwoot' && 'Chatwoot'}
              {activeSection === 'evolution_api' && 'Evolution API'}
              {activeSection === 'wasabi' && 'Wasabi'}
              {activeSection === 'grafana' && 'Grafana'}
              {activeSection === 'bomcontrole' && 'Bom Controle'}
              {activeSection === 'ftp' && 'FTP'}
              {activeSection === 'unifi' && 'UNIFI'}
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
