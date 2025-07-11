import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Settings, AlertCircle } from 'lucide-react';
import { useBaculaAPI } from '@/hooks/useBaculaAPI';
import { BaculaStatusCards } from '@/components/BaculaStatusCards';
import { BaculaFilters } from '@/components/BaculaFilters';
import { BaculaStatusTabs } from '@/components/BaculaStatusTabs';
import { BaculaAdvancedStats } from '@/components/BaculaAdvancedStats';
import { BaculaJobsGrid } from '@/components/BaculaJobsGrid';
import { BaculaDashboard } from '@/components/BaculaDashboard';
import { useBaculaJobsRecent } from '@/hooks/useBaculaAPI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
const Bacula = () => {
  const {
    baculaIntegration,
    isEnabled
  } = useBaculaAPI();
  const {
    data: jobsData
  } = useBaculaJobsRecent();

  // Estados para filtros - data padrão é ontem
  const [startDate, setStartDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');

  // Extrair jobs da resposta
  const extractJobs = (data: any) => {
    if (!data) return [];
    if (data.output && Array.isArray(data.output)) {
      return data.output;
    }
    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  };
  const jobs = extractJobs(jobsData);
  const handleResetFilters = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
    setStatusFilter('all');
    setClientFilter('');
  };
  if (!baculaIntegration) {
    return <div className="min-h-screen bg-slate-900 text-white p-6">
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
                <button onClick={() => window.location.href = '/admin'} className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 mx-auto">
                  <Settings className="h-4 w-4" />
                  Configurar BaculaWeb
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-slate-900 text-white">
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

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="dashboard" className="text-slate-300 bg-blue-800 hover:bg-blue-700">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="jobs" className="text-slate-300 bg-blue-800 hover:bg-blue-700">
              Jobs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <BaculaDashboard />
          </TabsContent>
          
          <TabsContent value="jobs" className="mt-6 space-y-6">
            <BaculaStatusCards />

            <BaculaAdvancedStats jobs={jobs} />

            <BaculaFilters startDate={startDate} endDate={endDate} statusFilter={statusFilter} clientFilter={clientFilter} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onStatusFilterChange={setStatusFilter} onClientFilterChange={setClientFilter} onReset={handleResetFilters} />

            <BaculaStatusTabs jobs={jobs} startDate={startDate} endDate={endDate} statusFilter={statusFilter} clientFilter={clientFilter}>
              <BaculaJobsGrid />
            </BaculaStatusTabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Bacula;