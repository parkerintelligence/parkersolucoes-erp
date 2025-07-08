
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Info,
  Network,
  Shield,
  Clock,
  Server
} from 'lucide-react';

interface DiagnosticTest {
  name: string;
  success: boolean;
  details: string;
}

interface ConnectionDiagnosis {
  timestamp: string;
  tests: DiagnosticTest[];
}

interface UniFiConnectionDiagnosticProps {
  onRunDiagnosis: () => void;
  diagnosisLoading?: boolean;
  diagnosis?: ConnectionDiagnosis | null;
  connectionUrl?: string;
}

export const UniFiConnectionDiagnostic: React.FC<UniFiConnectionDiagnosticProps> = ({
  onRunDiagnosis,
  diagnosisLoading = false,
  diagnosis,
  connectionUrl
}) => {
  const getTestIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-400" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    );
  };

  const getTestBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-900/20 text-green-400 border-green-600">
        Sucesso
      </Badge>
    ) : (
      <Badge className="bg-red-900/20 text-red-400 border-red-600">
        Falha
      </Badge>
    );
  };

  const getOverallStatus = () => {
    if (!diagnosis) return null;
    
    const failedTests = diagnosis.tests.filter(test => !test.success);
    const successfulTests = diagnosis.tests.filter(test => test.success);
    
    if (failedTests.length === 0) {
      return {
        status: 'success',
        message: 'Todos os testes passaram com sucesso',
        color: 'text-green-400'
      };
    } else if (successfulTests.length === 0) {
      return {
        status: 'error',
        message: 'Todos os testes falharam',
        color: 'text-red-400'
      };
    } else {
      return {
        status: 'warning',
        message: `${failedTests.length} de ${diagnosis.tests.length} testes falharam`,
        color: 'text-yellow-400'
      };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-400" />
          Diagnóstico de Conectividade UniFi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Controladora:</span>
            <span className="text-sm text-white font-mono">{connectionUrl}</span>
          </div>
          <Button
            onClick={onRunDiagnosis}
            disabled={diagnosisLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {diagnosisLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Executar Diagnóstico
          </Button>
        </div>

        {diagnosisLoading && (
          <Alert className="bg-blue-900/20 border-blue-600">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            <AlertDescription className="text-blue-300">
              Executando testes de conectividade...
            </AlertDescription>
          </Alert>
        )}

        {diagnosis && overallStatus && (
          <Alert className={
            overallStatus.status === 'success' ? 'bg-green-900/20 border-green-600' :
            overallStatus.status === 'error' ? 'bg-red-900/20 border-red-600' :
            'bg-yellow-900/20 border-yellow-600'
          }>
            {overallStatus.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : overallStatus.status === 'error' ? (
              <XCircle className="h-4 w-4 text-red-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            )}
            <AlertDescription className={overallStatus.color}>
              {overallStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {diagnosis && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              Executado em: {new Date(diagnosis.timestamp).toLocaleString('pt-BR')}
            </div>
            
            <div className="space-y-2">
              {diagnosis.tests.map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTestIcon(test.success)}
                    <div>
                      <div className="font-medium text-white">{test.name}</div>
                      <div className="text-sm text-gray-400">{test.details}</div>
                    </div>
                  </div>
                  {getTestBadge(test.success)}
                </div>
              ))}
            </div>
          </div>
        )}

        {!diagnosis && !diagnosisLoading && (
          <div className="text-center py-6">
            <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 mb-2">Clique em "Executar Diagnóstico" para testar a conectividade</p>
            <p className="text-sm text-gray-500">
              O diagnóstico verificará URL, conectividade, SSL e autenticação
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Dicas para resolução de problemas:</p>
              <ul className="space-y-1 text-xs">
                <li>• Para controladoras locais, use HTTP ao invés de HTTPS se houver problemas de certificado</li>
                <li>• Verifique se a controladora está acessível na rede</li>
                <li>• Confirme que as credenciais estão corretas</li>
                <li>• Certifique-se que a controladora UniFi está em execução</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
