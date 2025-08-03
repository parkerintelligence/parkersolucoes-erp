import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, 
  Building2, 
  Server, 
  MapPin,
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface UniFiSiteGroup {
  id: string;
  name: string;
  description: string;
  type: 'host' | 'location' | 'function' | 'default';
  sites: any[];
  hostId?: string;
  hostName?: string;
  totalDevices: number;
  totalClients: number;
  onlineDevices: number;
  status: 'healthy' | 'warning' | 'error';
  apiType?: 'site-manager' | 'local-controller';
}

interface UniFiSiteGroupSelectorProps {
  groups: UniFiSiteGroup[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  loading?: boolean;
}

const UniFiSiteGroupSelector: React.FC<UniFiSiteGroupSelectorProps> = ({
  groups,
  selectedGroupId,
  onGroupChange,
  loading = false
}) => {
  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'host':
        return <Server className="h-4 w-4 text-blue-400" />;
      case 'location':
        return <MapPin className="h-4 w-4 text-green-400" />;
      case 'function':
        return <Building2 className="h-4 w-4 text-purple-400" />;
      default:
        return <FolderOpen className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Globe className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Grupos de Sites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full bg-slate-700" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-slate-700" />
            <Skeleton className="h-4 w-1/2 bg-slate-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Grupos de Sites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedGroupId} onValueChange={onGroupChange}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Selecione um grupo de sites..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {groups.length === 0 ? (
              <SelectItem value="" disabled className="text-gray-400">
                Nenhum grupo encontrado
              </SelectItem>
            ) : (
              groups.map((group) => (
                <SelectItem 
                  key={group.id} 
                  value={group.id}
                  className="text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getGroupIcon(group.type)}
                      <div className="flex flex-col">
                        <span>{group.name}</span>
                        {group.apiType && (
                          <span className="text-xs text-gray-400">
                            {group.apiType === 'local-controller' ? 'Controladora Local' : 'Site Manager API'}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-1 text-xs">
                        {group.sites.length} sites
                      </Badge>
                      {getStatusIcon(group.status)}
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedGroup && (
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              {getGroupIcon(selectedGroup.type)}
              <h4 className="text-sm font-medium text-white">
                {selectedGroup.name}
              </h4>
              {selectedGroup.apiType && (
                <span className="text-xs text-gray-400 font-normal">
                  {selectedGroup.apiType === 'local-controller' ? 'Controladora Local' : 'Site Manager API'}
                </span>
              )}
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(selectedGroup.status)}`}
              >
                {selectedGroup.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400">Sites</span>
                <span className="text-white font-medium">{selectedGroup.sites.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">Dispositivos</span>
                <span className="text-white font-medium">{selectedGroup.totalDevices}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">Clientes</span>
                <span className="text-white font-medium">{selectedGroup.totalClients}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400">{selectedGroup.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniFiSiteGroupSelector;
export { UniFiSiteGroupSelector };