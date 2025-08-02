import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, HardDrive, MapPin } from 'lucide-react';

export interface UniFiHost {
  id: string;
  name: string;
  displayName?: string;
  type?: string;
  role?: string;
  status?: string;
  version?: string;
  isOnline?: boolean;
  location?: string;
}

interface UniFiHostSelectorProps {
  hosts: UniFiHost[];
  selectedHostId?: string;
  onHostChange: (hostId: string) => void;
  loading?: boolean;
}

export const UniFiHostSelector: React.FC<UniFiHostSelectorProps> = ({
  hosts,
  selectedHostId,
  onHostChange,
  loading = false
}) => {
  const selectedHost = hosts.find(host => host.id === selectedHostId);

  return (
    <Card className="bg-blue-900/30 border-blue-500 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-blue-400" />
          Seleção de Controladora UniFi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Select
            value={selectedHostId || ''}
            onValueChange={onHostChange}
            disabled={loading || hosts.length === 0}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Selecione uma controladora UniFi" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {hosts.map((host) => (
                <SelectItem 
                  key={host.id} 
                  value={host.id}
                  className="text-white hover:bg-gray-600"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-400" />
                      <span>{host.displayName || host.name}</span>
                    </div>
                    {host.status && (
                      <Badge 
                        variant={host.status === 'online' || host.isOnline ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {host.status || (host.isOnline ? 'online' : 'offline')}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedHost && (
            <div className="mt-3 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-medium text-white">
                      {selectedHost.displayName || selectedHost.name}
                    </h4>
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p><strong>Host ID:</strong> {selectedHost.id}</p>
                    {selectedHost.type && <p><strong>Tipo:</strong> {selectedHost.type}</p>}
                    {selectedHost.version && <p><strong>Versão:</strong> {selectedHost.version}</p>}
                    {selectedHost.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span><strong>Localização:</strong> {selectedHost.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {selectedHost.status && (
                  <Badge 
                    variant={selectedHost.status === 'online' || selectedHost.isOnline ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {selectedHost.status || (selectedHost.isOnline ? 'online' : 'offline')}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {hosts.length === 0 && !loading && (
            <div className="text-center py-6 text-gray-300">
              <Server className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">Nenhuma controladora encontrada</p>
              <p className="text-xs mb-2">
                Possíveis causas:
              </p>
              <ul className="text-xs space-y-1">
                <li>• Token da API UniFi inválido ou expirado</li>
                <li>• Nenhuma controladora vinculada à conta</li>
                <li>• API UniFi Site Manager temporariamente indisponível</li>
              </ul>
            </div>
          )}

          {loading && (
            <div className="text-center py-6 text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
              <p className="text-sm">Carregando controladoras...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};