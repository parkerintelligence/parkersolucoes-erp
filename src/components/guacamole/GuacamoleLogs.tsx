
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Trash2, 
  RefreshCw,
  Globe,
  Database,
  CheckCircle,
  XCircle,
  Info,
  Monitor
} from 'lucide-react';

export interface GuacamoleLogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  source?: 'guacamole' | 'rustdesk';
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'guacamole' | 'rustdesk'>('all');

  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const scrollArea = document.getElementById('logs-scroll-area');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(l => (l.source || 'guacamole') === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      case 'request': return <Globe className="h-3.5 w-3.5 text-blue-400" />;
      case 'response': return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
      case 'info': return <Info className="h-3.5 w-3.5 text-amber-400" />;
      default: return <FileText className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'request': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'response': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'info': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getSourceBadgeClass = (source?: string) => {
    return source === 'rustdesk'
      ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
      : 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  };

  const getStatusBadgeClass = (status?: number) => {
    if (!status) return '';
    return status >= 200 && status < 300
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-sm text-white">Logs de Conexão</CardTitle>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-[10px]">
              {filteredLogs.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Source filter */}
            <div className="flex bg-slate-900 rounded-md p-0.5 gap-0.5">
              {(['all', 'guacamole', 'rustdesk'] as const).map(f => (
                <Button
                  key={f}
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-[10px] rounded-sm ${filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Todos' : f === 'guacamole' ? 'Guacamole' : 'RustDesk'}
                </Button>
              ))}
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm" className="h-6 px-2 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700">
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
            <Button onClick={onClearLogs} variant="outline" size="sm" className="h-6 px-2 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700">
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-400">Nenhum log disponível</p>
            <p className="text-xs text-slate-500">Execute alguma ação para ver os logs</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]" id="logs-scroll-area">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7 w-16">Hora</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7 w-20">Origem</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7 w-20">Tipo</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7 w-14">Método</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7 w-14">Status</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7">Mensagem</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-medium h-7 w-24">URL/Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-slate-700/50 hover:bg-slate-750/50">
                    <TableCell className="py-1 px-2">
                      <div className="text-[10px] text-slate-500 whitespace-nowrap">
                        <span className="text-slate-400">{formatTimestamp(log.timestamp)}</span>
                        <br />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getSourceBadgeClass(log.source)}`}>
                        {(log.source || 'guacamole') === 'rustdesk' ? '🦀 RustDesk' : '🟢 Guacamole'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(log.type)}
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getTypeBadgeClass(log.type)}`}>
                          {log.type.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      {log.method && (
                        <span className="text-[10px] font-mono text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded">
                          {log.method}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      {log.status && (
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <p className="text-xs text-slate-200 truncate max-w-[300px]" title={log.message}>
                        {log.message}
                      </p>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      {log.url && (
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]" title={log.url}>
                          {log.url}
                        </p>
                      )}
                      {log.details && !log.url && (
                        <p className="text-[10px] text-slate-500 truncate max-w-[180px]" title={JSON.stringify(log.details)}>
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
