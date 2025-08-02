
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, CheckCircle, HardDrive, Calendar } from 'lucide-react';
import { formatFileSize } from '@/utils/ftpUtils';

interface BackupsStatisticsProps {
  totalBackups: number;
  recentBackups: number;
  totalSize: number;
  totalFiles: number;
}

const BackupsStatistics: React.FC<BackupsStatisticsProps> = ({
  totalBackups,
  recentBackups,
  totalSize,
  totalFiles
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Database className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-white">{totalBackups}</p>
              <p className="text-xs md:text-sm text-gray-400">Total de Backups</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-white">{recentBackups}</p>
              <p className="text-xs md:text-sm text-gray-400">Recentes (7 dias)</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <HardDrive className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-white">
                {formatFileSize(totalSize)}
              </p>
              <p className="text-xs md:text-sm text-gray-400">Tamanho Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-white">
                {totalFiles}
              </p>
              <p className="text-xs md:text-sm text-gray-400">Total de Arquivos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupsStatistics;
