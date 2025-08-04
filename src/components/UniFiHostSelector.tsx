import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, HardDrive, MapPin } from 'lucide-react';

import { UniFiHost } from '@/hooks/useUniFiAPI';

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
                       <div className="flex flex-col">
                         <span>{host.displayName || host.reportedState?.name || host.reportedState?.hostname}</span>
                         {host.apiType && (
                           <span className="text-xs text-gray-400">
                             {host.apiType === 'local-controller' ? 'Controladora Local' : 'Site Manager API'}
                           </span>
                         )}
                       </div>
                       {host.sitesCount !== undefined && (
                         <Badge variant="outline" className="ml-1 text-xs">
                           {host.sitesCount} sites
                         </Badge>
                       )}
                     </div>
                     <div className="flex items-center gap-1">
                       <Badge 
                         variant={host.reportedState?.state === 'connected' ? 'default' : 'secondary'}
                         className="text-xs"
                       >
                         {host.reportedState?.state || 'unknown'}
                       </Badge>
                       {!host.isValid && (
                         <Badge variant="destructive" className="text-xs">
                           Sem dados
                         </Badge>
                       )}
                     </div>
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
                       {selectedHost.displayName || selectedHost.reportedState?.name || selectedHost.reportedState?.hostname}
                     </h4>
                     {selectedHost.apiType && (
                       <span className="text-xs text-gray-400 font-normal">
                         {selectedHost.apiType === 'local-controller' ? 'Controladora Local' : 'Site Manager API'}
                       </span>
                     )}
                     {selectedHost.sitesCount !== undefined && (
                       <Badge variant="outline" className="text-xs">
                         {selectedHost.sitesCount} sites disponíveis
                       </Badge>
                     )}
                   </div>
                   <div className="space-y-1 text-xs text-gray-300">
                     <p><strong>Host ID:</strong> {selectedHost.id}</p>
                     <p><strong>IP:</strong> {selectedHost.reportedState?.ipAddrs?.[0] || selectedHost.ipAddress}</p>
                     <p><strong>Versão:</strong> {selectedHost.reportedState?.version}</p>
                     <p><strong>Hostname:</strong> {selectedHost.reportedState?.hostname}</p>
                     {selectedHost.reportedState?.mgmt_port && (
                       <p><strong>Porta Gerência:</strong> {selectedHost.reportedState.mgmt_port}</p>
                     )}
                   </div>
                </div>
                 <div className="flex flex-col gap-1">
                   <Badge 
                     variant={selectedHost.reportedState?.state === 'connected' ? 'default' : 'secondary'}
                   >
                     {selectedHost.reportedState?.state || 'unknown'}
                   </Badge>
                   {selectedHost.isValid !== undefined && (
                     <Badge 
                       variant={selectedHost.isValid ? 'default' : 'destructive'}
                       className="text-xs"
                     >
                       {selectedHost.isValid ? 'Dados válidos' : 'Sem dados disponíveis'}
                     </Badge>
                   )}
                 </div>
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