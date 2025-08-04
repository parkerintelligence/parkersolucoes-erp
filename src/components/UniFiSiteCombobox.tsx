import React, { useState } from 'react';
import { Check, ChevronsUpDown, Globe, Users, Router, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UniFiSite } from '@/hooks/useUniFiAPI';

interface UniFiSiteComboboxProps {
  sites: UniFiSite[];
  selectedSiteId?: string;
  onSiteChange: (siteId: string) => void;
  loading?: boolean;
  stats?: {
    total_devices: number;
    online_devices: number;
    total_clients: number;
    wireless_clients: number;
  };
}

export const UniFiSiteCombobox: React.FC<UniFiSiteComboboxProps> = ({
  sites,
  selectedSiteId,
  onSiteChange,
  loading = false,
  stats
}) => {
  const [open, setOpen] = useState(false);
  
  const selectedSite = sites.find(site => site.id === selectedSiteId);

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Site UniFi
        </CardTitle>
        <CardDescription>
          Selecione um site para visualizar dispositivos e clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Site Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              disabled={loading || sites.length === 0}
            >
              {selectedSite ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate">{selectedSite.description || selectedSite.name}</span>
                  {(selectedSite.newAlarmCount || 0) > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {selectedSite.newAlarmCount}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {loading ? "Carregando sites..." : "Selecione um site"}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
            <Command className="bg-transparent">
              <CommandInput 
                placeholder="Buscar site..." 
                className="border-0 focus:ring-0 text-foreground placeholder:text-muted-foreground"
              />
              <CommandList className="max-h-64">
                <CommandEmpty className="text-muted-foreground p-4 text-center">
                  Nenhum site encontrado.
                </CommandEmpty>
                <CommandGroup>
                  {sites.map((site) => (
                    <CommandItem
                      key={site.id}
                      value={site.description || site.name}
                      onSelect={() => {
                        onSiteChange(site.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSiteId === site.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {site.description || site.name}
                            </span>
                            {site.description && site.description !== site.name && (
                              <span className="text-xs text-muted-foreground">
                                {site.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {(site.newAlarmCount || 0) > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {site.newAlarmCount} alertas
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Site Info */}
        {selectedSite && (
          <div className="p-4 bg-accent/30 rounded-lg border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium text-card-foreground">
                    {selectedSite.description || selectedSite.name}
                  </h4>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Site ID:</strong> {selectedSite.id}</p>
                  <p><strong>Nome:</strong> {selectedSite.name}</p>
                  <p><strong>Função:</strong> {selectedSite.role}</p>
                  {selectedSite.description && selectedSite.description !== selectedSite.name && (
                    <p><strong>Descrição:</strong> {selectedSite.description}</p>
                  )}
                </div>
              </div>
              {(selectedSite.newAlarmCount || 0) > 0 && (
                <Badge variant="destructive">
                  {selectedSite.newAlarmCount} alertas
                </Badge>
              )}
            </div>

            {/* Site Statistics */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Router className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs font-medium text-card-foreground">
                      {stats.online_devices}/{stats.total_devices}
                    </p>
                    <p className="text-xs text-muted-foreground">Dispositivos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs font-medium text-card-foreground">
                      {stats.total_clients}
                    </p>
                    <p className="text-xs text-muted-foreground">Clientes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {sites.length === 0 && !loading && (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">Nenhum site encontrado</p>
            <p className="text-xs">
              Verifique se a controladora está configurada e acessível
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-6 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm">Carregando sites...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};