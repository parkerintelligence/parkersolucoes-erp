
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, RefreshCw } from 'lucide-react';

interface GLPIInventoryFiltersProps {
  onFiltersChange: (filters: any) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  totalItems?: number;
}

export const GLPIInventoryFilters = ({ 
  onFiltersChange, 
  onRefresh, 
  isLoading = false,
  totalItems = 0 
}: GLPIInventoryFiltersProps) => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    entity: 'all',
    location: 'all'
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      type: 'all',
      status: 'all',
      entity: 'all',
      location: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== '' && value !== 'all').length;

  return (
    <Card className="bg-card border-border mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400">
                {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </span>
            <Button
              onClick={onRefresh}
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                onClick={clearFilters}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-7 h-8 text-sm bg-secondary border-border text-foreground placeholder-gray-400"
            />
          </div>

          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border text-foreground">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">Todos os Tipos</SelectItem>
              <SelectItem value="computer" className="text-foreground text-xs">Computador</SelectItem>
              <SelectItem value="monitor" className="text-foreground text-xs">Monitor</SelectItem>
              <SelectItem value="printer" className="text-foreground text-xs">Impressora</SelectItem>
              <SelectItem value="network" className="text-foreground text-xs">Rede</SelectItem>
              <SelectItem value="phone" className="text-foreground text-xs">Telefone</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">Todos os Status</SelectItem>
              <SelectItem value="1" className="text-foreground text-xs">Ativo</SelectItem>
              <SelectItem value="2" className="text-foreground text-xs">Em Uso</SelectItem>
              <SelectItem value="3" className="text-foreground text-xs">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.entity} onValueChange={(value) => handleFilterChange('entity', value)}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border text-foreground">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">Todas as Entidades</SelectItem>
              <SelectItem value="0" className="text-foreground text-xs">Root Entity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border text-foreground">
              <SelectValue placeholder="Localização" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">Todas as Localizações</SelectItem>
              <SelectItem value="sede" className="text-foreground text-xs">Sede</SelectItem>
              <SelectItem value="filial" className="text-foreground text-xs">Filial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
