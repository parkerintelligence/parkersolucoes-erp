import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar as CalendarLucide } from 'lucide-react';

interface BaculaFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  groupByDate?: boolean;
  setGroupByDate?: (group: boolean) => void;
  jobsCount: number;
  allJobs: any[];
}

export const BaculaFilters: React.FC<BaculaFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  groupByDate = false,
  setGroupByDate,
  jobsCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-foreground">Jobs Status Terminated</h2>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar jobs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-7 w-36 h-7 text-xs bg-background border-border"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 h-7 text-xs bg-background border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            <SelectItem value="T" className="text-xs">Completo</SelectItem>
            <SelectItem value="error" className="text-xs">Erro</SelectItem>
            <SelectItem value="R" className="text-xs">Executando</SelectItem>
            <SelectItem value="W" className="text-xs">Aviso</SelectItem>
            <SelectItem value="A" className="text-xs">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-36 h-7 text-xs bg-background border-border">
            <CalendarLucide className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1day" className="text-xs">Último dia</SelectItem>
            <SelectItem value="7days" className="text-xs">Últimos 7 dias</SelectItem>
            <SelectItem value="30days" className="text-xs">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        {setGroupByDate && (
          <div className="flex items-center gap-1.5">
            <Switch
              id="group-by-date"
              checked={groupByDate}
              onCheckedChange={setGroupByDate}
              className="scale-75"
            />
            <Label htmlFor="group-by-date" className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
              <CalendarLucide className="h-3 w-3" />
              Agrupar
            </Label>
          </div>
        )}

        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border text-muted-foreground">
          <Filter className="h-2.5 w-2.5 mr-1" />
          {jobsCount} jobs
        </Badge>
      </div>
    </div>
  );
};
