
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GrafanaDashboard {
  id: number;
  uid: string;
  title: string;
  tags: string[];
  type: string;
  uri: string;
  url: string;
  slug: string;
}

interface GrafanaDashboardManagerProps {
  grafanaIntegration: any;
  credentials: { username: string; password: string };
}

export const GrafanaDashboardManager = ({ grafanaIntegration, credentials }: GrafanaDashboardManagerProps) => {
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const [dashboards, setDashboards] = useState<GrafanaDashboard[]>([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);

  const fetchDashboards = async () => {
    setLoadingDashboards(true);
    try {
      const proxyUrl = `https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/grafana-proxy`;
      const grafanaUrl = `${grafanaIntegration.base_url}/api/search?type=dash-db`;
      
      console.log('Buscando dashboards...', { grafanaUrl });
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: grafanaUrl,
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', response.status, errorData);
        throw new Error(errorData.message || 'Erro ao buscar dashboards');
      }

      const data = await response.json();
      console.log('Dashboards encontrados:', data);
      
      if (Array.isArray(data)) {
        setDashboards(data);
        toast({
          title: "Dashboards carregados",
          description: `${data.length} painéis encontrados.`,
        });
      } else {
        console.error('Resposta inesperada:', data);
        throw new Error('Formato de resposta inválido');
      }
    } catch (error) {
      console.error('Erro ao buscar dashboards:', error);
      toast({
        title: "Erro ao carregar dashboards",
        description: error instanceof Error ? error.message : "Erro ao conectar com o Grafana.",
        variant: "destructive"
      });
    } finally {
      setLoadingDashboards(false);
    }
  };

  useEffect(() => {
    if (grafanaIntegration && credentials.username && credentials.password) {
      fetchDashboards();
    }
  }, [grafanaIntegration?.id, credentials.username, credentials.password]);

  const selectedDashboardData = dashboards.find(d => d.uid === selectedDashboard);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Painéis de Controle</CardTitle>
        <CardDescription className="text-gray-400">
          Selecione um painel para visualizar ({dashboards.length} disponíveis)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="dashboard-select" className="text-gray-200">Painel de Controle</Label>
              <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um painel..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.uid} value={dashboard.uid} className="text-white hover:bg-gray-600">
                      {dashboard.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchDashboards}
              disabled={loadingDashboards}
              className="border-gray-600 text-gray-200 hover:bg-gray-800"
            >
              {loadingDashboards ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          {selectedDashboardData && (
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="text-white font-semibold mb-2">{selectedDashboardData.title}</h3>
              {selectedDashboardData.tags.length > 0 && (
                <p className="text-gray-300 text-sm mb-4">
                  Tags: {selectedDashboardData.tags.join(', ')}
                </p>
              )}
              
              <div className="bg-gray-800 rounded-lg p-1 min-h-[600px] border border-gray-600">
                <iframe
                  src={`${grafanaIntegration.base_url}/d/${selectedDashboardData.uid}?orgId=1&refresh=10s&from=now-1h&to=now&kiosk=1&theme=dark`}
                  width="100%"
                  height="700"
                  frameBorder="0"
                  className="rounded w-full"
                  title={selectedDashboardData.title}
                  style={{ minHeight: '700px' }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
