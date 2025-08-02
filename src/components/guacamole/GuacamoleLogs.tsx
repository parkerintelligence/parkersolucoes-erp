
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Trash2, 
  RefreshCw,
  Clock,
  Globe,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export interface GuacamoleLogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  method?: string;
  url?: string;
  dataSource?: string;
  status?: number;
  message: string;
  details?: any;
}

interface GuacamoleLogsProps {
  logs: GuacamoleLogEntry[];
  onClearLogs: () => void;
  onRefresh: () => void;
}

export const GuacamoleLogs = ({ logs, onClearLogs, onRefresh }: GuacamoleLogsProps) => {
  const [autoScroll, setAutoScroll] = React.useState(true);

  React.useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const scrollArea = document.getElementById('logs-scroll-area');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'request': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'response': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'request': return 'border-l-blue-500 bg-blue-50';
      case 'response': return 'border-l-green-500 bg-green-50';
      case 'info': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Logs de Conexão Guacamole
            </CardTitle>
            <CardDescription>
              Acompanhe em tempo real as requisições e respostas da API do Guacamole
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={onClearLogs} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Badge variant="secondary">
            Total de logs: {logs.length}
          </Badge>
        </div>
        
        <ScrollArea className="h-96" id="logs-scroll-area">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log disponível</p>
                <p className="text-sm">Execute alguma ação para ver os logs aparecerem aqui</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 border-l-4 rounded ${getLogColor(log.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getLogIcon(log.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.type.toUpperCase()}
                          </Badge>
                          {log.method && (
                            <Badge variant="secondary" className="text-xs">
                              {log.method}
                            </Badge>
                          )}
                          {log.status && (
                            <Badge 
                              variant={log.status >= 200 && log.status < 300 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {log.status}
                            </Badge>
                          )}
                          {log.dataSource && (
                            <Badge variant="outline" className="text-xs">
                              <Database className="h-3 w-3 mr-1" />
                              {log.dataSource}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.url && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                            {log.url}
                          </p>
                        )}
                        {log.details && (
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
