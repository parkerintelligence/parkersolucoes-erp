import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileText, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const MikrotikLogs = () => {
  const { callAPI, loading } = useMikrotikAPI();
  const [autoRefresh, setAutoRefresh] = useState(false);

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
    if (!topics) return <Badge variant="outline">Sistema</Badge>;
    
    if (topics.includes("error") || topics.includes("critical")) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (topics.includes("warning")) {
      return <Badge className="bg-yellow-500 text-white">Aviso</Badge>;
    }
    if (topics.includes("info")) {
      return <Badge variant="default">Info</Badge>;
    }
    return <Badge variant="outline">{topics}</Badge>;
  };

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
              {logs.map((log: any) => (
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
