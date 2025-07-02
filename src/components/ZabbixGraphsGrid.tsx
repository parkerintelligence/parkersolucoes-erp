import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Eye, Download } from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';

export const ZabbixGraphsGrid = () => {
  const { graphs, isLoading } = useZabbixIntegration();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando gráficos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Gráficos de Performance ({graphs.length})
          </h2>
          <p className="text-muted-foreground">Visualização gráfica das métricas coletadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {graphs.map((graph: any) => (
          <Card key={graph.graphid} className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{graph.name}</span>
                <Badge variant="outline" className="ml-2">
                  {graph.width}x{graph.height}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Items: {graph.gitems?.length || 0}</span>
                <span>ID: {graph.graphid}</span>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {graphs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum gráfico encontrado</h3>
            <p className="text-muted-foreground">
              Configure gráficos no Zabbix para visualizar métricas de performance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};