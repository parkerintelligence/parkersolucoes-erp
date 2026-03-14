import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Settings, AlertCircle, Send, CheckCircle2, Activity, HardDrive, BarChart3 } from 'lucide-react';
import { useBaculaAPI, useBaculaJobsAll } from '@/hooks/useBaculaAPI';
import { useBaculaJobsData } from '@/hooks/useBaculaJobsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BaculaDashboard } from '@/components/BaculaDashboard';
import { BaculaAnalysisDialog } from '@/components/BaculaAnalysisDialog';
import { BaculaJobsDialog } from '@/components/BaculaJobsDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Bacula = () => {
  const { baculaIntegration, isEnabled } = useBaculaAPI();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestingAutomation, setIsTestingAutomation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const { data: jobsData, isLoading: jobsLoading } = useBaculaJobsAll();

  const { allJobs, filteredJobs, jobStats, pieData, clientStats, recentJobs } = useBaculaJobsData(jobsData, searchTerm, statusFilter, dateFilter);

  const handleTestAutomation = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Informe um número de telefone');
      return;
    }
    setIsTestingAutomation(true);
    try {
      toast.info('Iniciando teste da automação do Bacula...');
      const { data, error } = await supabase.functions.invoke('test-bacula-report', {
        body: { phone_number: testPhoneNumber, run_diagnostic: true, send_report: true }
      });
      if (error) throw error;
      if (data.success) {
        toast.success(`Teste concluído! ${data.summary.successful_steps}/${data.summary.total_steps} passos.`);
      } else {
        toast.warning(`Teste parcial: ${data.summary.successful_steps}/${data.summary.total_steps} passos.`);
      }
      setIsTestDialogOpen(false);
      setTestPhoneNumber('');
    } catch (error: any) {
      console.error('Erro no teste:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsTestingAutomation(false);
    }
  };

  if (!baculaIntegration) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Sistema de Backup Bacula
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitore e gerencie seus backups</p>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground mb-1">BaculaWeb não configurado</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Configure a integração com BaculaWeb no painel administrativo.
            </p>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                <h4 className="font-semibold mb-1.5">Informações necessárias:</h4>
                <ul className="space-y-0.5 text-left">
                  <li>• URL do servidor BaculaWeb</li>
                  <li>• Usuário com permissões administrativas</li>
                  <li>• Senha do usuário</li>
                </ul>
              </div>
              <Button onClick={() => window.location.href = '/admin'} size="sm" className="h-8 text-xs">
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Configurar BaculaWeb
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Sistema de Backup Bacula
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conectado a: {baculaIntegration.name} ({baculaIntegration.base_url})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <span />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-sm">Teste da Automação Bacula</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Envia um relatório com dados reais dos jobs do dia atual.
                </p>
                <div>
                  <Label htmlFor="phone" className="text-xs">Número do WhatsApp</Label>
                  <Input id="phone" value={testPhoneNumber} onChange={e => setTestPhoneNumber(e.target.value)} placeholder="Ex: 5511999999999" className="h-8 text-xs mt-1" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsTestDialogOpen(false)} className="h-8 text-xs">Cancelar</Button>
                  <Button size="sm" onClick={handleTestAutomation} disabled={isTestingAutomation} className="h-8 text-xs">
                    <Send className="mr-1.5 h-3.5 w-3.5" />
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

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Concluídos", value: jobStats.completedJobs, sub: "com sucesso", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Jobs Ativos", value: jobStats.runningJobs, sub: "executando agora", icon: Activity, color: "text-purple-400" },
          { label: "Tamanho Total", value: jobStats.totalBytes > 0 ? `${Math.round(jobStats.totalBytes / 1024 ** 3)} GB` : '0 GB', sub: "processados", icon: HardDrive, color: "text-blue-400" },
          { label: "Total Jobs", value: jobStats.totalJobs, sub: "finalizados", icon: BarChart3, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
            <s.icon className={`h-4 w-4 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard */}
      <BaculaDashboard />
    </div>
  );
};

export default Bacula;
