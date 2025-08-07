import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronUp, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  HardDrive,
  Users,
  TrendingDown,
  FileText,
  Calendar,
  Server,
  Grid3x3,
  List
} from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface BaculaJob {
  name: string;
  status: string;
  client: string;
  datetime: string;
  bytes: number;
  files: number;
  jobId?: string;
}

interface BaculaData {
  date: string;
  totalJobs: number;
  successJobs: number;
  errorJobs: number;
  affectedClients: number;
  recurringFailures: boolean;
  successJobs_list: BaculaJob[];
  errorJobs_list: BaculaJob[];
  canceledJobs_list: BaculaJob[];
  runningJobs_list: BaculaJob[];
  totalBytes: number;
  totalFiles: number;
  fallbackData: boolean;
}

interface BaculaReportViewerProps {
  messageContent: string;
}

export const BaculaReportViewer: React.FC<BaculaReportViewerProps> = ({ messageContent }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const parseBaculaReport = (content: string): BaculaData | null => {
    const lines = content.split('\n').filter(line => line.trim());
    
    const data: BaculaData = {
      date: new Date().toLocaleDateString('pt-BR'),
      totalJobs: 0,
      successJobs: 0,
      errorJobs: 0,
      affectedClients: 0,
      recurringFailures: false,
      successJobs_list: [],
      errorJobs_list: [],
      canceledJobs_list: [],
      runningJobs_list: [],
      totalBytes: 0,
      totalFiles: 0,
      fallbackData: false
    };

    let currentSection = '';
    let successRate = 0;
    
    for (const line of lines) {
      // Extract success rate if present
      const successRateMatch = line.match(/Taxa de Sucesso:\s*(\d+\.?\d*)%/);
      if (successRateMatch) {
        successRate = parseFloat(successRateMatch[1]);
        continue;
      }

      // Detect sections by emojis and keywords
      if (line.includes('✅') && (line.includes('SUCESSO') || line.includes('SUCCESS'))) {
        currentSection = 'success';
        const match = line.match(/\((\d+)\)/);
        if (match) {
          data.successJobs = parseInt(match[1]);
        }
        continue;
      }
      
      if (line.includes('❌') && (line.includes('ERRO') || line.includes('ERROR'))) {
        currentSection = 'error';
        const match = line.match(/\((\d+)\)/);
        if (match) {
          data.errorJobs = parseInt(match[1]);
        }
        continue;
      }
      
      if (line.includes('⚠') && (line.includes('CANCELADO') || line.includes('CANCELED'))) {
        currentSection = 'canceled';
        const match = line.match(/\((\d+)\)/);
        if (match) {
          // Handle canceled jobs count
        }
        continue;
      }

      // Parse job lines - New format: JobName.ID (Client) - Date, Time - Status - Size
      const jobMatch = line.match(/^(.+?)\s+\((.+?)\)\s+-\s+(\d{2}\/\d{2}\/\d{4}),\s+(\d{2}:\d{2})\s+-\s+(.+?)\s+-\s+(.+)$/);
      
      if (jobMatch && currentSection) {
        const [, jobNameWithId, client, date, time, status, sizeStr] = jobMatch;
        
        // Extract job name and ID
        const jobParts = jobNameWithId.split('.');
        const jobName = jobParts.slice(0, -1).join('.') || jobNameWithId;
        const jobId = jobParts[jobParts.length - 1] || '';
        
        const job: BaculaJob = {
          name: jobName.trim(),
          status: status.trim(),
          client: client.trim(),
          datetime: `${date}, ${time}`,
          bytes: parseSizeString(sizeStr.trim()),
          files: 0,
          jobId: jobId
        };

        if (currentSection === 'success') {
          data.successJobs_list.push(job);
        } else if (currentSection === 'error') {
          data.errorJobs_list.push(job);
        } else if (currentSection === 'canceled') {
          data.canceledJobs_list.push(job);
        }
        
        data.totalBytes += job.bytes;
      }
    }

    // Calculate totals
    data.totalJobs = data.successJobs + data.errorJobs + data.canceledJobs_list.length;
    data.affectedClients = new Set([...data.errorJobs_list, ...data.successJobs_list, ...data.canceledJobs_list].map(j => j.client)).size;
    
    // If no jobs were parsed, try fallback for raw content
    if (data.totalJobs === 0) {
      data.fallbackData = true;
    }

    return data;
  };

  const parseSizeString = (sizeStr: string): number => {
    const cleaned = sizeStr.replace(/[,.]/g, '').toLowerCase();
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    const multipliers = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024,
      'tb': 1024 * 1024 * 1024 * 1024
    };
    
    return Math.round(value * (multipliers[unit as keyof typeof multipliers] || 1));
  };

  const parseBytes = (bytesStr: string): number => {
    const cleaned = bytesStr.replace(/[,.]/g, '');
    return parseInt(cleaned) || 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('ok') || statusLower.includes('success') || statusLower.includes('concluído') || statusLower.includes('sucesso')) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Sucesso
        </Badge>
      );
    }
    
    if (statusLower.includes('error') || statusLower.includes('failed') || statusLower.includes('erro')) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          Erro
        </Badge>
      );
    }
    
    if (statusLower.includes('warning') || statusLower.includes('aviso')) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Aviso
        </Badge>
      );
    }
    
    if (statusLower.includes('canceled') || statusLower.includes('cancelado')) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200">
          <Clock className="mr-1 h-3 w-3" />
          Cancelado
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const BaculaJobsTable = ({ jobs, sectionType }: { jobs: BaculaJob[]; sectionType: 'success' | 'error' | 'canceled' }) => {
    const sectionColors = {
      success: "bg-green-50 dark:bg-green-950",
      error: "bg-red-50 dark:bg-red-950",
      canceled: "bg-orange-50 dark:bg-orange-950"
    };

    return (
      <div className={`rounded-lg border ${sectionColors[sectionType]} p-4`}>
        <Table>
          <TableBody>
            {jobs.map((job, jobIndex) => (
              <React.Fragment key={jobIndex}>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium w-32 py-2">Status</TableCell>
                  <TableCell className="py-2">{getStatusBadge(job.status)}</TableCell>
                </TableRow>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium py-2">Job Name</TableCell>
                  <TableCell className="font-bold text-lg py-2 text-foreground">{job.name}</TableCell>
                </TableRow>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium py-2">Cliente</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{job.client}</span>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium py-2">Data/Hora</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold">{job.datetime}</span>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className={jobIndex < jobs.length - 1 ? "border-b-2 border-dashed border-gray-400" : "border-b-0"}>
                  <TableCell className="font-medium py-2">Tamanho</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">{formatBytes(job.bytes)}</span>
                    </div>
                  </TableCell>
                </TableRow>
                {jobIndex < jobs.length - 1 && (
                  <TableRow>
                    <TableCell colSpan={2} className="p-0">
                      <div className="my-4 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const JobCard = ({ job, sectionType }: { job: BaculaJob; sectionType: 'success' | 'error' | 'canceled' }) => {
    const cardStyles = {
      success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
      error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800", 
      canceled: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
    };

    const statusLabels = {
      success: "REALIZADO COM SUCESSO",
      error: "FALHOU",
      canceled: "CANCELADO"
    };

    const statusColors = {
      success: "text-green-700 dark:text-green-300",
      error: "text-red-700 dark:text-red-300",
      canceled: "text-orange-700 dark:text-orange-300"
    };

    return (
      <Card className={`${cardStyles[sectionType]} border-2 mb-6 transition-all hover:shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Badge className={`px-3 py-1 text-sm font-semibold ${statusColors[sectionType]}`}>
              {sectionType === 'success' ? '✅' : sectionType === 'error' ? '❌' : '⚠️'} {statusLabels[sectionType]}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
                📋 {job.name}
              </h3>
              {job.jobId && (
                <p className="text-sm text-muted-foreground">
                  🆔 Job ID: {job.jobId}
                </p>
              )}
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">Cliente:</span>
                  <span className="text-base font-semibold text-foreground">{job.client}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">Data/Hora:</span>
                  <span className="text-base font-semibold text-foreground">{job.datetime}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <HardDrive className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">Tamanho:</span>
                  <span className="text-base font-semibold text-foreground">{formatBytes(job.bytes)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const data = parseBaculaReport(messageContent);

  if (!data) {
    return (
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
          {messageContent}
        </p>
      </div>
    );
  }

  const successRate = data.totalJobs > 0 ? (data.successJobs / data.totalJobs) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Relatório Diário Bacula - {data.date}</h3>
          {data.fallbackData && (
            <Badge variant="outline" className="bg-orange-600 text-white border-orange-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Dados Fallback
            </Badge>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex items-center gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Tabela
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('summary')}
        >
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Resumo Executivo
            </div>
            {expandedSections.has('summary') ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </CardTitle>
        </CardHeader>
        {expandedSections.has('summary') && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Total de Jobs</span>
                </div>
                <div className="text-2xl font-bold text-white">{data.totalJobs}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Sucessos</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{data.successJobs}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-300">Erros</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{data.errorJobs}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Clientes</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">{data.affectedClients}</div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Taxa de Sucesso</span>
                  <span className="text-white font-medium">{successRate.toFixed(1)}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-gray-300">Volume Total</span>
                  </div>
                  <div className="text-lg font-semibold text-cyan-400">{formatBytes(data.totalBytes)}</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">Arquivos Processados</span>
                  </div>
                  <div className="text-lg font-semibold text-yellow-400">{formatNumber(data.totalFiles)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Jobs com Erro */}
      {data.errorJobs_list.length > 0 && (
        <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-red-700 dark:text-red-300">
                <XCircle className="mr-2 h-5 w-5" />
                Jobs com Erro ({data.errorJobs_list.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('error')}
                className="text-red-600 hover:text-red-700"
              >
                {expandedSections.has('error') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.has('error') && (
            <CardContent className="pt-0">
              {viewMode === 'cards' ? (
                <div className="space-y-0">
                  {data.errorJobs_list.map((job, index) => (
                    <JobCard key={index} job={job} sectionType="error" />
                  ))}
                </div>
              ) : (
                <BaculaJobsTable jobs={data.errorJobs_list} sectionType="error" />
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Jobs com Sucesso */}
      {data.successJobs_list.length > 0 && (
        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-green-700 dark:text-green-300">
                <CheckCircle className="mr-2 h-5 w-5" />
                Jobs com Sucesso ({data.successJobs_list.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('success')}
                className="text-green-600 hover:text-green-700"
              >
                {expandedSections.has('success') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.has('success') && (
            <CardContent className="pt-0">
              {viewMode === 'cards' ? (
                <div className="space-y-0">
                  {data.successJobs_list.map((job, index) => (
                    <JobCard key={index} job={job} sectionType="success" />
                  ))}
                </div>
              ) : (
                <BaculaJobsTable jobs={data.successJobs_list} sectionType="success" />
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Jobs Cancelados */}
      {data.canceledJobs_list.length > 0 && (
        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
                <Clock className="mr-2 h-5 w-5" />
                Jobs Cancelados ({data.canceledJobs_list.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('canceled')}
                className="text-orange-600 hover:text-orange-700"
              >
                {expandedSections.has('canceled') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.has('canceled') && (
            <CardContent className="pt-0">
              {viewMode === 'cards' ? (
                <div className="space-y-0">
                  {data.canceledJobs_list.map((job, index) => (
                    <JobCard key={index} job={job} sectionType="canceled" />
                  ))}
                </div>
              ) : (
                <BaculaJobsTable jobs={data.canceledJobs_list} sectionType="canceled" />
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Critical Analysis */}
      {(data.recurringFailures || data.errorJobs > 0) && (
        <Card className="bg-red-900/20 border-red-800">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('analysis')}
          >
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                Análise Crítica
              </div>
              {expandedSections.has('analysis') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('analysis') && (
            <CardContent>
              <div className="space-y-3">
                {data.errorJobs > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-300 mb-1">
                        Erros Detectados
                      </h4>
                      <p className="text-sm text-red-200">
                        {data.errorJobs} job(s) falharam na execução. 
                        Verifique os logs detalhados e conectividade com os clientes afetados.
                      </p>
                    </div>
                  </div>
                )}
                
                {data.recurringFailures && (
                  <div className="flex items-start gap-3 p-3 bg-orange-900/30 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-300 mb-1">
                        Falhas Recorrentes
                      </h4>
                      <p className="text-sm text-orange-200">
                        Padrão de falhas repetidas detectado. 
                        Recomenda-se investigação imediata dos sistemas afetados.
                      </p>
                    </div>
                  </div>
                )}
                
                {successRate < 80 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-300 mb-1">
                        Taxa de Sucesso Baixa
                      </h4>
                      <p className="text-sm text-yellow-200">
                        Taxa de sucesso de {successRate.toFixed(1)}% está abaixo do esperado (&gt;90%). 
                        Revisar configurações e recursos do sistema.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};