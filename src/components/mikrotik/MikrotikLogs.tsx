import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileText, AlertCircle, Info, AlertTriangle, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const MikrotikLogs = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  const { data: logs = [], refetch } = useQuery({
    queryKey: ["mikrotik-logs"],
    queryFn: async () => {
      const data = await callAPI("/log");
      return data || [];
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const getTopicIcon = (topics: string) => {
    if (!topics) return <FileText className="h-4 w-4 text-muted-foreground" />;
    
    if (topics.includes("error") || topics.includes("critical")) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (topics.includes("warning")) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const getTopicBadge = (topics: string) => {
    if (!topics) return <Badge className="bg-slate-600 text-white">Sistema</Badge>;
    
    if (topics.includes("error") || topics.includes("critical")) {
      return <Badge className="bg-red-600 text-white">Erro</Badge>;
    }
    if (topics.includes("warning")) {
      return <Badge className="bg-yellow-600 text-white">Aviso</Badge>;
    }
    if (topics.includes("info")) {
      return <Badge className="bg-blue-600 text-white">Info</Badge>;
    }
    return <Badge className="bg-slate-600 text-white">{topics}</Badge>;
  };

  const filteredLogs = logs.filter((log: any) => {
    if (searchTerm && !log.message?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedTopic !== "all") {
      if (selectedTopic === "error" && !log.topics?.includes("error") && !log.topics?.includes("critical")) {
        return false;
      }
      if (selectedTopic === "warning" && !log.topics?.includes("warning")) {
        return false;
      }
      if (selectedTopic === "info" && !log.topics?.includes("info")) {
        return false;
      }
      if (selectedTopic === "system" && log.topics) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs do Sistema</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize os logs do MikroTik em tempo real
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? "Auto-Refresh: ON" : "Auto-Refresh: OFF"}
            </Button>
            <Button onClick={() => refetch()} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nas mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
                <SelectItem value="info">Informações</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || selectedTopic !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTopic("all");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Mostrando {filteredLogs.length} de {logs.length} logs
          </div>
        </div>
        
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Tipo</TableHead>
                <TableHead className="w-[150px]">Data/Hora</TableHead>
                <TableHead className="w-[120px]">Tópico</TableHead>
                <TableHead>Mensagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: any) => (
                <TableRow key={log[".id"]}>
                  <TableCell>
                    {getTopicIcon(log.topics)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.time || "N/A"}
                  </TableCell>
                  <TableCell>
                    {getTopicBadge(log.topics)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.message || "Sem mensagem"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && logs.length > 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado com os filtros aplicados</p>
            </div>
          )}

          {logs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log disponível</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
