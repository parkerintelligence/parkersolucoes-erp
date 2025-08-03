import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, Settings, ExternalLink, RefreshCw, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSystemSetting, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
const UniFi = () => {
  const { user } = useAuth();
  const {
    toast
  } = useToast();
  const {
    data: unifiUrlSetting,
    isLoading: urlLoading
  } = useSystemSetting('unifi_website_url');
  const upsertSetting = useUpsertSystemSetting();

  // Extract the string value from the SystemSetting object
  const unifiUrl = unifiUrlSetting?.setting_value || '';
  const [showConfig, setShowConfig] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  
  // Generate proxy URL for the UniFi controller
  const getProxyUrl = () => {
    if (!unifiUrl || !user?.id) return '';
    const baseUrl = 'https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/unifi-website-proxy';
    return `${baseUrl}?path=/&user_id=${user.id}`;
  };
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  const handleSaveUrl = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive"
      });
      return;
    }
    if (!isValidUrl(urlInput)) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida (incluindo http:// ou https://).",
        variant: "destructive"
      });
      return;
    }
    try {
      await upsertSetting.mutateAsync({
        setting_key: 'unifi_website_url',
        setting_value: urlInput,
        setting_type: 'text',
        category: 'unifi',
        description: 'URL do site UniFi a ser carregado na página'
      });
      toast({
        title: "URL configurada",
        description: "URL do UniFi salva com sucesso."
      });
      setShowConfig(false);
      setIframeLoading(true);
      setIframeError(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar a URL.",
        variant: "destructive"
      });
    }
  };
  const handleOpenConfig = () => {
    setUrlInput(unifiUrl);
    setShowConfig(true);
  };
  const handleRefresh = () => {
    setIframeLoading(true);
    setIframeError(false);
    // Force iframe reload by changing its src
    const iframe = document.getElementById('unifi-iframe') as HTMLIFrameElement;
    if (iframe && unifiUrl) {
      iframe.src = getProxyUrl();
    }
  };
  const handleIframeLoad = () => {
    setIframeLoading(false);
  };
  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };
  if (urlLoading) {
    return <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando configurações...</div>
      </div>;
  }
  if (!unifiUrl) {
    return <div className="text-center space-y-6">
        <div className="flex items-center justify-center">
          <Wifi className="h-16 w-16 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">UniFi</h1>
          <p className="text-muted-foreground mt-2">Configure a URL do seu site UniFi para começar</p>
        </div>
        <Alert className="max-w-2xl mx-auto">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Site UniFi personalizado:</strong><br />
            Configure a URL do seu controlador UniFi ou qualquer site relacionado 
            que você gostaria de carregar nesta página.
          </AlertDescription>
        </Alert>
        <Button onClick={handleOpenConfig} size="lg">
          <Settings className="h-4 w-4 mr-2" />
          Configurar URL
        </Button>
      </div>;
  }
  return <>
      {/* Header */}
      <div className="border-b bg-background p-4 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-4 sm:mb-6 lg:mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">UniFi</h1>
              <p className="text-sm text-muted-foreground">{unifiUrl}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {iframeLoading && <Badge variant="secondary" className="animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Carregando...
              </Badge>}
            {iframeError && <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Erro de carregamento
              </Badge>}
            {!iframeLoading && !iframeError && <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Carregado
              </Badge>}
            
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            
            <Button onClick={() => window.open(unifiUrl, '_blank')} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
            
            <Button onClick={handleOpenConfig} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
      </div>

      {/* Iframe Content */}
      <div className="relative" style={{
      height: 'calc(100vh - 200px)'
    }}>
        {iframeError ? <div className="flex items-center justify-center h-full bg-muted/20">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Erro ao carregar
                </CardTitle>
                <CardDescription>
                  Não foi possível carregar o site. Verifique se a URL está correta e acessível.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground break-all">
                  URL: {unifiUrl}
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleRefresh} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                  <Button onClick={handleOpenConfig} variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Alterar URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div> : <iframe 
            id="unifi-iframe" 
            src={getProxyUrl()} 
            className="w-full h-full border-0" 
            onLoad={handleIframeLoad} 
            onError={handleIframeError} 
            allow="fullscreen; clipboard-read; clipboard-write" 
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" 
            title="UniFi Interface"
          />}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Configurar URL do UniFi
            </DialogTitle>
            <DialogDescription>
              Insira a URL completa do seu controlador UniFi ou site relacionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">URL do Site *</Label>
              <Input id="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://unifi.exemplo.com:8443" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Inclua o protocolo (http:// ou https://) e a porta se necessário
              </p>
            </div>
            
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>Exemplos de URLs válidas:</strong><br />
                • https://192.168.1.1:8443<br />
                • https://unifi.minhaempresa.com<br />
                • http://controlador.local:8080
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveUrl} disabled={upsertSetting.isPending || !urlInput.trim()}>
                {upsertSetting.isPending ? 'Salvando...' : 'Salvar URL'}
              </Button>
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};
export default UniFi;