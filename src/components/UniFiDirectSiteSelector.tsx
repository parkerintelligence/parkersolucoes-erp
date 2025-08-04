import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Wifi, Globe, AlertCircle } from 'lucide-react';
interface UniFiSiteWithSource {
  id: string;
  name: string;
  desc?: string;
  sourceType: string;
  sourceEndpoint: string;
  [key: string]: any;
}
interface UniFiDirectSiteSelectorProps {
  sites: UniFiSiteWithSource[];
  selectedSiteId: string | null;
  onSiteChange: (siteId: string | null) => void;
  loading: boolean;
}
const getSourceIcon = (sourceType: string) => {
  if (sourceType.includes('Site Manager')) {
    return <Globe className="h-4 w-4" />;
  }
  return <Wifi className="h-4 w-4" />;
};
const getSourceColor = (sourceType: string) => {
  if (sourceType.includes('Site Manager')) {
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
  return 'bg-green-500/10 text-green-500 border-green-500/20';
};
const UniFiDirectSiteSelector: React.FC<UniFiDirectSiteSelectorProps> = ({
  sites,
  selectedSiteId,
  onSiteChange,
  loading
}) => {
  const selectedSite = sites.find(site => site.id === selectedSiteId);
  if (loading) {
    return <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5" />
            Seleção de Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full bg-slate-700" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-700" />
            <Skeleton className="h-4 w-48 bg-slate-700" />
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Building2 className="h-5 w-5" />
          Seleção de Site
          <Badge variant="outline" className="ml-auto text-xs">
            {sites.length} site{sites.length !== 1 ? 's' : ''} encontrado{sites.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedSiteId || ''} onValueChange={onSiteChange}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Selecione um site..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {sites.length === 0 ? <div className="p-2 text-gray-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Nenhum site encontrado
              </div> : sites.map(site => <SelectItem key={site.id} value={site.id} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(site.sourceType)}
                    <span>{site.name}</span>
                    <Badge variant="outline" className={`ml-auto text-xs ${getSourceColor(site.sourceType)}`}>
                      {site.sourceType}
                    </Badge>
                  </div>
                </SelectItem>)}
          </SelectContent>
        </Select>

        {selectedSite}
      </CardContent>
    </Card>;
};
export default UniFiDirectSiteSelector;