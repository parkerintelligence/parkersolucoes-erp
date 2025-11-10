import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useChatwootStatusHistory } from '@/hooks/useChatwootStatusHistory';

interface ChatwootStatusHistoryProps {
  integrationId: string | undefined;
  conversationId: string | null;
}

export const ChatwootStatusHistory = ({ integrationId, conversationId }: ChatwootStatusHistoryProps) => {
  const { data: history = [], isLoading } = useChatwootStatusHistory(integrationId, conversationId);

  const getStatusConfig = (status: string) => {
    const configs = {
      open: { color: 'bg-green-500', icon: Clock, label: 'Aberta', textColor: 'text-green-700' },
      resolved: { color: 'bg-blue-500', icon: CheckCircle2, label: 'Resolvida', textColor: 'text-blue-700' },
      pending: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Pendente', textColor: 'text-yellow-700' }
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Histórico de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Histórico de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma alteração de status registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
          <Clock className="h-4 w-4" />
          Histórico de Status ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {history.map((entry) => {
              const prevConfig = getStatusConfig(entry.previous_status);
              const newConfig = getStatusConfig(entry.new_status);
              const PrevIcon = prevConfig.icon;
              const NewIcon = newConfig.icon;

              return (
                <div
                  key={entry.id}
                  className="relative pl-6 pb-3 border-l-2 border-border last:border-l-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 -translate-x-[9px] w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="space-y-2">
                    {/* Data e hora */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>

                    {/* Mudança de status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${prevConfig.color} text-white text-xs`}>
                        <PrevIcon className="h-3 w-3 mr-1" />
                        {prevConfig.label}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className={`${newConfig.color} text-white text-xs`}>
                        <NewIcon className="h-3 w-3 mr-1" />
                        {newConfig.label}
                      </Badge>
                    </div>

                    {/* Usuário que fez a mudança */}
                    {entry.changed_by_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Por: {entry.changed_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
