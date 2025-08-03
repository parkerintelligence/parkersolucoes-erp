import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wifi, AlertCircle, CheckCircle, Loader2, Settings } from "lucide-react";
import { useUniFiAPI } from "@/hooks/useUniFiAPI";

interface UniFiConnectionTestProps {
  integrationId: string;
}

export const UniFiConnectionTest = ({ integrationId }: UniFiConnectionTestProps) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const { toast } = useToast();
  const { testUniFiConnection } = useUniFiAPI();

  const runConnectionTest = async () => {
    setTestStatus('testing');
    setTestResults(null);
    setErrorDetails('');

    try {
      console.log('Testing UniFi connection for integration:', integrationId);
      
      const result = await testUniFiConnection.mutateAsync(integrationId);

      console.log('Connection test result:', result);
      
      if (result.error) {
        setTestStatus('error');
        setErrorDetails(result.error);
        toast({
          title: "Teste de Conexão Falhou",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setTestStatus('success');
        setTestResults(result);
        toast({
          title: "Conexão Estabelecida",
          description: "UniFi Controller conectado com sucesso!",
        });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setTestStatus('error');
      setErrorDetails(error.message || 'Erro desconhecido');
      toast({
        title: "Erro no Teste",
        description: error.message || 'Falha ao testar conexão',
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'testing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (testStatus) {
      case 'testing':
        return <Badge variant="secondary">Testando...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro de Conexão</Badge>;
      default:
        return <Badge variant="outline">Não Testado</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Status da Conexão UniFi
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={runConnectionTest}
            disabled={testStatus === 'testing'}
            variant={testStatus === 'success' ? 'outline' : 'default'}
            className="flex items-center gap-2"
          >
            {testStatus === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            {testStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </div>

        {testStatus === 'error' && errorDetails && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Detalhes do Erro:</p>
            <p className="text-sm text-red-700 mt-1 font-mono">{errorDetails}</p>
          </div>
        )}

        {testStatus === 'success' && testResults && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">Conexão Bem-sucedida!</p>
            <div className="text-sm text-green-700 mt-2 space-y-1">
              <p>• Controller conectado</p>
              <p>• Autenticação OK</p>
              <p>• API respondendo</p>
              {testResults.data && (
                <p>• {Array.isArray(testResults.data) ? testResults.data.length : Object.keys(testResults.data).length} itens retornados</p>
              )}
            </div>
          </div>
        )}

        {testStatus === 'idle' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Clique em "Testar Conexão" para verificar se a integração UniFi está funcionando corretamente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};