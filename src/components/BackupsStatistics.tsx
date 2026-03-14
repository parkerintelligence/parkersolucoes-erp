
import React from 'react';
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground">{totalBackups}</p>
              <p className="text-[11px] text-muted-foreground">Total de Backups</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground">{recentBackups}</p>
              <p className="text-[11px] text-muted-foreground">Recentes (7 dias)</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground">{formatFileSize(totalSize)}</p>
              <p className="text-[11px] text-muted-foreground">Tamanho Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground">{totalFiles}</p>
              <p className="text-[11px] text-muted-foreground">Total de Arquivos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupsStatistics;
