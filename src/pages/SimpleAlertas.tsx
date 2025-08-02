import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Server, AlertTriangle } from 'lucide-react';

export default function SimpleAlertas() {
  console.log('SimpleAlertas: Rendering without hooks...');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
          <p className="text-muted-foreground">Monitor em tempo real do status dos dispositivos</p>
        </div>
        <Button 
          disabled
          size="sm"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-300 mb-1">0</div>
            <div className="text-sm text-slate-300 font-medium">Total</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">0</div>
            <div className="text-sm text-slate-300 font-medium">Online</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos ativos</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">0</div>
            <div className="text-sm text-slate-300 font-medium">Offline</div>
            <div className="text-xs text-slate-400 mt-1">Dispositivos inativos</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Message */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Sistema Inicializando
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">
            O sistema de monitoramento está sendo inicializado. 
            Por favor, aguarde enquanto estabelecemos conexão com os serviços.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">React iniciado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">Carregando providers...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-slate-600 rounded-full"></div>
              <span className="text-sm text-slate-400">Conectando ao Zabbix...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}