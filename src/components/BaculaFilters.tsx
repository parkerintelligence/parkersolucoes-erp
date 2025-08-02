
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

interface BaculaFiltersProps {
  startDate: string;
  endDate: string;
  statusFilter: string;
  clientFilter: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onReset: () => void;
}

export const BaculaFilters: React.FC<BaculaFiltersProps> = ({
  startDate,
  endDate,
  statusFilter,
  clientFilter,
  onStartDateChange,
  onEndDateChange,
  onStatusFilterChange,
  onClientFilterChange,
  onReset
}) => {
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  return (
    <Card className="bg-slate-800 border-slate-700 mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Filter className="h-4 w-4" />
            <span>Filtros:</span>
          </div>
          
          <div className="min-w-[120px]">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-8 bg-slate-700 border-slate-600 text-white text-xs"
              title="Data Inicial"
            />
          </div>

          <div className="min-w-[120px]">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-8 bg-slate-700 border-slate-600 text-white text-xs"
              title="Data Final"
            />
          </div>

          <div className="min-w-[120px]">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-white text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="T">Sucesso</SelectItem>
                <SelectItem value="W">Aviso</SelectItem>
                <SelectItem value="E">Erro</SelectItem>
                <SelectItem value="f">Fatal</SelectItem>
                <SelectItem value="R">Executando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[120px]">
            <Input
              type="text"
              placeholder="Cliente"
              value={clientFilter}
              onChange={(e) => onClientFilterChange(e.target.value)}
              className="h-8 bg-slate-700 border-slate-600 text-white text-xs placeholder-slate-400"
            />
          </div>

          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="h-8 px-3 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
