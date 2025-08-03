import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Completely new component to avoid any caching issues
export default function AlertasMonitoring() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
          <p className="text-muted-foreground">Sistema em modo seguro - sem hooks React Query</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-300 mb-1">--</div>
            <div className="text-sm text-slate-300 font-medium">Total</div>
            <div className="text-xs text-slate-400 mt-1">Sistema inicializando</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">--</div>
            <div className="text-sm text-slate-300 font-medium">Online</div>
            <div className="text-xs text-slate-400 mt-1">Aguardando dados</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">--</div>
            <div className="text-sm text-slate-300 font-medium">Offline</div>
            <div className="text-xs text-slate-400 mt-1">Conectando...</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-muted-foreground mb-4">
              Sistema em modo seguro para resolver problemas de contexto React.
            </p>
            <p className="text-sm text-slate-400">
              Esta tela não utiliza React Query hooks que estavam causando erro de useContext.
              <br />
              Uma vez resolvido o problema de cache do Vite, a funcionalidade completa será restaurada.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}