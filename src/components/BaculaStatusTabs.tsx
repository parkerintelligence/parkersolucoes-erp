import { ReactElement, ReactNode, cloneElement } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
interface BaculaStatusTabsProps {
  jobs: any[];
  children: ReactNode;
  startDate: string;
  endDate: string;
  statusFilter: string;
  clientFilter: string;
}
export const BaculaStatusTabs = ({
  jobs,
  children,
  startDate,
  endDate,
  statusFilter,
  clientFilter
}: BaculaStatusTabsProps) => {
  // Aplicar filtros aos jobs baseado nas datas e filtros ativos
  const applyFilters = (jobsList: any[]) => {
    return jobsList.filter((job: any) => {
      let passesFilter = true;

      // Filtro por data inicial
      if (startDate) {
        const jobDate = new Date(job.starttime || job.schedtime || job.realendtime);
        const filterStartDate = new Date(startDate);
        passesFilter = passesFilter && jobDate >= filterStartDate;
      }

      // Filtro por data final
      if (endDate) {
        const jobDate = new Date(job.starttime || job.schedtime || job.realendtime);
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999); // Incluir todo o dia final
        passesFilter = passesFilter && jobDate <= filterEndDate;
      }

      // Filtro por cliente
      if (clientFilter) {
        const client = (job.client || job.clientname || job.clientid || '').toLowerCase();
        passesFilter = passesFilter && client.includes(clientFilter.toLowerCase());
      }
      return passesFilter;
    });
  };
  const getJobsByStatus = (status: string) => {
    const filteredJobs = applyFilters(jobs);
    if (status === 'all') return filteredJobs;
    return filteredJobs.filter((job: any) => job.jobstatus === status);
  };
  const getStatusCount = (status: string) => {
    return getJobsByStatus(status).length;
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };
  return <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-6 border-slate-700 bg-blue-950">
        <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 text-slate-50">
          Todos
          <Badge className="ml-2 bg-slate-600 text-white">
            {getJobsByStatus('all').length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="T" className="text-slate-300 data-[state=active]:bg-slate-700">
          {getStatusIcon('success')}
          Sucesso
          <Badge className="ml-2 bg-green-900/20 text-green-400">
            {getStatusCount('T') + getStatusCount('W')}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="E" className="text-slate-300 data-[state=active]:bg-slate-700">
          {getStatusIcon('error')}
          Erro
          <Badge className="ml-2 bg-red-900/20 text-red-400">
            {getStatusCount('E') + getStatusCount('f')}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="R" className="text-slate-300 data-[state=active]:bg-slate-700">
          {getStatusIcon('running')}
          Executando
          <Badge className="ml-2 bg-blue-900/20 text-blue-400">
            {getStatusCount('R')}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="W" className="text-slate-300 data-[state=active]:bg-slate-700">
          {getStatusIcon('warning')}
          Aviso
          <Badge className="ml-2 bg-yellow-900/20 text-yellow-400">
            {getStatusCount('W')}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className="text-slate-300 data-[state=active]:bg-slate-700">
          {getStatusIcon('pending')}
          Pendente
          <Badge className="ml-2 bg-slate-900/20 text-gray-400">
            {getStatusCount('C') + getStatusCount('c')}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-6">
        {cloneElement(children as ReactElement, {
        filteredJobs: getJobsByStatus('all'),
        startDate,
        endDate,
        statusFilter,
        clientFilter
      })}
      </TabsContent>
      <TabsContent value="T" className="mt-6">
        {cloneElement(children as ReactElement, {
        filteredJobs: getJobsByStatus('T').concat(getJobsByStatus('W')),
        startDate,
        endDate,
        statusFilter,
        clientFilter
      })}
      </TabsContent>
      <TabsContent value="E" className="mt-6">
        {cloneElement(children as ReactElement, {
        filteredJobs: getJobsByStatus('E').concat(getJobsByStatus('f')),
        startDate,
        endDate,
        statusFilter,
        clientFilter
      })}
      </TabsContent>
      <TabsContent value="R" className="mt-6">
        {cloneElement(children as ReactElement, {
        filteredJobs: getJobsByStatus('R'),
        startDate,
        endDate,
        statusFilter,
        clientFilter
      })}
      </TabsContent>
      <TabsContent value="W" className="mt-6">
        {cloneElement(children as ReactElement, {
        filteredJobs: getJobsByStatus('W'),
        startDate,
        endDate,
        statusFilter,
        clientFilter
      })}
      </TabsContent>
      <TabsContent value="pending" className="mt-6">
        {cloneElement(children as ReactElement, {
        filteredJobs: getJobsByStatus('C').concat(getJobsByStatus('c')),
        startDate,
        endDate,
        statusFilter,
        clientFilter
      })}
      </TabsContent>
    </Tabs>;
};