
import { useState } from 'react';
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
  const [filters, setFilters] = useState({
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
    <div className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg mb-4">
      <Filter className="h-4 w-4 text-muted-foreground" />
      
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-7 h-8 text-sm bg-secondary border-border text-foreground"
        />
      </div>

      <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-secondary border-border text-foreground">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          <SelectItem value="all" className="text-foreground">Todos</SelectItem>
          <SelectItem value="1" className="text-foreground">Novo</SelectItem>
          <SelectItem value="2" className="text-foreground">Em Andamento</SelectItem>
          <SelectItem value="3" className="text-foreground">Planejado</SelectItem>
          <SelectItem value="4" className="text-foreground">Pendente</SelectItem>
          <SelectItem value="5" className="text-foreground">Solucionado</SelectItem>
          <SelectItem value="6" className="text-foreground">Fechado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-secondary border-border text-foreground">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          <SelectItem value="all" className="text-foreground">Todas</SelectItem>
          <SelectItem value="1" className="text-foreground">Muito Baixa</SelectItem>
          <SelectItem value="2" className="text-foreground">Baixa</SelectItem>
          <SelectItem value="3" className="text-foreground">Média</SelectItem>
          <SelectItem value="4" className="text-foreground">Alta</SelectItem>
          <SelectItem value="5" className="text-foreground">Muito Alta</SelectItem>
          <SelectItem value="6" className="text-foreground">Crítica</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-secondary border-border text-foreground">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          <SelectItem value="all" className="text-foreground">Todas</SelectItem>
          <SelectItem value="hardware" className="text-foreground">Hardware</SelectItem>
          <SelectItem value="software" className="text-foreground">Software</SelectItem>
          <SelectItem value="network" className="text-foreground">Rede</SelectItem>
          <SelectItem value="system" className="text-foreground">Sistema</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.entity} onValueChange={(value) => handleFilterChange('entity', value)}>
        <SelectTrigger className="h-8 w-32 text-sm bg-secondary border-border text-foreground">
          <SelectValue placeholder="Entidade" />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          <SelectItem value="all" className="text-foreground">Todas</SelectItem>
          <SelectItem value="0" className="text-foreground">Root Entity</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-auto">
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400">
            {activeFiltersCount}
          </Badge>
        )}
        
        <span className="text-xs text-muted-foreground">
          {totalTickets} chamado{totalTickets !== 1 ? 's' : ''}
        </span>
        
        <Button
          onClick={onRefresh}
          size="sm"
          variant="ghost"
          disabled={isLoading}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            onClick={clearFilters}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
