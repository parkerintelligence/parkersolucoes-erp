import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Loader2 } from 'lucide-react';

interface GoogleDriveCreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (name: string, parentId: string) => Promise<any>;
  currentFolderId: string;
}

export const GoogleDriveCreateFolderDialog = ({ 
  open, 
  onOpenChange, 
  onCreateFolder, 
  currentFolderId 
}: GoogleDriveCreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateFolder(folderName.trim(), currentFolderId);
      setFolderName('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFolderName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Nova Pasta
          </DialogTitle>
          <DialogDescription>
            Crie uma nova pasta no Google Drive
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Nome da pasta</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Digite o nome da pasta"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="flex justify-between gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Pasta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};