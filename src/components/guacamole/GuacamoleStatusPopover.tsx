import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Shield, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Monitor,
  Users,
  Activity,
  FolderOpen
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GuacamoleStatusPopoverProps {
  connections: any[];
  users: any[];
  activeSessions: any[];
  connectionGroups: any[];
}

export const GuacamoleStatusPopover = ({ 
  connections, 
  users, 
  activeSessions, 
  connectionGroups 
}: GuacamoleStatusPopoverProps) => {
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
    const interval = setInterval(() => {
      if (tokenStatus?.isValid && tokenStatus.expiresAt) {
        const timeLeft = Math.max(0, (tokenStatus.expiresAt.getTime() - Date.now()) / 1000 / 60);
        setTokenStatus(prev => prev ? { ...prev, timeLeft } : null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [tokenStatus]);

  const getTokenStatusIcon = () => {
    if (!tokenStatus) return <Clock className="h-3 w-3" />;
    if (tokenStatus.error) return <XCircle className="h-3 w-3" />;
    if (tokenStatus.isValid) return <CheckCircle className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
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
    return (tokenStatus.timeLeft / 50) * 100;
  };

  const getStatusText = () => {
    if (!tokenStatus) return 'Verificando...';
    if (tokenStatus.error) return 'Erro';
    if (tokenStatus.isValid) {
      if (tokenStatus.timeLeft && tokenStatus.timeLeft < 10) return 'Expirando';
      return 'Ativo';
    }
    return 'Inválido';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          <Shield className="h-4 w-4 mr-2" />
          {getStatusText()}
          {tokenStatus?.isValid && tokenStatus.timeLeft && (
            <span className="ml-2 text-xs text-yellow-400">
              {Math.round(tokenStatus.timeLeft)}min
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-slate-800 border-slate-700 text-white" align="end">
        <div className="space-y-4">
          {/* Status do Token */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Status do Token
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshToken}
                disabled={isRefreshing}
                className="h-7 px-2 bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant={getTokenStatusColor()} className="flex items-center gap-1 text-xs">
                {getTokenStatusIcon()}
                {tokenStatus?.error ? 'Erro' : 
                 tokenStatus?.isValid ? 'Válido' : 'Inválido'}
              </Badge>
              
              {tokenStatus?.isValid && tokenStatus.timeLeft && (
                <span className="text-xs text-slate-400">
                  {Math.round(tokenStatus.timeLeft)} min restantes
                </span>
              )}
            </div>

            {tokenStatus?.isValid && tokenStatus.timeLeft && (
              <div className="space-y-1">
                <Progress value={getProgressValue()} className="h-1" />
                <p className="text-xs text-slate-400">
                  Expira às {tokenStatus.expiresAt?.toLocaleTimeString('pt-BR')}
                </p>
              </div>
            )}

            {tokenStatus?.error && (
              <div className="p-2 bg-red-900/30 border border-red-700/30 rounded text-xs text-red-300">
                {tokenStatus.error}
              </div>
            )}
          </div>

          {/* Cards de Resumo Mini */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-slate-300">Conexões</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{connections.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-slate-300">Usuários</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{users.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-slate-300">Sessões</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{activeSessions.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-slate-300">Grupos</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{connectionGroups.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};