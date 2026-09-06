
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';

export const GLPIConnectionStatus = () => {
  const { 
    glpiIntegration, 
    hasValidSession, 
    isEnabled, 
    initSession,
    tickets 
  } = useGLPIExpanded();

  if (!glpiIntegration) {
    return null;
  }

  const getStatusColor = () => {
    if (!hasValidSession) return 'destructive';
    if (isEnabled && !tickets.isLoading) return 'default';
    return 'secondary';
  };

  const getStatusText = () => {
    if (!hasValidSession) return 'Sessão não iniciada';
    if (tickets.isLoading) return 'Carregando dados...';
    if (tickets.error) return 'Erro na conexão';
    if (tickets.data && Array.isArray(tickets.data)) {
      return `Conectado (${tickets.data.length} chamados)`;
    }
    return 'Conectado';
  };

  const getStatusIcon = () => {
    if (!hasValidSession) return <AlertCircle className="h-4 w-4" />;
    if (tickets.isLoading) return <Clock className="h-4 w-4" />;
    if (tickets.error) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className="bg-card border-border mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium text-foreground">Status da Conexão GLPI</span>
            </div>
            <Badge variant={getStatusColor()} className="bg-blue-600 text-foreground border-blue-500">
              {getStatusText()}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => initSession.mutate()}
              disabled={initSession.isPending}
              className="border-border text-foreground hover:bg-secondary bg-card"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${initSession.isPending ? 'animate-spin' : ''}`} />
              {hasValidSession ? 'Renovar Sessão' : 'Iniciar Sessão'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {glpiIntegration.base_url}
            </span>
          </div>
        </div>
        
        {tickets.error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-700 text-sm text-red-300">
            Erro: {tickets.error.message}
          </div>
        )}
        
        {hasValidSession && !tickets.isLoading && (
          <div className="mt-2 text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
