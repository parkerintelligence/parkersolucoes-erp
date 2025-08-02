
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle 
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const GuacamoleTokenStatus = () => {
  const { data: integrations } = useIntegrations();
  const [tokenStatus, setTokenStatus] = React.useState<{
    isValid: boolean;
    expiresAt?: Date;
    timeLeft?: number;
    error?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const integration = integrations?.find(i => i.type === 'guacamole' && i.is_active);

  const checkTokenStatus = async () => {
    if (!integration) return;

    try {
      const { data, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: integration.id,
          endpoint: 'token-status',
          method: 'GET'
        }
      });

      if (error) {
        setTokenStatus({ isValid: false, error: error.message });
        return;
      }

      if (data?.error) {
        setTokenStatus({ isValid: false, error: data.error });
        return;
      }

      // Simular status do token (50 minutos de cache)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (50 * 60 * 1000));
      const timeLeft = Math.max(0, (expiresAt.getTime() - now.getTime()) / 1000 / 60);

      setTokenStatus({
        isValid: true,
        expiresAt,
        timeLeft
      });

    } catch (error) {
      console.error('Erro ao verificar status do token:', error);
      setTokenStatus({ 
        isValid: false, 
        error: 'Erro ao verificar status do token' 
      });
    }
  };

  const refreshToken = async () => {
    if (!integration) return;

    setIsRefreshing(true);
    try {
      // Fazer uma chamada para forçar renovação do token
      const { data, error } = await supabase.functions.invoke('guacamole-proxy', {
        body: {
          integrationId: integration.id,
          endpoint: 'connections',
          method: 'GET',
          forceRefresh: true
        }
      });

      if (error) {
        toast({
          title: "Erro ao renovar token",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro ao renovar token",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Token renovado",
        description: "Token de autenticação renovado com sucesso.",
      });

      // Recarregar status
      await checkTokenStatus();

    } catch (error) {
      console.error('Erro ao renovar token:', error);
      toast({
        title: "Erro ao renovar token",
        description: "Não foi possível renovar o token de autenticação.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (integration) {
      checkTokenStatus();
    }
  }, [integration]);

  React.useEffect(() => {
    // Atualizar a cada minuto
    const interval = setInterval(() => {
      if (tokenStatus?.isValid && tokenStatus.expiresAt) {
        const timeLeft = Math.max(0, (tokenStatus.expiresAt.getTime() - Date.now()) / 1000 / 60);
        setTokenStatus(prev => prev ? { ...prev, timeLeft } : null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [tokenStatus]);

  if (!integration) return null;

  const getTokenStatusIcon = () => {
    if (!tokenStatus) return <Clock className="h-4 w-4" />;
    if (tokenStatus.error) return <XCircle className="h-4 w-4" />;
    if (tokenStatus.isValid) return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getTokenStatusColor = () => {
    if (!tokenStatus) return 'secondary';
    if (tokenStatus.error) return 'destructive';
    if (tokenStatus.isValid) {
      if (tokenStatus.timeLeft && tokenStatus.timeLeft < 10) return 'destructive';
      if (tokenStatus.timeLeft && tokenStatus.timeLeft < 20) return 'secondary';
      return 'default';
    }
    return 'destructive';
  };

  const getProgressValue = () => {
    if (!tokenStatus?.isValid || !tokenStatus.timeLeft) return 0;
    return (tokenStatus.timeLeft / 50) * 100; // 50 minutos é o máximo
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Status do Token
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshToken}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Renovando...' : 'Renovar'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={getTokenStatusColor()} className="flex items-center gap-1">
            {getTokenStatusIcon()}
            {tokenStatus?.error ? 'Erro' : 
             tokenStatus?.isValid ? 'Válido' : 'Inválido'}
          </Badge>
          
          {tokenStatus?.isValid && tokenStatus.timeLeft && (
            <span className="text-sm text-muted-foreground">
              {Math.round(tokenStatus.timeLeft)} min restantes
            </span>
          )}
        </div>

        {tokenStatus?.isValid && tokenStatus.timeLeft && (
          <div className="space-y-2">
            <Progress value={getProgressValue()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Token expira às {tokenStatus.expiresAt?.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        )}

        {tokenStatus?.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{tokenStatus.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
