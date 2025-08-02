
import React from 'react';
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
  const [filters, setFilters] = React.useState({
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
    <Card className="bg-gray-800 border-gray-700 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-200">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400">
                {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </span>
            <Button
              onClick={onRefresh}
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                onClick={clearFilters}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-7 h-8 text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white text-xs">Todos os Tipos</SelectItem>
              <SelectItem value="computer" className="text-white text-xs">Computador</SelectItem>
              <SelectItem value="monitor" className="text-white text-xs">Monitor</SelectItem>
              <SelectItem value="printer" className="text-white text-xs">Impressora</SelectItem>
              <SelectItem value="network" className="text-white text-xs">Rede</SelectItem>
              <SelectItem value="phone" className="text-white text-xs">Telefone</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white text-xs">Todos os Status</SelectItem>
              <SelectItem value="1" className="text-white text-xs">Ativo</SelectItem>
              <SelectItem value="2" className="text-white text-xs">Em Uso</SelectItem>
              <SelectItem value="3" className="text-white text-xs">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.entity} onValueChange={(value) => handleFilterChange('entity', value)}>
            <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white text-xs">Todas as Entidades</SelectItem>
              <SelectItem value="0" className="text-white text-xs">Root Entity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
            <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Localização" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white text-xs">Todas as Localizações</SelectItem>
              <SelectItem value="sede" className="text-white text-xs">Sede</SelectItem>
              <SelectItem value="filial" className="text-white text-xs">Filial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
