
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  TestTube, 
  RefreshCw, 
  FileText, 
  MessageSquare,
  ExternalLink 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTestEvolutionConnection } from '@/hooks/useWhatsAppConversations';
import { useLinksExport } from '@/hooks/useLinksExport';

const DebugPanel = () => {
  const testEvolutionConnection = useTestEvolutionConnection();
  const { exportToPDF } = useLinksExport();

  const testGLPIFunction = async () => {
    try {
      console.log('🧪 Testando função GLPI...');
      const { data, error } = await supabase.functions.invoke('test-glpi-tickets');
      
      if (error) {
        console.error('❌ Erro no teste GLPI:', error);
        toast({
          title: "❌ Erro no teste GLPI",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Resultado do teste GLPI:', data);
      toast({
        title: "✅ Teste GLPI executado",
        description: data.message || "Teste realizado com sucesso",
      });
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast({
        title: "❌ Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testPDFExport = async () => {
    try {
      console.log('🧪 Testando exportação PDF...');
      await exportToPDF();
    } catch (error: any) {
      console.error('❌ Erro no teste PDF:', error);
      toast({
        title: "❌ Erro no teste PDF",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Painel de Debug
        </CardTitle>
        <CardDescription>
          Ferramentas para testar e debugar integrações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GLPI Debug */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              GLPI Scheduled Tickets
            </h4>
            <Button 
              onClick={testGLPIFunction}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Testar Função Manual
            </Button>
          </div>

          {/* WhatsApp Debug */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp Evolution
            </h4>
            <Button 
              onClick={() => testEvolutionConnection.mutate()}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={testEvolutionConnection.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {testEvolutionConnection.isPending ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>

          {/* PDF Export Debug */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportação PDF
            </h4>
            <Button 
              onClick={testPDFExport}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Testar Export Links
            </Button>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h4 className="font-medium">Status do Sistema</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Debug Ativo</Badge>
              <Badge variant="outline">Logs Detalhados</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
