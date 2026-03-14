
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Plus, ArrowLeft } from 'lucide-react';
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
        return <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">Verificando...</Badge>;
      case 'available':
        return <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">Disponível</Badge>;
      case 'unavailable':
        return <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Indisponível</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Desconhecido</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Backups - {integrationName}
        </h1>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-muted-foreground">Servidor: {baseUrl}</p>
          {getAvailabilityBadge()}
          <span className="text-xs text-primary">{currentPath}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <FtpOldFoldersDialog files={files} />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Upload Backup
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Upload de Backup</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Selecione um arquivo de backup para enviar ao servidor FTP.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-3">
              <div className="grid gap-1.5">
                <Label htmlFor="backup-file" className="text-foreground text-xs">Arquivo de Backup</Label>
                <Input 
                  id="backup-file" 
                  type="file" 
                  accept=".sql,.zip,.tar,.gz,.tar.gz" 
                  onChange={onFileUpload} 
                  disabled={uploadFile.isPending} 
                  className="bg-background border-border text-xs" 
                />
              </div>
              {uploadingFile && (
                <p className="text-xs text-muted-foreground">Enviando: {uploadingFile.name}...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {currentPath !== '/' && (
          <Button variant="outline" size="sm" onClick={goToParentDirectory} className="h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
};

export default BackupsHeader;
