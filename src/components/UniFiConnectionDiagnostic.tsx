import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, CheckCircle, XCircle, Wifi, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UniFiConnectionDiagnosticProps {
  integrationId: string;
}

const UniFiConnectionDiagnostic: React.FC<UniFiConnectionDiagnosticProps> = ({ integrationId }) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const response = await supabase.functions.invoke('unifi-proxy', {
        body: {
          integrationId,
          endpoint: '/api/self/sites',
          method: 'GET'
        }
      });

      const result = {
        test: 'Conexão Local UniFi',
        status: response.error ? 'error' : 'success',
        data: response.data,
        error: response.error
      };

      setResults([result]);
      
      toast({
        title: result.status === 'success' ? "Conexão bem-sucedida" : "Erro na conexão",
        description: result.status === 'success' ? "Controladora UniFi conectada!" : result.error?.message || 'Falha na conexão',
        variant: result.status === 'success' ? "default" : "destructive"
      });
      
    } catch (error) {
      const result = {
        test: 'Conexão Local UniFi',
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      setResults([result]);
    }
    
    setIsRunning(false);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-blue-400" />
          <div>
            <CardTitle className="text-white">Diagnóstico UniFi</CardTitle>
            <CardDescription className="text-slate-400">
              Teste a conectividade com sua controladora local
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Testar Conexão
            </>
          )}
        </Button>

        {results.map((result, index) => (
          <Alert key={index} className="border-slate-600">
            <div className="flex items-center gap-2">
              {result.status === 'success' ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <XCircle className="h-4 w-4 text-red-500" />
              }
              <Badge variant={result.status === 'success' ? "default" : "destructive"}>
                {result.status === 'success' ? 'Sucesso' : 'Erro'}
              </Badge>
            </div>
            {result.error && (
              <AlertDescription className="text-red-400 mt-2">
                {result.error}
              </AlertDescription>
            )}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default UniFiConnectionDiagnostic;