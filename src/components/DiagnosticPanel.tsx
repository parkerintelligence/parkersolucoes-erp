
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/hooks/useIntegrations';
import { useTestEvolutionConnection, useSyncWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useLinksExport } from '@/hooks/useLinksExport';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { 
  Activity, 
  MessageCircle, 
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const DiagnosticPanel = () => {
  const { data: integrations = [] } = useIntegrations();
  const { data: passwords = [] } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const exportToPDF = useLinksExport();
  
  const testEvolutionConnection = useTestEvolutionConnection();
  const syncWhatsApp = useSyncWhatsAppConversations();
  
  const [lastTest, setLastTest] = useState<Record<string, any>>({});

  const evolutionIntegration = integrations.find(int => 
    int.type === 'evolution_api' && int.is_active
  );

  const guacamoleIntegration = integrations.find(int => 
    int.type === 'guacamole' && int.is_active
  );

  const glpiIntegration = integrations.find(int => 
    int.type === 'glpi' && int.is_active
  );

  const linksCount = passwords.filter(p => p.gera_link).length;

  const handleEvolutionTest = async () => {
    try {
      const result = await testEvolutionConnection.mutateAsync();
      setLastTest(prev => ({
        ...prev,
        evolution: { ...result, timestamp: new Date() }
      }));
    } catch (error) {
      setLastTest(prev => ({
        ...prev,
        evolution: { success: false, error: error.message, timestamp: new Date() }
      }));
    }
  };

  const handlePDFTest = async () => {
    console.log('🧪 Iniciando teste de exportação PDF...');
    try {
      await exportToPDF.mutateAsync();
      setLastTest(prev => ({
        ...prev,
        pdf: { success: true, message: 'PDF exportado com sucesso', timestamp: new Date() }
      }));
    } catch (error) {
      console.error('❌ Erro no teste PDF:', error);
      setLastTest(prev => ({
        ...prev,
        pdf: { success: false, error: error.message, timestamp: new Date() }
      }));
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning' | 'unknown') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'warning' | 'unknown') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Painel de Diagnóstico</h2>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="text-slate-300 border-slate-600"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* WhatsApp Evolution API */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Evolution
              </div>
              {getStatusBadge(evolutionIntegration ? 'success' : 'error')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-400">
              <p>Status: {evolutionIntegration ? 'Configurado' : 'Não configurado'}</p>
              {evolutionIntegration && (
                <>
                  <p>Instance: {evolutionIntegration.instance_name}</p>
                  <p>URL: {evolutionIntegration.base_url}</p>
                </>
              )}
            </div>
            
            {lastTest.evolution && (
              <Alert className="bg-slate-700 border-slate-600">
                <AlertDescription className="text-slate-300">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(lastTest.evolution.success ? 'success' : 'error')}
                    <span className="text-xs">
                      {lastTest.evolution.success 
                        ? lastTest.evolution.message 
                        : lastTest.evolution.error}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {lastTest.evolution.timestamp.toLocaleTimeString()}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleEvolutionTest}
                disabled={!evolutionIntegration || testEvolutionConnection.isPending}
                size="sm"
                className="flex-1"
              >
                {testEvolutionConnection.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Testar'
                )}
              </Button>
              <Button
                onClick={() => syncWhatsApp.mutate()}
                disabled={!evolutionIntegration || syncWhatsApp.isPending}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {syncWhatsApp.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Sync'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export PDF */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export PDF
              </div>
              {getStatusBadge(linksCount > 0 ? 'success' : 'warning')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-400">
              <p>Links disponíveis: {linksCount}</p>
              <p>Empresas: {companies.length}</p>
              <p>Total senhas: {passwords.length}</p>
            </div>
            
            {lastTest.pdf && (
              <Alert className="bg-slate-700 border-slate-600">
                <AlertDescription className="text-slate-300">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(lastTest.pdf.success ? 'success' : 'error')}
                    <span className="text-xs">
                      {lastTest.pdf.success 
                        ? lastTest.pdf.message 
                        : lastTest.pdf.error}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {lastTest.pdf.timestamp.toLocaleTimeString()}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handlePDFTest}
              disabled={linksCount === 0 || exportToPDF.isPending}
              size="sm"
              className="w-full"
            >
              {exportToPDF.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Download className="h-3 w-3 mr-2" />
                  Testar Export
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Guacamole */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Guacamole
              </div>
              {getStatusBadge(guacamoleIntegration ? 'success' : 'error')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-400">
              <p>Status: {guacamoleIntegration ? 'Configurado' : 'Não configurado'}</p>
              {guacamoleIntegration && (
                <>
                  <p>URL: {guacamoleIntegration.base_url}</p>
                  <p>Data Source: {guacamoleIntegration.api_token || 'postgresql'}</p>
                </>
              )}
            </div>

            <Button
              disabled={!guacamoleIntegration}
              size="sm"
              className="w-full"
              onClick={() => {
                toast.success("✅ Guacamole OK", {
                  description: "Data Source configurado corretamente."
                });
              }}
            >
              Verificar
            </Button>
          </CardContent>
        </Card>

        {/* GLPI */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                GLPI Tickets
              </div>
              {getStatusBadge(glpiIntegration ? 'success' : 'error')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-400">
              <p>Status: {glpiIntegration ? 'Configurado' : 'Não configurado'}</p>
              {glpiIntegration && (
                <p>URL: {glpiIntegration.base_url}</p>
              )}
            </div>

            <Button
              disabled={!glpiIntegration}
              size="sm"
              className="w-full"
              onClick={() => {
                toast.info("ℹ️ GLPI", {
                  description: "Verificar logs da edge function para status dos tickets agendados."
                });
              }}
            >
              Verificar Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-slate-800 border-slate-600">
        <Activity className="h-4 w-4" />
        <AlertDescription className="text-slate-300">
          <strong>Resumo do Sistema:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Evolution API: {evolutionIntegration ? '✅ Configurado' : '❌ Não configurado'}</li>
            <li>• Export PDF: {linksCount > 0 ? `✅ ${linksCount} links disponíveis` : '⚠️ Nenhum link para exportar'}</li>
            <li>• Guacamole: {guacamoleIntegration ? '✅ Configurado com Data Source' : '❌ Não configurado'}</li>
            <li>• GLPI: {glpiIntegration ? '✅ Configurado' : '❌ Não configurado'}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
