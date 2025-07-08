
import { Activity } from 'lucide-react';
import { useGrafanaAuth } from '@/hooks/useGrafanaAuth';
import { GrafanaConnectionStatus } from '@/components/GrafanaConnectionStatus';
import { GrafanaDashboardManager } from '@/components/GrafanaDashboardManager';

const Monitoring = () => {
  const { 
    isAuthenticating, 
    isAuthenticated, 
    authError, 
    grafanaIntegration, 
    retry 
  } = useGrafanaAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-400" />
            Monitoramento - Grafana
          </h1>
          <p className="text-gray-400">Painéis de controle e métricas do sistema</p>
        </div>

        <GrafanaConnectionStatus
          isAuthenticating={isAuthenticating}
          isAuthenticated={isAuthenticated}
          authError={authError}
          grafanaIntegration={grafanaIntegration}
          onRetry={retry}
        />

        {isAuthenticated && grafanaIntegration && (
          <GrafanaDashboardManager
            grafanaIntegration={grafanaIntegration}
            credentials={{
              username: grafanaIntegration.username || '',
              password: grafanaIntegration.password || ''
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Monitoring;
