import React from 'react';
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface UniFiAlertsManagerProps {
  alarms: any[];
  events: any[];
  loading?: boolean;
  onMarkAsRead?: (alarmId: string) => void;
}

export const UniFiAlertsManager: React.FC<UniFiAlertsManagerProps> = ({
  alarms = [],
  events = [],
  loading = false,
  onMarkAsRead
}) => {
  const getAlarmIcon = (category: number) => {
    switch (category) {
      case 1: return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 2: return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getAlarmSeverity = (category: number) => {
    switch (category) {
      case 1: return { label: 'Crítico', variant: 'destructive' as const };
      case 2: return { label: 'Aviso', variant: 'secondary' as const };
      default: return { label: 'Info', variant: 'outline' as const };
    }
  };

  const formatDateTime = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const criticalAlarms = alarms.filter(a => a.categ === 1 && !a.archived);
  const warningAlarms = alarms.filter(a => a.categ === 2 && !a.archived);
  const totalAlarms = alarms.filter(a => !a.archived);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlarms.length}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avisos</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{warningAlarms.length}</div>
            <p className="text-xs text-muted-foreground">Para monitoramento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlarms.length}</div>
            <p className="text-xs text-muted-foreground">Alertas ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas Recentes</CardTitle>
          <CardDescription>Monitoramento de eventos e alarmes da rede</CardDescription>
        </CardHeader>
        <CardContent>
          {totalAlarms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
              <p>Nenhum alerta ativo no momento</p>
              <p className="text-sm">Sua rede está funcionando normalmente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Subsistema</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalAlarms.slice(0, 10).map((alarm) => {
                  const severity = getAlarmSeverity(alarm.categ);
                  return (
                    <TableRow key={alarm._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAlarmIcon(alarm.categ)}
                          <Badge variant={severity.variant}>
                            {severity.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={alarm.msg}>
                          {alarm.msg}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{alarm.subsystem}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(alarm.time)}</TableCell>
                      <TableCell>
                        {!alarm.handled && onMarkAsRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkAsRead(alarm._id)}
                          >
                            Marcar como lido
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>Últimas atividades registradas na rede</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.slice(0, 20).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.msg || event.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.time || event.datetime)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};