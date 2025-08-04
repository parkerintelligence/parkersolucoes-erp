import React from 'react';
import { useWazuhAPI } from '@/hooks/useWazuhAPI';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Settings
} from 'lucide-react';

export function WazuhDiagnosticPanel() {
  const { data: integrations } = useIntegrations();
  const { testWazuhConnection } = useWazuhAPI();
  
  const wazuhIntegration = integrations?.find(
    integration => integration.type === 'wazuh' && integration.is_active
  );

  const handleTestConnection = async () => {
    if (!wazuhIntegration) {
      toast({
        title: "No Integration",
        description: "No active Wazuh integration found",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await testWazuhConnection.mutateAsync({
        endpoint: '/test-connectivity',
        method: 'GET',
        integrationId: wazuhIntegration.id
      });
      
      toast({
        title: "Connection Test Successful",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!wazuhIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Wazuh Diagnostic
          </CardTitle>
          <CardDescription>
            Test and diagnose Wazuh integration connectivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No active Wazuh integration found. Please configure a Wazuh integration first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Access integration properties - handle both config object and direct properties
  const config = (() => {
    const integration = wazuhIntegration as any;
    
    if (integration.config && integration.config.baseUrl) {
      // New structure with config object
      return {
        base_url: integration.config.baseUrl,
        username: integration.config.username
      };
    } else {
      // Old structure with direct columns
      return {
        base_url: integration.base_url,
        username: integration.username
      };
    }
  })();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="h-5 w-5" />
          Wazuh Diagnostic Panel
        </CardTitle>
        <CardDescription className="text-slate-400">
          Test connectivity and diagnose issues with your Wazuh integration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Integration Info */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Integration Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Name:</span>
              <div className="font-medium text-white">{wazuhIntegration.name}</div>
            </div>
            <div>
              <span className="text-slate-400">Status:</span>
              <div>
                <Badge variant={wazuhIntegration.is_active ? "default" : "secondary"}>
                  {wazuhIntegration.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Base URL:</span>
              <div className="font-mono text-xs break-all text-white">{config.base_url}</div>
            </div>
            <div>
              <span className="text-slate-400">Username:</span>
              <div className="font-medium text-white">{config.username}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Connection Test */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Connection Test</h4>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleTestConnection}
              disabled={testWazuhConnection.isPending}
              className="flex items-center gap-2"
            >
              {testWazuhConnection.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Test Connection
            </Button>
            
            {testWazuhConnection.data && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            )}
            
            {testWazuhConnection.error && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Failed
              </Badge>
            )}
          </div>

          {/* Test Results */}
          {testWazuhConnection.data && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Connection Successful</span>
              </div>
              
              {testWazuhConnection.data.connectivity && (
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Protocol:</span> 
                    <span className="ml-2 font-medium uppercase">
                      {testWazuhConnection.data.connectivity.connectivity.method}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cleaned URL:</span>
                    <div className="font-mono text-xs break-all">
                      {testWazuhConnection.data.connectivity.config?.cleaned_url}
                    </div>
                  </div>
                </div>
              )}
              
              {testWazuhConnection.data.data && (
                <div className="text-sm">
                  <span className="text-muted-foreground">API Response:</span>
                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(testWazuhConnection.data.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {testWazuhConnection.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Connection Failed</div>
                  <div className="text-sm">{testWazuhConnection.error.message}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Troubleshooting Tips */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Troubleshooting Tips</h4>
          <div className="text-sm text-slate-400 space-y-2">
            <div>• Ensure Wazuh server is running and accessible</div>
            <div>• Check firewall allows connections on port 55000</div>
            <div>• Verify username and password are correct</div>
            <div>• Try both HTTP and HTTPS protocols</div>
            <div>• Check network connectivity to the server</div>
            <div>• Ensure the URL format is correct (e.g., https://your-server.com)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}