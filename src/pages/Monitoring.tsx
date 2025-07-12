
import { Activity, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

const Monitoring = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  const grafanaUrl = "http://monitoramento.parkersolucoes.com.br:3000/d/fdutyfre02ewwa/bacula-parker?orgId=1&from=1752064321970&to=1752085921970";

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" />
              Monitoramento - Grafana
            </h1>
            <p className="text-gray-400">Painel de controle e métricas do sistema Bacula</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-gray-800"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              {isFullscreen ? 'Minimizar' : 'Tela Cheia'}
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dashboard Bacula Parker</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`bg-gray-800 rounded-lg border border-gray-600 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
              <iframe
                key={key}
                src={grafanaUrl}
                width="100%"
                height={isFullscreen ? "100%" : "800px"}
                frameBorder="0"
                className="rounded w-full"
                title="Grafana Dashboard - Bacula Parker"
                style={{ 
                  minHeight: isFullscreen ? '100vh' : '800px',
                  backgroundColor: '#1f2937'
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitoring;
