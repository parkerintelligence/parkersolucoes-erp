
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, AlertCircle, Users, Globe } from 'lucide-react';
import { UniFiSite } from '@/hooks/useUniFiAPI';

interface UniFiSiteSelectorProps {
  sites: UniFiSite[];
  selectedSiteId?: string;
  onSiteChange: (siteId: string) => void;
  loading?: boolean;
}

export const UniFiSiteSelector: React.FC<UniFiSiteSelectorProps> = ({
  sites,
  selectedSiteId,
  onSiteChange,
  loading = false
}) => {
  const selectedSite = sites.find(site => site.id === selectedSiteId);

  return (
    <Card className="bg-blue-900/30 border-blue-500 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          Seleção de Site UniFi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Select
            value={selectedSiteId || ''}
            onValueChange={onSiteChange}
            disabled={loading || sites.length === 0}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Selecione um site da controladora para gerenciar" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {sites.map((site) => (
                <SelectItem 
                  key={site.id} 
                  value={site.id}
                  className="text-white hover:bg-gray-600"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-400" />
                      <span>{site.description || site.name}</span>
                    </div>
                    {(site.newAlarmCount || 0) > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {site.newAlarmCount} alertas
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSite && (
            <div className="mt-3 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-medium text-white">
                      {selectedSite.description || selectedSite.name}
                    </h4>
                  </div>
                   <div className="space-y-1 text-xs text-gray-300">
                     <p><strong>Site ID:</strong> {selectedSite.id}</p>
                     <p><strong>Nome:</strong> {selectedSite.name}</p>
                     <div className="flex items-center gap-1">
                       <Users className="h-3 w-3" />
                       <span><strong>Função:</strong> {selectedSite.role}</span>
                     </div>
                     {selectedSite.description && selectedSite.description !== selectedSite.name && (
                       <p><strong>Descrição:</strong> {selectedSite.description}</p>
                     )}
                   </div>
                </div>
                {(selectedSite.newAlarmCount || 0) > 0 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">{selectedSite.newAlarmCount} novos alertas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {sites.length === 0 && !loading && (
            <div className="text-center py-6 text-gray-300">
              <Server className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">Nenhum site encontrado na controladora</p>
              <p className="text-xs">
                Verifique se a controladora está configurada e acessível
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-6 text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
              <p className="text-sm">Carregando sites da controladora...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
