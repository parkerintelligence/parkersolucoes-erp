
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, HardDrive, Clock, Database } from 'lucide-react';

interface FtpStatsPopoverProps {
  totalFiles: number;
  recentFiles: number;
  totalSize: string;
}

export const FtpStatsPopover = ({ totalFiles, recentFiles, totalSize }: FtpStatsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estatísticas FTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">Total de Arquivos</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{totalFiles}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium">Arquivos Hoje</span>
              </div>
              <span className="text-sm font-bold text-green-600">{recentFiles}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium">Tamanho Total</span>
              </div>
              <span className="text-xs font-bold text-purple-600">{totalSize}</span>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
