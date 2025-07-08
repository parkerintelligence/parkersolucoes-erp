
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Lightbulb, 
  MapPin, 
  Zap,
  Wifi,
  Upload,
  Gauge,
  Radio,
  Shield,
  Network
} from 'lucide-react';
import { UniFiDevice } from '@/hooks/useUniFiAPI';

interface UniFiAdvancedDeviceManagerProps {
  device: UniFiDevice;
  onUpdateDevice: (deviceId: string, settings: any) => void;
  onLocateDevice: (deviceId: string) => void;
  onUpgradeDevice: (deviceId: string) => void;
  onSetLED: (deviceId: string, enabled: boolean) => void;
}

export const UniFiAdvancedDeviceManager: React.FC<UniFiAdvancedDeviceManagerProps> = ({
  device,
  onUpdateDevice,
  onLocateDevice,
  onUpgradeDevice,
  onSetLED
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  
  const [deviceSettings, setDeviceSettings] = useState({
    led_override: device.led_override || 'default',
    power_override: device.power_override || 'default',
    channel_2g: device.radio_table?.[0]?.channel?.toString() || 'auto',
    channel_5g: device.radio_table?.[1]?.channel?.toString() || 'auto',
    tx_power_2g: device.radio_table?.[0]?.tx_power?.toString() || 'auto',
    tx_power_5g: device.radio_table?.[1]?.tx_power?.toString() || 'auto',
    name: device.name || '',
    alias: device.alias || ''
  });

  const handleLocate = async () => {
    setLocating(true);
    await onLocateDevice(device.mac);
    setTimeout(() => setLocating(false), 5000); // Stop locating after 5 seconds
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    await onUpgradeDevice(device.mac);
    setUpgrading(false);
  };

  const handleSaveSettings = () => {
    onUpdateDevice(device.mac, deviceSettings);
    setSettingsOpen(false);
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'uap':
        return <Wifi className="h-5 w-5 text-green-400" />;
      case 'usw':
        return <Network className="h-5 w-5 text-blue-400" />;
      case 'ugw':
      case 'udm':
      case 'uxg':
        return <Shield className="h-5 w-5 text-purple-400" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getChannelOptions = (band: string) => {
    if (band === '2g') {
      return ['auto', '1', '6', '11'];
    } else {
      return ['auto', '36', '40', '44', '48', '149', '153', '157', '161'];
    }
  };

  const getPowerOptions = () => {
    return ['auto', 'high', 'medium', 'low', 'custom'];
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {getDeviceTypeIcon(device.type)}
          Configurações Avançadas - {device.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Modelo</Label>
              <p className="text-white">{device.model}</p>
            </div>
            <div>
              <Label className="text-gray-400">Versão</Label>
              <p className="text-white">{device.version}</p>
            </div>
            <div>
              <Label className="text-gray-400">IP</Label>
              <p className="text-white font-mono">{device.ip}</p>
            </div>
            <div>
              <Label className="text-gray-400">MAC</Label>
              <p className="text-white font-mono text-sm">{device.mac}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleLocate}
              disabled={locating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MapPin className={`h-4 w-4 mr-2 ${locating ? 'animate-pulse' : ''}`} />
              {locating ? 'Localizando...' : 'Localizar'}
            </Button>
            
            <Button
              size="sm"
              onClick={() => onSetLED(device.mac, !device.led_override)}
              variant="outline"
              className="border-gray-600 text-gray-200"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {device.led_override ? 'Desligar LED' : 'Ligar LED'}
            </Button>
            
            <Button
              size="sm"
              onClick={handleUpgrade}
              disabled={upgrading}
              variant="outline"
              className="border-gray-600 text-gray-200"
            >
              <Upload className={`h-4 w-4 mr-2 ${upgrading ? 'animate-spin' : ''}`} />
              {upgrading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          {/* Performance Stats */}
          {device['sys-stats'] && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Gauge className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">CPU</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {device['sys-stats'].cpu || 0}%
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Memória</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {device['sys-stats'].mem || 0}%
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Radio className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-400">Temp</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {device['sys-stats']['system-temp'] || 0}°C
                </p>
              </div>
            </div>
          )}

          {/* Radio Information for Access Points */}
          {device.type === 'uap' && device.radio_table && (
            <div className="space-y-3">
              <Label className="text-gray-400">Informações dos Rádios</Label>
              {device.radio_table.map((radio, index) => (
                <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">
                      {radio.name} ({radio.radio === 'ng' ? '2.4GHz' : '5GHz'})
                    </Badge>
                    <span className="text-sm text-gray-400">
                      Canal: {radio.channel || 'Auto'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Potência: </span>
                      <span className="text-white">{radio.tx_power || 'Auto'} dBm</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Utilização: </span>
                      <span className="text-white">{radio.util || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Advanced Settings Dialog */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gray-700 hover:bg-gray-600">
                <Settings className="h-4 w-4 mr-2" />
                Configurações Avançadas
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurações Avançadas - {device.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Device Name */}
                <div>
                  <Label htmlFor="device-name">Nome do Dispositivo</Label>
                  <Input
                    id="device-name"
                    value={deviceSettings.name}
                    onChange={(e) => setDeviceSettings({...deviceSettings, name: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* LED Override */}
                <div>
                  <Label htmlFor="led-override">Controle de LED</Label>
                  <Select 
                    value={deviceSettings.led_override} 
                    onValueChange={(value) => setDeviceSettings({...deviceSettings, led_override: value})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="on">Sempre Ligado</SelectItem>
                      <SelectItem value="off">Sempre Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Radio Settings for Access Points */}
                {device.type === 'uap' && (
                  <>
                    <div className="space-y-4">
                      <Label className="text-lg">Configurações de Rádio 2.4GHz</Label>
                      
                      <div>
                        <Label htmlFor="channel-2g">Canal</Label>
                        <Select 
                          value={deviceSettings.channel_2g} 
                          onValueChange={(value) => setDeviceSettings({...deviceSettings, channel_2g: value})}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {getChannelOptions('2g').map(channel => (
                              <SelectItem key={channel} value={channel}>
                                {channel === 'auto' ? 'Automático' : `Canal ${channel}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="power-2g">Potência de Transmissão</Label>
                        <Select 
                          value={deviceSettings.tx_power_2g} 
                          onValueChange={(value) => setDeviceSettings({...deviceSettings, tx_power_2g: value})}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="auto">Automático</SelectItem>
                            <SelectItem value="high">Alto</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="low">Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg">Configurações de Rádio 5GHz</Label>
                      
                      <div>
                        <Label htmlFor="channel-5g">Canal</Label>
                        <Select 
                          value={deviceSettings.channel_5g} 
                          onValueChange={(value) => setDeviceSettings({...deviceSettings, channel_5g: value})}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {getChannelOptions('5g').map(channel => (
                              <SelectItem key={channel} value={channel}>
                                {channel === 'auto' ? 'Automático' : `Canal ${channel}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="power-5g">Potência de Transmissão</Label>
                        <Select 
                          value={deviceSettings.tx_power_5g} 
                          onValueChange={(value) => setDeviceSettings({...deviceSettings, tx_power_5g: value})}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="auto">Automático</SelectItem>
                            <SelectItem value="high">Alto</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="low">Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
