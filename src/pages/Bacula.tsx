
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Settings, BarChart3, Server, HardDrive, AlertCircle } from 'lucide-react';
import { useBaculaAPI } from '@/hooks/useBaculaAPI';
import { BaculaJobsGrid } from '@/components/BaculaJobsGrid';
import { BaculaStatusCards } from '@/components/BaculaStatusCards';

const Bacula = () => {
  const { baculaIntegration, isEnabled } = useBaculaAPI();
  const [activeTab, setActiveTab] = useState('jobs');

  if (!baculaIntegration) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Sistema de Backup Bacula</h1>
          </div>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <h3 className="text-lg font-semibold mb-2 text-white">BaculaWeb não configurado</h3>
              <p className="text-slate-400 mb-6">
                Para acessar o sistema de backup Bacula, você precisa configurar a integração com BaculaWeb no painel administrativo.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-slate-300 bg-slate-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Informações necessárias:</h4>
                  <ul className="space-y-1 text-left">
                    <li>• URL do servidor BaculaWeb</li>
                    <li>• Usuário com permissões administrativas</li>
                    <li>• Senha do usuário</li>
                  </ul>
                </div>
                <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar BaculaWeb
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-400" />
              Sistema de Backup Bacula
            </h1>
            <p className="text-slate-400">Monitore e gerencie seus backups com BaculaWeb</p>
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium">Conectado a:</span> {baculaIntegration.name} ({baculaIntegration.base_url})
            </div>
          </div>
        </div>

        <BaculaStatusCards />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button 
            variant={activeTab === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('jobs')}
            className={`h-12 ${activeTab === 'jobs' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Jobs de Backup
          </Button>
          <Button 
            variant={activeTab === 'clients' ? 'default' : 'outline'}
            onClick={() => setActiveTab('clients')}
            className={`h-12 ${activeTab === 'clients' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
          >
            <Server className="mr-2 h-4 w-4" />
            Clientes
          </Button>
          <Button 
            variant={activeTab === 'storage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('storage')}
            className={`h-12 ${activeTab === 'storage' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
          >
            <HardDrive className="mr-2 h-4 w-4" />
            Storages & Volumes
          </Button>
        </div>

        <div className="mt-6">
          {activeTab === 'jobs' && <BaculaJobsGrid />}
          {activeTab === 'clients' && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Server className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold mb-2 text-white">Clientes em desenvolvimento</h3>
                <p className="text-slate-400">
                  A visualização de clientes será implementada em breve.
                </p>
              </CardContent>
            </Card>
          )}
          {activeTab === 'storage' && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <HardDrive className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold mb-2 text-white">Storages em desenvolvimento</h3>
                <p className="text-slate-400">
                  A visualização de storages e volumes será implementada em breve.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bacula;
