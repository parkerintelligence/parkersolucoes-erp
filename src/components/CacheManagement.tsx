import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useClearAllCache } from '@/hooks/useClearAllCache';
import { Trash2, RefreshCw, Info, Database, HardDrive, Globe } from "lucide-react";

const CacheManagement = () => {
  const { clearAllCache, clearSelectiveCache, getCacheStatus, isClearing } = useClearAllCache();
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [selectiveOptions, setSelectiveOptions] = useState({
    serviceWorker: true,
    reactQuery: true,
    browserStorage: true,
  });

  useEffect(() => {
    loadCacheStatus();
  }, []);

  const loadCacheStatus = async () => {
    const status = await getCacheStatus();
    setCacheStatus(status);
  };

  const handleSelectiveChange = (key: keyof typeof selectiveOptions) => {
    setSelectiveOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectiveClear = () => {
    clearSelectiveCache(selectiveOptions);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Gerenciamento de Cache
        </CardTitle>
        <CardDescription className="text-slate-400">
          Limpe todos os dados em cache do sistema para resolver problemas ou liberar espaço
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status do Cache */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Status Atual do Cache</h3>
            <Button
              onClick={loadCacheStatus}
              size="sm"
              variant="outline"
              className="ml-auto h-6"
              disabled={isClearing}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          {cacheStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Service Worker</span>
                </div>
                <Badge variant={cacheStatus.serviceWorker === 'Ativo' ? 'default' : 'destructive'}>
                  {cacheStatus.serviceWorker}
                </Badge>
              </div>
              
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">React Query</span>
                </div>
                <Badge variant="outline" className="text-slate-300">
                  {cacheStatus.reactQuery} queries
                </Badge>
              </div>
              
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-white">Local Storage</span>
                </div>
                <Badge variant="outline" className="text-slate-300">
                  {cacheStatus.localStorage} itens
                </Badge>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-slate-700" />

        {/* Limpeza Completa */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-medium text-white">Limpeza Completa</h3>
          </div>
          
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
            <h4 className="text-sm font-medium text-red-300 mb-2">Atenção</h4>
            <p className="text-xs text-red-200 mb-3">
              Esta ação irá remover TODOS os dados em cache, incluindo configurações temporárias 
              e dados de sessão. A aplicação será recarregada automaticamente.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={isClearing}
                  className="w-full"
                >
                  {isClearing ? 'Limpando...' : 'Limpar Todo Cache'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Confirmar Limpeza Completa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja limpar todo o cache do sistema? Esta ação não pode ser desfeita 
                    e a aplicação será recarregada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearAllCache}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sim, Limpar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Limpeza Seletiva */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Limpeza Seletiva</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sw-cache" className="text-sm text-slate-300">
                Service Worker Cache
              </Label>
              <Switch
                id="sw-cache"
                checked={selectiveOptions.serviceWorker}
                onCheckedChange={() => handleSelectiveChange('serviceWorker')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="rq-cache" className="text-sm text-slate-300">
                React Query Cache
              </Label>
              <Switch
                id="rq-cache"
                checked={selectiveOptions.reactQuery}
                onCheckedChange={() => handleSelectiveChange('reactQuery')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="browser-storage" className="text-sm text-slate-300">
                Browser Storage (localStorage/sessionStorage)
              </Label>
              <Switch
                id="browser-storage"
                checked={selectiveOptions.browserStorage}
                onCheckedChange={() => handleSelectiveChange('browserStorage')}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSelectiveClear}
            disabled={isClearing || !Object.values(selectiveOptions).some(Boolean)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isClearing ? 'Limpando...' : 'Limpar Selecionados'}
          </Button>
        </div>

        {/* Informações */}
        <div className="p-3 bg-slate-900 rounded-lg">
          <h4 className="text-xs font-medium text-slate-400 mb-2">Tipos de Cache:</h4>
          <ul className="text-xs text-slate-500 space-y-1">
            <li><strong>Service Worker:</strong> Cache de recursos estáticos (JS, CSS, imagens)</li>
            <li><strong>React Query:</strong> Cache de dados de API e estado de aplicação</li>
            <li><strong>Browser Storage:</strong> Configurações locais e dados de sessão</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheManagement;