
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FtpOldFoldersDialog from '@/components/FtpOldFoldersDialog';

interface BackupsHeaderProps {
  integrationName: string;
  baseUrl: string;
  currentPath: string;
  availability: 'checking' | 'available' | 'unavailable';
  files: any[];
  uploadingFile: File | null;
  uploadFile: any;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  goToParentDirectory: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackupsHeader: React.FC<BackupsHeaderProps> = ({
  integrationName,
  baseUrl,
  currentPath,
  availability,
  files,
  uploadingFile,
  uploadFile,
  isDialogOpen,
  setIsDialogOpen,
  goToParentDirectory,
  onFileUpload
}) => {
  const getAvailabilityBadge = () => {
    switch (availability) {
      case 'checking':
        return <span className="bg-yellow-900/20 text-yellow-400 border-yellow-600 px-2 py-1 rounded text-xs">Verificando...</span>;
      case 'available':
        return <span className="bg-green-900/20 text-green-400 border-green-600 px-2 py-1 rounded text-xs">Disponível</span>;
      case 'unavailable':
        return <span className="bg-red-900/20 text-red-400 border-red-600 px-2 py-1 rounded text-xs">Indisponível</span>;
      default:
        return <span className="bg-gray-900/20 text-gray-400 border-gray-600 px-2 py-1 rounded text-xs">Desconhecido</span>;
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white">Backups - {integrationName}</h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-gray-400">Servidor: {baseUrl}</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Disponibilidade:</span>
            {getAvailabilityBadge()}
          </div>
        </div>
        <p className="text-gray-400">Diretório: {currentPath}</p>
      </div>
      <div className="flex gap-2">
        <FtpOldFoldersDialog files={files} />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Upload Backup
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Upload de Backup</DialogTitle>
              <DialogDescription className="text-gray-400">
                Selecione um arquivo de backup para enviar ao servidor FTP.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="backup-file" className="text-gray-200">Arquivo de Backup</Label>
                <Input 
                  id="backup-file" 
                  type="file" 
                  accept=".sql,.zip,.tar,.gz,.tar.gz" 
                  onChange={onFileUpload} 
                  disabled={uploadFile.isPending} 
                  className="bg-gray-700 border-gray-600 text-white" 
                />
              </div>
              {uploadingFile && (
                <div className="text-sm text-gray-400">
                  Enviando: {uploadingFile.name}...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {currentPath !== '/' && (
          <Button variant="outline" onClick={goToParentDirectory} className="border-gray-600 text-gray-200 hover:bg-gray-700">
            ← Voltar
          </Button>
        )}
      </div>
    </div>
  );
};

export default BackupsHeader;
