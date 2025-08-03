import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  ExternalLink, 
  Settings, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useSystemSetting, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import UniFiMonitoringDashboard from '@/components/UniFiMonitoringDashboard';

const UniFi = () => {
  const { user } = useAuth();
  const { data: unifiUrl, isLoading: urlLoading } = useSystemSetting('unifi_website_url');
  const upsertSetting = useUpsertSystemSetting();
  const { toast } = useToast();
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [isSaving, setSaving] = useState(false);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveUrl = async () => {
    if (!tempUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(tempUrl)) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida (incluindo http:// ou https://).",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await upsertSetting.mutateAsync({
        setting_key: 'unifi_website_url',
        setting_value: tempUrl,
        setting_type: 'text',
        category: 'unifi',
        description: 'URL da controladora UniFi para acesso direto'
      });

      toast({
        title: "URL configurada",
        description: "URL da controladora salva com sucesso.",
      });
      setIsConfigOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar a URL.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenNewTab = () => {
    if (unifiUrl?.setting_value) {
      window.open(unifiUrl.setting_value, '_blank');
    }
  };

  const handleOpenConfig = () => {
    setTempUrl(unifiUrl?.setting_value || '');
    setIsConfigOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">UniFi</h1>
            <p className="text-slate-400">Gerenciamento e monitoramento da rede UniFi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {unifiUrl?.setting_value && (
            <Button 
              onClick={handleOpenNewTab}
              variant="outline" 
              size="sm"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Controladora Web
            </Button>
          )}
          
          <Button 
            onClick={handleOpenConfig}
            variant="outline" 
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <Settings className="h-4 w-4" />
            Configurar URL
          </Button>
        </div>
      </div>

      {urlLoading ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="text-white">Carregando configuração...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Dashboard Principal */}
          <UniFiMonitoringDashboard />

          {/* Card de configuração da URL (se não configurada) */}
          {!unifiUrl?.setting_value && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <Wifi className="h-6 w-6 text-blue-400" />
                  Configurar URL da Controladora (Opcional)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure a URL da controladora para acesso rápido via botão no cabeçalho.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleOpenConfig}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar URL
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog de configuração */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Configurar URL da Controladora UniFi</DialogTitle>
            <DialogDescription className="text-slate-400">
              Insira a URL da sua controladora UniFi para acesso rápido via botão no cabeçalho.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="unifi-url" className="text-white">URL da Controladora</Label>
              <Input
                id="unifi-url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://192.168.1.1:8443 ou https://unifi.empresa.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <Alert className="border-blue-500 bg-blue-500/10">
              <Wifi className="h-4 w-4" />
              <AlertDescription className="text-white">
                <strong>Esta URL é apenas para acesso direto.</strong><br />
                Para integração API, configure as integrações na página de Administração → Integrações → UniFi.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfigOpen(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUrl}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UniFi;