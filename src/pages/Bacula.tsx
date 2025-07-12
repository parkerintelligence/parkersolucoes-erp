
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Settings, AlertCircle, Send, TestTube } from 'lucide-react';
import { useBaculaAPI, useBaculaJobsAll } from '@/hooks/useBaculaAPI';
import { useBaculaJobsData } from '@/hooks/useBaculaJobsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BaculaDashboard } from '@/components/BaculaDashboard';
import { BaculaAnalysisDialog } from '@/components/BaculaAnalysisDialog';
import { BaculaJobsDialog } from '@/components/BaculaJobsDialog';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Bacula = () => {
  const {
    baculaIntegration,
    isEnabled
  } = useBaculaAPI();

  // Estados para o teste de automação
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestingAutomation, setIsTestingAutomation] = useState(false);

  // Estados para filtros - 7 dias por padrão para consistência
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const {
    data: jobsData,
    isLoading: jobsLoading
  } = useBaculaJobsAll();

  // Usar o hook customizado para processar dados dos jobs
  const {
    allJobs,
    filteredJobs,
    jobStats,
    pieData,
    clientStats,
    recentJobs
  } = useBaculaJobsData(jobsData, searchTerm, statusFilter, dateFilter);
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('7days'); // Reset para 7 dias
  };

  const handleTestAutomation = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Por favor, informe um número de telefone para o teste');
      return;
    }

    setIsTestingAutomation(true);
    
    try {
      toast.info('Iniciando teste da automação do Bacula...');
      
      // Chamar a função de teste que enviará dados reais do dia atual
      const { data, error } = await supabase.functions.invoke('test-bacula-report', {
        body: {
          phone_number: testPhoneNumber,
          run_diagnostic: true,
          send_report: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('Resultado do teste:', data);

      if (data.success) {
        toast.success(`Teste concluído com sucesso! ${data.summary.successful_steps}/${data.summary.total_steps} passos executados.`);
      } else {
        toast.warning(`Teste parcial: ${data.summary.successful_steps}/${data.summary.total_steps} passos executados. Verifique os logs.`);
      }
      
      setIsTestDialogOpen(false);
      setTestPhoneNumber('');
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setIsTestingAutomation(false);
    }
  };

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
                <Button onClick={() => window.location.href = '/admin'} className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 mx-auto">
                  <Settings className="h-4 w-4" />
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
          <div className="flex items-center gap-2">
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-400 hover:bg-green-900/20"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Testar Automação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Teste da Automação Bacula</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm">
                    Este teste irá enviar um relatório com dados reais dos jobs do Bacula do dia atual.
                  </p>
                  <div>
                    <Label htmlFor="phone" className="text-slate-300">Número do WhatsApp (com código do país)</Label>
                    <Input
                      id="phone"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="Ex: 5511999999999"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsTestDialogOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleTestAutomation}
                      disabled={isTestingAutomation}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isTestingAutomation ? 'Testando...' : 'Enviar Teste'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <BaculaJobsDialog />
            <BaculaAnalysisDialog jobs={allJobs} />
          </div>
        </div>

        {/* Cards principais acima das abas - usando dados filtrados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{jobStats.completedJobs}</div>
              <div className="text-sm text-slate-300 font-medium">Job Status</div>
              <div className="text-xs text-slate-400 mt-1">Terminados com sucesso</div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-900/20 border-purple-600/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{jobStats.runningJobs}</div>
              <div className="text-sm text-purple-300 font-medium">Jobs Ativos</div>
              <div className="text-xs text-purple-400 mt-1">Executando agora</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-900/20 border-blue-600/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {jobStats.totalBytes > 0 ? `${Math.round(jobStats.totalBytes / 1024 ** 3)}` : '0'}
              </div>
              <div className="text-sm text-blue-300 font-medium">Tamanho Total</div>
              <div className="text-xs text-blue-400 mt-1">GB processados</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-300 mb-1">{jobStats.totalJobs}</div>
              <div className="text-sm text-slate-300 font-medium">Job Status Terminated</div>
              <div className="text-xs text-slate-400 mt-1">Todos os jobs finalizados</div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard principal */}
        <BaculaDashboard />

      </div>
    </div>
  );
};

export default Bacula;
