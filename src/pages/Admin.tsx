
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AdminApiPanel } from '@/components/AdminApiPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Shield, Database } from 'lucide-react';

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

        {/* Painel de Configurações de API */}
        <AdminApiPanel />
      </div>
    </Layout>
  );
};

export default Admin;
