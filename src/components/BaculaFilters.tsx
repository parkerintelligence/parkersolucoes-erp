
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

interface BaculaFiltersProps {
  dateFilter: string;
  statusFilter: string;
  clientFilter: string;
  onDateFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onReset: () => void;
}

export const BaculaFilters: React.FC<BaculaFiltersProps> = ({
  dateFilter,
  statusFilter,
  clientFilter,
  onDateFilterChange,
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
    <Card className="bg-slate-800 border-slate-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="date-filter" className="text-slate-300">Data</Label>
            <Input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="status-filter" className="text-slate-300">Status</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="T">Sucesso</SelectItem>
                <SelectItem value="W">Aviso</SelectItem>
                <SelectItem value="E">Erro</SelectItem>
                <SelectItem value="f">Fatal</SelectItem>
                <SelectItem value="R">Executando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client-filter" className="text-slate-300">Cliente</Label>
            <Input
              id="client-filter"
              type="text"
              placeholder="Filtrar por cliente"
              value={clientFilter}
              onChange={(e) => onClientFilterChange(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={onReset}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
