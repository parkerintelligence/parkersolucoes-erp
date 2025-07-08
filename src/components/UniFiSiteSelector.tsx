
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertCircle } from 'lucide-react';
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
  const selectedSite = sites.find(site => site._id === selectedSiteId);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Seleção de Site
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
              <SelectValue placeholder="Selecione um site para gerenciar" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {sites.map((site) => (
                <SelectItem 
                  key={site._id} 
                  value={site._id}
                  className="text-white hover:bg-gray-600"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{site.desc || site.name}</span>
                    {site.num_new_alarms > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {site.num_new_alarms} alertas
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSite && (
            <div className="mt-3 p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">{selectedSite.desc}</h4>
                  <p className="text-xs text-gray-400">ID: {selectedSite.name}</p>
                  <p className="text-xs text-gray-400">Role: {selectedSite.role}</p>
                </div>
                {selectedSite.num_new_alarms > 0 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">{selectedSite.num_new_alarms} novos alertas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {sites.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-400">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum site encontrado</p>
              <p className="text-xs">Verifique sua conexão com a controladora</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
