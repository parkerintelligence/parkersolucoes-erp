import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Wifi, Zap, Link, Lock, Calendar, Router, Database, Headphones, Bell, Info } from 'lucide-react';
import { WHATSAPP_SCREENS, useWhatsAppScreenConfig, ScreenInstanceMapping } from '@/hooks/useWhatsAppScreenConfig';

interface InstanceInfo {
  instanceName: string;
  status?: string;
}

interface WhatsAppScreenConfigProps {
  instances: InstanceInfo[];
}

const iconMap: Record<string, React.ComponentType<any>> = {
  zap: Zap,
  link: Link,
  lock: Lock,
  calendar: Calendar,
  router: Router,
  database: Database,
  headphones: Headphones,
  bell: Bell,
};

export const WhatsAppScreenConfig = ({ instances }: WhatsAppScreenConfigProps) => {
  const { config, isLoading, saveConfig, isSaving } = useWhatsAppScreenConfig();
  const [localConfig, setLocalConfig] = useState<ScreenInstanceMapping>({});

  useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const connectedInstances = instances.filter(i => i.status === 'open');
  const allConfigured = WHATSAPP_SCREENS.every(s => localConfig[s.key]);
  const configuredCount = WHATSAPP_SCREENS.filter(s => localConfig[s.key]).length;

  const handleSave = async () => {
    await saveConfig(localConfig);
  };

  const handleSelectInstance = (screenKey: string, instanceName: string) => {
    setLocalConfig(prev => ({ ...prev, [screenKey]: instanceName }));
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1 px-3 py-1.5">
            <span className="text-xs">📄</span> {instances.length} instância{instances.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1.5 text-green-600 border-green-300">
            <Wifi className="h-3 w-3" /> {connectedInstances.length} conectada{connectedInstances.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className={`gap-1 px-3 py-1.5 ${allConfigured ? 'text-green-600 border-green-300' : 'text-muted-foreground'}`}>
            ✅ {configuredCount}/{WHATSAPP_SCREENS.length} telas configuradas
          </Badge>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </div>

      {/* Screen list */}
      <div className="space-y-2">
        {WHATSAPP_SCREENS.map((screen) => {
          const Icon = iconMap[screen.icon] || Zap;
          const selectedInstance = localConfig[screen.key];
          const instanceStatus = instances.find(i => i.instanceName === selectedInstance)?.status;

          return (
            <Card key={screen.key} className={`transition-colors ${selectedInstance ? 'border-green-300 dark:border-green-700' : ''}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${screen.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{screen.label}</p>
                      {'badge' in screen && screen.badge && (
                        <Badge variant="secondary" className="text-xs">{screen.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{screen.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={selectedInstance || ''}
                    onValueChange={(value) => handleSelectInstance(screen.key, value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((inst) => (
                        <SelectItem key={inst.instanceName} value={inst.instanceName}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${inst.status === 'open' ? 'bg-green-500' : 'bg-red-400'}`} />
                            {inst.instanceName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedInstance && instanceStatus === 'open' ? (
                    <Badge className="bg-green-600 text-white gap-1 whitespace-nowrap">
                      <Wifi className="h-3 w-3" /> Conectada
                    </Badge>
                  ) : selectedInstance ? (
                    <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                      Desconectada
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info box */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Como funciona</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                <li>Cada tela de envio usará automaticamente a instância configurada aqui.</li>
                <li>A entrada <strong>Webhook</strong> define qual instância será usada para disparos via Webhooks.</li>
                <li>Se nenhuma instância estiver configurada, o sistema usa a instância ativa padrão.</li>
                <li>Instâncias desconectadas não enviarão mensagens — conecte-as na aba Instâncias.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
