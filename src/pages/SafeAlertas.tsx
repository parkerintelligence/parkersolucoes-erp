import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Safe version of Alertas that doesn't use any React Query hooks
export default function SafeAlertas() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alertas Zabbix</h1>
          <p className="text-muted-foreground">Sistema temporariamente em modo de segurança</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-300 mb-1">0</div>
            <div className="text-sm text-slate-300 font-medium">Total</div>
            <div className="text-xs text-slate-400 mt-1">Carregando configuração...</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">0</div>
            <div className="text-sm text-slate-300 font-medium">Online</div>
            <div className="text-xs text-slate-400 mt-1">Sistema inicializando</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">0</div>
            <div className="text-sm text-slate-300 font-medium">Offline</div>
            <div className="text-xs text-slate-400 mt-1">Aguardando conexão</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center p-8">
        <p className="text-muted-foreground">
          O sistema está sendo inicializado em modo seguro para evitar erros de contexto React.
          <br />
          Esta é uma solução temporária enquanto corrigimos os problemas de integração.
        </p>
      </div>
    </div>
  );
}