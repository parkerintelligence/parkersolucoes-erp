
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, RefreshCw } from 'lucide-react';

interface GLPIFiltersPanelProps {
  onFiltersChange: (filters: any) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  totalTickets?: number;
}

export const GLPIFiltersPanel = ({ 
  onFiltersChange, 
  onRefresh, 
  isLoading = false,
  totalTickets = 0 
}: GLPIFiltersPanelProps) => {
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    entity: 'all'
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      entity: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== '' && value !== 'all').length;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg mb-4">
      <Filter className="h-4 w-4 text-slate-400" />
      
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
        <Input
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-7 h-8 text-sm bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          <SelectItem value="all" className="text-white">Todos</SelectItem>
          <SelectItem value="1" className="text-white">Novo</SelectItem>
          <SelectItem value="2" className="text-white">Em Andamento</SelectItem>
          <SelectItem value="3" className="text-white">Planejado</SelectItem>
          <SelectItem value="4" className="text-white">Pendente</SelectItem>
          <SelectItem value="5" className="text-white">Solucionado</SelectItem>
          <SelectItem value="6" className="text-white">Fechado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          <SelectItem value="all" className="text-white">Todas</SelectItem>
          <SelectItem value="1" className="text-white">Muito Baixa</SelectItem>
          <SelectItem value="2" className="text-white">Baixa</SelectItem>
          <SelectItem value="3" className="text-white">Média</SelectItem>
          <SelectItem value="4" className="text-white">Alta</SelectItem>
          <SelectItem value="5" className="text-white">Muito Alta</SelectItem>
          <SelectItem value="6" className="text-white">Crítica</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          <SelectItem value="all" className="text-white">Todas</SelectItem>
          <SelectItem value="hardware" className="text-white">Hardware</SelectItem>
          <SelectItem value="software" className="text-white">Software</SelectItem>
          <SelectItem value="network" className="text-white">Rede</SelectItem>
          <SelectItem value="system" className="text-white">Sistema</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.entity} onValueChange={(value) => handleFilterChange('entity', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Entidade" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          <SelectItem value="all" className="text-white">Todas</SelectItem>
          <SelectItem value="0" className="text-white">Root Entity</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-auto">
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400">
            {activeFiltersCount}
          </Badge>
        )}
        
        <span className="text-xs text-slate-400">
          {totalTickets} chamado{totalTickets !== 1 ? 's' : ''}
        </span>
        
        <Button
          onClick={onRefresh}
          size="sm"
          variant="ghost"
          disabled={isLoading}
          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            onClick={clearFilters}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
