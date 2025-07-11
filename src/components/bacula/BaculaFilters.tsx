import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { BaculaAnalysisDialog } from '@/components/BaculaAnalysisDialog';

interface BaculaFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
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
  jobsCount,
  allJobs
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-white">Dashboard - Jobs Status Terminated</h2>
      
      <div className="flex flex-wrap items-center gap-4">
        {/* Filtros */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar jobs..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-40 h-8 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">Todos</SelectItem>
            <SelectItem value="T" className="text-white">Completo</SelectItem>
            <SelectItem value="E" className="text-white">Erro</SelectItem>
            <SelectItem value="R" className="text-white">Executando</SelectItem>
            <SelectItem value="W" className="text-white">Incremental</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7days" className="text-white">7 dias</SelectItem>
            <SelectItem value="30days" className="text-white">30 dias</SelectItem>
            <SelectItem value="all" className="text-white">Todos</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="h-4 w-4" />
          <span>{jobsCount} jobs</span>
        </div>
        
        <BaculaAnalysisDialog jobs={allJobs} />
      </div>
    </div>
  );
};