import React from 'react';
import { BarChart3, PieChart, TrendingUp, Smartphone, Monitor, HardDrive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface UniFiAnalyticsDashboardProps {
  insights: any[];
  dpiStats: any[];
  loading?: boolean;
}

export const UniFiAnalyticsDashboard: React.FC<UniFiAnalyticsDashboardProps> = ({
  insights = [],
  dpiStats = [],
  loading = false
}) => {
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getAppIcon = (app: string) => {
    const appLower = app.toLowerCase();
    if (appLower.includes('video') || appLower.includes('youtube') || appLower.includes('netflix')) {
      return <Monitor className="h-4 w-4 text-red-500" />;
    }
    if (appLower.includes('social') || appLower.includes('facebook') || appLower.includes('instagram')) {
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    }
    if (appLower.includes('file') || appLower.includes('download') || appLower.includes('cloud')) {
      return <HardDrive className="h-4 w-4 text-green-500" />;
    }
    return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'streaming': 'bg-red-500',
      'social': 'bg-blue-500',
      'productivity': 'bg-green-500',
      'gaming': 'bg-purple-500',
      'communication': 'bg-yellow-500',
      'file-sharing': 'bg-orange-500',
      'web': 'bg-gray-500',
      'other': 'bg-gray-400'
    };
    return colors[category.toLowerCase()] || colors['other'];
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalBytes = dpiStats.reduce((sum, app) => sum + (app.tx_bytes || 0) + (app.rx_bytes || 0), 0);
  const totalClients = dpiStats.reduce((sum, app) => sum + (app.known_clients || 0), 0);
  const topApps = dpiStats
    .map(app => ({
      ...app,
      totalBytes: (app.tx_bytes || 0) + (app.rx_bytes || 0)
    }))
    .sort((a, b) => b.totalBytes - a.totalBytes)
    .slice(0, 10);

  // Group by category
  const categoryStats = dpiStats.reduce((acc: any, app) => {
    const category = app.cat || 'other';
    if (!acc[category]) {
      acc[category] = {
        name: category,
        totalBytes: 0,
        apps: 0,
        clients: 0
      };
    }
    acc[category].totalBytes += (app.tx_bytes || 0) + (app.rx_bytes || 0);
    acc[category].apps += 1;
    acc[category].clients += app.known_clients || 0;
    return acc;
  }, {});

  const topCategories = Object.values(categoryStats)
    .sort((a: any, b: any) => b.totalBytes - a.totalBytes)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tráfego Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalBytes)}</div>
            <p className="text-xs text-muted-foreground">Transferido recentemente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicações Ativas</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dpiStats.length}</div>
            <p className="text-xs text-muted-foreground">Detectadas na rede</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Smartphone className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Usando aplicações</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Aplicações por Tráfego
            </CardTitle>
            <CardDescription>Aplicações com maior consumo de dados</CardDescription>
          </CardHeader>
          <CardContent>
            {topApps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhum dado DPI disponível</p>
                <p className="text-sm">Ative o DPI no controlador UniFi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topApps.map((app, index) => {
                  const percentage = totalBytes > 0 ? (app.totalBytes / totalBytes) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getAppIcon(app.app)}
                          <span className="font-medium">{app.app}</span>
                          <Badge variant="outline" className="text-xs">
                            {app.cat}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatBytes(app.totalBytes)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {app.known_clients} clientes
                          </div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Categorias de Aplicações
            </CardTitle>
            <CardDescription>Distribuição do tráfego por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma categoria detectada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCategories.map((category: any, index) => {
                  const percentage = totalBytes > 0 ? (category.totalBytes / totalBytes) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(category.name)}`} />
                          <span className="font-medium capitalize">
                            {category.name.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatBytes(category.totalBytes)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {category.apps} apps, {category.clients} clientes
                          </div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Applications Table */}
      {dpiStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Detalhada de Aplicações</CardTitle>
            <CardDescription>Estatísticas completas de Deep Packet Inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aplicação</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Upload</TableHead>
                  <TableHead>Download</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Pacotes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topApps.map((app, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAppIcon(app.app)}
                        <span className="font-medium">{app.app}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.cat}</Badge>
                    </TableCell>
                    <TableCell>{formatBytes(app.tx_bytes || 0)}</TableCell>
                    <TableCell>{formatBytes(app.rx_bytes || 0)}</TableCell>
                    <TableCell className="font-medium">
                      {formatBytes(app.totalBytes)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {app.known_clients || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>↑ {(app.tx_packets || 0).toLocaleString()}</div>
                        <div>↓ {(app.rx_packets || 0).toLocaleString()}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights da Rede
            </CardTitle>
            <CardDescription>Análises e recomendações automáticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 10).map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={insight.severity === 'high' ? 'destructive' : 
                                      insight.severity === 'medium' ? 'secondary' : 'outline'}>
                          {insight.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(insight.datetime).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm">{insight.msg}</p>
                      {insight.app && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Aplicação: {insight.app}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};