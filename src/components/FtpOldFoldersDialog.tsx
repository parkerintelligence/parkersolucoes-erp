
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Folder, AlertTriangle } from 'lucide-react';
import { RealFtpFile } from '@/services/realFtpService';

interface FtpOldFoldersDialogProps {
  files: RealFtpFile[];
}

const FtpOldFoldersDialog: React.FC<FtpOldFoldersDialogProps> = ({ files }) => {
  const getOldFolders = () => {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    
    return files.filter(file => 
      file.isDirectory && 
      new Date(file.lastModified) < fortyEightHoursAgo
    );
  };

  const oldFolders = getOldFolders();

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d atrás`;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30">
          <Clock className="mr-2 h-4 w-4" />
          Pastas Antigas ({oldFolders.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Pastas com +48h sem Modificação
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Pastas que não foram modificadas há mais de 48 horas
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-3">
          {oldFolders.length === 0 ? (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-6 text-center">
                <Folder className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p className="text-gray-300">Todas as pastas foram modificadas recentemente!</p>
              </CardContent>
            </Card>
          ) : (
            oldFolders.map((folder) => (
              <Card key={folder.name} className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">
                      {getTimeAgo(new Date(folder.lastModified))}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Última modificação:</span>
                      <p className="text-gray-200">{new Date(folder.lastModified).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Permissões:</span>
                      <p className="text-gray-200">{folder.permissions || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FtpOldFoldersDialog;
