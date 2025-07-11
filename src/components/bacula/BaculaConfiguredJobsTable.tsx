import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, Clock, User, Database, RefreshCw } from 'lucide-react';
import { useBaculaJobsConfigured, useBaculaJobs } from '@/hooks/useBaculaAPI';

interface ConfiguredJobsTableProps {
  // Props podem ser adicionadas conforme necessário
}

export const BaculaConfiguredJobsTable: React.FC<ConfiguredJobsTableProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { 
    data: configuredJobsData, 
    isLoading: configuredJobsLoading,
    refetch: refetchConfigured
  } = useBaculaJobsConfigured();

  const { 
    data: executedJobsData, 
    isLoading: executedJobsLoading 
  } = useBaculaJobs();

  // Função para extrair valor de campo de forma segura
  const getFieldValue = (job: any, fieldNames: string[], defaultValue: string = 'N/A') => {
    for (const fieldName of fieldNames) {
      const value = job[fieldName];
      if (value !== undefined && value !== null && value !== '') {
        // Se for objeto, tentar extrair propriedade name ou similar
        if (typeof value === 'object' && value !== null) {
          if (value.name) return String(value.name);
          if (value.Name) return String(value.Name);
          if (value.value) return String(value.value);
          // Se for array, pegar o primeiro item
          if (Array.isArray(value) && value.length > 0) {
            const firstItem = value[0];
            if (typeof firstItem === 'string') return firstItem;
            if (typeof firstItem === 'object' && firstItem.name) return String(firstItem.name);
          }
          // Como último recurso para objetos, tentar JSON.stringify
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        }
        return String(value);
      }
    }
    return defaultValue;
  };

  // Extrair dados dos jobs configurados
  const extractConfiguredJobs = (data: any) => {
    console.log('Raw configured jobs data:', JSON.stringify(data, null, 2));
    if (!data) return [];
    
    // Verificar estruturas mais específicas do Bacula
    if (data.output) {
      console.log('Found data.output:', data.output);
      
      // Se output é um objeto com jobs array
      if (data.output.jobs && Array.isArray(data.output.jobs)) {
        console.log('Found jobs array in output.jobs:', data.output.jobs);
        return data.output.jobs;
      }
      
      // Se output é diretamente um array
      if (Array.isArray(data.output)) {
        console.log('Output is direct array:', data.output);
        return data.output;
      }
      
      // Se output é um objeto, converter para array
      if (typeof data.output === 'object' && !Array.isArray(data.output)) {
        const jobsArray = Object.values(data.output).filter((item: any) => 
          item && typeof item === 'object' && (item.name || item.jobname || item.Job || item.JobName)
        );
        console.log('Converted output object to jobs array:', jobsArray);
        return jobsArray;
      }
    }
    
    // Verificar outras estruturas
    if (data.result && Array.isArray(data.result)) {
      console.log('Found jobs in data.result:', data.result);
      return data.result;
    }
    
    if (data.data && Array.isArray(data.data)) {
      console.log('Found jobs in data.data:', data.data);
      return data.data;
    }
    
    if (Array.isArray(data)) {
      console.log('Data is direct array:', data);
      return data;
    }
    
    // Se data é um objeto, tentar extrair jobs
    if (typeof data === 'object' && data !== null) {
      // Buscar por qualquer array dentro do objeto
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          const firstItem = data[key][0];
          if (firstItem && (firstItem.name || firstItem.jobname || firstItem.Job || firstItem.JobName)) {
            console.log(`Found jobs array in data.${key}:`, data[key]);
            return data[key];
          }
        }
      }
    }
    
    console.log('No valid jobs structure found, returning empty array');
    return [];
  };

  // Extrair dados dos jobs executados
  const extractExecutedJobs = (data: any) => {
    if (!data) return [];
    if (data.output && Array.isArray(data.output)) {
      return data.output;
    }
    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  };

  const configuredJobs = extractConfiguredJobs(configuredJobsData);
  const executedJobs = extractExecutedJobs(executedJobsData);

  // Função para encontrar o último job bem-sucedido
  const getLastSuccessfulJob = (jobName: string) => {
    const successfulJobs = executedJobs
      .filter(job => {
        const jobNameToMatch = getFieldValue(job, ['name', 'jobname', 'Job', 'JobName']);
        return jobNameToMatch === jobName && job.jobstatus === 'T';
      })
      .sort((a, b) => new Date(b.starttime || b.schedtime || 0).getTime() - new Date(a.starttime || a.schedtime || 0).getTime());
    
    return successfulJobs[0] || null;
  };

  // Função para encontrar o último job com falha
  const getLastFailedJob = (jobName: string) => {
    const failedJobs = executedJobs
      .filter(job => {
        const jobNameToMatch = getFieldValue(job, ['name', 'jobname', 'Job', 'JobName']);
        return jobNameToMatch === jobName && (job.jobstatus === 'E' || job.jobstatus === 'f');
      })
      .sort((a, b) => new Date(b.starttime || b.schedtime || 0).getTime() - new Date(a.starttime || a.schedtime || 0).getTime());
    
    return failedJobs[0] || null;
  };

  // Filtrar jobs configurados
  const filteredJobs = configuredJobs.filter(job => {
    console.log('Filtering job:', job);
    
    const jobName = getFieldValue(job, ['name', 'jobname', 'Job', 'JobName']);
    const clientName = getFieldValue(job, ['client', 'clientname', 'Client', 'ClientName']);
    
    const matchesSearch = !searchTerm || 
      jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const jobType = getFieldValue(job, ['type', 'jobtype', 'Type', 'JobType']);
    const matchesType = typeFilter === 'all' || 
      (jobType === typeFilter);
    
    return matchesSearch && matchesType;
  });

  // Função para formatar data/hora
  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '-';
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return `${diffHours} hours ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} ago`;
      }
    } catch (e) {
      return dateTime;
    }
  };

  // Função para obter badge do tipo de job
  const getJobTypeBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'B':
      case 'BACKUP':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600 text-xs">Backup</Badge>;
      case 'R':
      case 'RESTORE':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600 text-xs">Restore</Badge>;
      case 'V':
      case 'VERIFY':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600 text-xs">Verify</Badge>;
      case 'A':
      case 'ADMIN':
        return <Badge className="bg-purple-900/20 text-purple-400 border-purple-600 text-xs">Admin</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600 text-xs">{type || 'N/A'}</Badge>;
    }
  };

  if (configuredJobsLoading || executedJobsLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 text-slate-400 animate-spin" />
          <p className="text-slate-400">Carregando jobs configurados...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Jobs Cadastrados</h2>
          <p className="text-sm text-slate-400">Configurações de jobs definidas no Bacula Director</p>
        </div>
        
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
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="B" className="text-white">Backup</SelectItem>
              <SelectItem value="R" className="text-white">Restore</SelectItem>
              <SelectItem value="V" className="text-white">Verify</SelectItem>
              <SelectItem value="A" className="text-white">Admin</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="h-4 w-4" />
            <span>{filteredJobs.length} jobs</span>
          </div>
          
          <Button 
            onClick={() => refetchConfigured()} 
            size="sm" 
            variant="outline" 
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
        </div>
      </div>

      {/* Tabela de Jobs Configurados */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                 <TableRow className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50">
                   <TableHead className="text-slate-200 font-semibold py-4 px-4 w-[200px]">
                     <div className="flex items-center gap-2">
                       <Database className="h-4 w-4" />
                       Job Name
                     </div>
                   </TableHead>
                   <TableHead className="text-slate-200 font-semibold py-4 px-4 w-[100px]">
                     <div className="flex items-center gap-2">
                       <Filter className="h-4 w-4" />
                       Type
                     </div>
                   </TableHead>
                   <TableHead className="text-slate-200 font-semibold py-4 px-4 w-[150px]">
                     <div className="flex items-center gap-2">
                       <User className="h-4 w-4" />
                       Client
                     </div>
                   </TableHead>
                   <TableHead className="text-slate-200 font-semibold py-4 px-4 w-[180px]">
                     <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4" />
                       Last Success
                     </div>
                   </TableHead>
                   <TableHead className="text-slate-200 font-semibold py-4 px-4 w-[180px]">
                     <div className="flex items-center gap-2">
                       <Clock className="h-4 w-4" />
                       Last Failure
                     </div>
                   </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredJobs.length > 0 ? (
                   filteredJobs.map((job, index) => {
                     const jobName = getFieldValue(job, ['name', 'jobname', 'Job', 'JobName']);
                     const lastSuccessful = getLastSuccessfulJob(jobName);
                     const lastFailed = getLastFailedJob(jobName);
                    
                    return (
                      <TableRow 
                        key={index} 
                        className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                           <TableCell className="font-medium text-white py-4 px-4">
                             <div className="flex flex-col space-y-1">
                               <span className="text-sm font-semibold text-white">
                                 {getFieldValue(job, ['name', 'jobname', 'Job', 'JobName'])}
                               </span>
                               {getFieldValue(job, ['description', 'Description'], '') !== '' && (
                                 <span className="text-xs text-slate-400">
                                   {getFieldValue(job, ['description', 'Description'])}
                                 </span>
                               )}
                             </div>
                           </TableCell>
                           <TableCell className="py-4 px-4">
                              {getJobTypeBadge(
                                getFieldValue(job, ['type', 'jobtype', 'Type', 'JobType'], 'Unknown')
                              )}
                            </TableCell>
                           <TableCell className="text-slate-300 py-4 px-4 text-sm font-medium">
                             {getFieldValue(job, ['client', 'clientname', 'Client', 'ClientName'], '-')}
                           </TableCell>
                         <TableCell className="py-4 px-4 text-sm">
                           {lastSuccessful ? (
                             <div className="space-y-2">
                               <div className="flex items-center space-x-2">
                                 <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300 text-xs font-medium px-2 py-1">
                                   ✓ Sucesso
                                 </Badge>
                               </div>
                               <div className="text-xs text-slate-400">
                                 {formatDateTime(lastSuccessful.starttime || lastSuccessful.schedtime)}
                               </div>
                               {lastSuccessful.jobbytes && (
                                 <div className="text-xs text-slate-500">
                                   📊 {(parseInt(lastSuccessful.jobbytes) / (1024 * 1024)).toFixed(2)} MB
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="flex items-center space-x-2">
                               <Badge variant="outline" className="bg-slate-500/20 border-slate-500/40 text-slate-400 text-xs">
                                 — Sem registro
                               </Badge>
                             </div>
                           )}
                         </TableCell>
                         <TableCell className="py-4 px-4 text-sm">
                           {lastFailed ? (
                             <div className="space-y-2">
                               <div className="flex items-center space-x-2">
                                 <Badge variant="outline" className="bg-red-500/20 border-red-500/40 text-red-300 text-xs font-medium px-2 py-1">
                                   ✗ Falha
                                 </Badge>
                               </div>
                               <div className="text-xs text-slate-400">
                                 {formatDateTime(lastFailed.starttime || lastFailed.schedtime)}
                               </div>
                               {lastFailed.joberrors && (
                                 <div className="text-xs text-red-400 max-w-xs break-words">
                                   ⚠️ {String(lastFailed.joberrors).substring(0, 100)}...
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="flex items-center space-x-2">
                               <Badge variant="outline" className="bg-slate-500/20 border-slate-500/40 text-slate-400 text-xs">
                                 — Sem falhas
                               </Badge>
                             </div>
                           )}
                         </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      Nenhum job configurado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};