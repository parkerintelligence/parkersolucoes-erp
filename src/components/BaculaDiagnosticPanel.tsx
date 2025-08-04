import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBaculaDiagnostic } from '@/hooks/useBaculaAPI';
import { AlertCircle, CheckCircle, Clock, Server, Activity, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const BaculaDiagnosticPanel = () => {
  const { data, isLoading, error, refetch } = useBaculaDiagnostic();

  const handleRunDiagnostic = () => {
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Diagnóstico de Conectividade Bacula
        </CardTitle>
        <CardDescription>
          Teste a conectividade e veja informações detalhadas sobre o servidor Bacula
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleRunDiagnostic} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Executando Diagnóstico...' : 'Executar Diagnóstico'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro no diagnóstico: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center gap-2">
              {data.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-semibold">
                Status: {data.success ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* Informações do Servidor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Servidor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono break-all">{data.data?.server}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timestamp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {data.data?.timestamp ? new Date(data.data.timestamp).toLocaleString('pt-BR') : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Health Check */}
            {data.data?.healthcheck && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Health Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Status:</span>
                      <Badge variant={data.data.healthcheck.success ? 'default' : 'destructive'} className="ml-2">
                        {data.data.healthcheck.success ? 'OK' : 'ERRO'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Tempo Resposta:</span>
                      <span className="ml-2">{data.data.healthcheck.responseTime}ms</span>
                    </div>
                    <div>
                      <span className="font-semibold">Versão API:</span>
                      <span className="ml-2">{data.data.healthcheck.apiVersion || 'N/A'}</span>
                    </div>
                    {data.data.healthcheck.error && (
                      <div className="col-span-full">
                        <span className="font-semibold text-red-500">Erro:</span>
                        <span className="ml-2">{data.data.healthcheck.error}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Circuit Breakers */}
            {data.data?.circuitBreakers && data.data.circuitBreakers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Circuit Breakers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.data.circuitBreakers.map((cb: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono text-xs break-all flex-1">{cb.url}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant={cb.isOpen ? 'destructive' : 'secondary'}>
                            {cb.isOpen ? 'ABERTO' : 'FECHADO'}
                          </Badge>
                          <span className="text-xs">Falhas: {cb.failures}</span>
                          {cb.lastFailure && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(cb.lastFailure).toLocaleTimeString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cache Statistics */}
            {data.data?.cacheStats && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Estatísticas de Cache
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{data.data.cacheStats.endpointCache}</div>
                      <div className="text-muted-foreground">Endpoints</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{data.data.cacheStats.responseCache}</div>
                      <div className="text-muted-foreground">Respostas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{data.data.cacheStats.emergencyCache}</div>
                      <div className="text-muted-foreground">Emergência</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};