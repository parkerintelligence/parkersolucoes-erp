import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileText, AlertCircle, Info, AlertTriangle, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MikrotikExportActions } from './MikrotikExportActions';
import { generateLogsSummary } from '@/utils/mikrotikExportFormatters';

export const MikrotikLogs = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  const { data: logs = [], refetch } = useQuery({
    queryKey: ["mikrotik-logs"],
    queryFn: async () => { const data = await callAPI("/log"); return data || []; },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const getTopicIcon = (topics: string) => {
    if (!topics) return <FileText className="h-3 w-3 text-muted-foreground" />;
    if (topics.includes("error") || topics.includes("critical")) return <AlertCircle className="h-3 w-3 text-destructive" />;
    if (topics.includes("warning")) return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    return <Info className="h-3 w-3 text-primary" />;
  };

  const getTopicBadge = (topics: string) => {
    if (!topics) return { label: 'Sistema', cls: 'border-border text-muted-foreground' };
    if (topics.includes("error") || topics.includes("critical")) return { label: 'Erro', cls: 'border-destructive/30 text-destructive bg-destructive/10' };
    if (topics.includes("warning")) return { label: 'Aviso', cls: 'border-amber-500/30 text-amber-400 bg-amber-500/10' };
    if (topics.includes("info")) return { label: 'Info', cls: 'border-primary/30 text-primary bg-primary/10' };
    return { label: topics, cls: 'border-border text-muted-foreground' };
  };

  const filteredLogs = logs.filter((log: any) => {
    if (searchTerm && !log.message?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedTopic !== "all") {
      if (selectedTopic === "error" && !log.topics?.includes("error") && !log.topics?.includes("critical")) return false;
      if (selectedTopic === "warning" && !log.topics?.includes("warning")) return false;
      if (selectedTopic === "info" && !log.topics?.includes("info")) return false;
      if (selectedTopic === "system" && log.topics) return false;
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Logs do Sistema</h3>
          <p className="text-[10px] text-muted-foreground">{filteredLogs.length} de {logs.length} logs</p>
        </div>
        <div className="flex gap-1.5">
          <MikrotikExportActions data={logs.slice(0, 1000)} filteredData={filteredLogs.slice(0, 1000)}
            columns={[
              { key: 'time', label: 'Hora' }, { key: 'topics', label: 'Tópico' }, { key: 'message', label: 'Mensagem' },
            ]}
            gridTitle="Logs do Sistema" getSummary={() => generateLogsSummary(filteredLogs.slice(0, 1000))}
          />
          <Button onClick={() => setAutoRefresh(!autoRefresh)} size="sm"
            variant={autoRefresh ? "default" : "outline"} className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? "Auto: ON" : "Auto: OFF"}
          </Button>
          <Button onClick={() => refetch()} disabled={loading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar nas mensagens..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-card border-border h-8 text-xs" />
        </div>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-32 h-8 bg-card border-border text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="error">Erros</SelectItem>
            <SelectItem value="warning">Avisos</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || selectedTopic !== "all") && (
          <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setSelectedTopic("all"); }} className="h-8 text-xs">
            <X className="h-3.5 w-3.5 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="h-[600px] w-full">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs h-8 px-3 w-10">Tipo</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3 w-[130px]">Data/Hora</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3 w-[100px]">Tópico</TableHead>
                <TableHead className="text-muted-foreground text-xs h-8 px-3">Mensagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: any) => {
                const badge = getTopicBadge(log.topics);
                return (
                  <TableRow key={log[".id"]} className="border-border hover:bg-muted/30">
                    <TableCell className="py-1 px-3">{getTopicIcon(log.topics)}</TableCell>
                    <TableCell className="py-1 px-3 text-[10px] text-muted-foreground">{log.time || "N/A"}</TableCell>
                    <TableCell className="py-1 px-3">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${badge.cls}`}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="py-1 px-3 font-mono text-[10px] text-foreground">{log.message || "Sem mensagem"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">{logs.length > 0 ? 'Nenhum log encontrado com os filtros aplicados' : 'Nenhum log disponível'}</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
