
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive, CheckCircle, AlertTriangle, Server, RefreshCw } from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpFileManager } from '@/components/FtpFileManager';
import { FtpConnectionStatus } from '@/components/FtpConnectionStatus';
import { isToday } from 'date-fns';

const Backups = () => {
  const { files, isLoadingFiles, ftpIntegration, refetchFiles, ftpIntegrations } = useFtp();

  const successCount = files.filter(file => isToday(file.lastModified)).length;
  const outdatedCount = files.filter(file => {
    const daysDiff = Math.floor((Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 2;
  }).length;

  return (
    <Layout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <HardDrive className="h-8 w-8 text-blue-600" />
              </div>
              Gerenciamento de Backups FTP
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie arquivos de backup diretamente no servidor FTP configurado
            </p>
          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            onClick={() => refetchFiles()}
            disabled={isLoadingFiles}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>

        {/* Connection Status */}
        <FtpConnectionStatus />

        {/* Summary Cards */}
        {ftpIntegration && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{files.length}</p>
                    <p className="text-sm text-gray-600">Total de Arquivos</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{successCount}</p>
                    <p className="text-sm text-gray-600">Backups Recentes</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{outdatedCount}</p>
                    <p className="text-sm text-gray-600">Backups Antigos</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{ftpIntegrations.length}</p>
                    <p className="text-sm text-gray-600">Servidores FTP</p>
                  </div>
                  <Server className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FTP File Manager */}
        <FtpFileManager className="shadow-sm" />
      </div>
    </Layout>
  );
};

export default Backups;
