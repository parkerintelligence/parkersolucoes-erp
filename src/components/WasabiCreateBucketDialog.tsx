
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus } from 'lucide-react';

interface WasabiCreateBucketDialogProps {
  onCreateBucket: (bucketName: string) => void;
  isCreating?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const WasabiCreateBucketDialog = ({ onCreateBucket, isCreating = false, open, onOpenChange }: WasabiCreateBucketDialogProps) => {
  const [bucketName, setBucketName] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or uncontrolled state based on props
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleCreate = () => {
    if (bucketName.trim()) {
      onCreateBucket(bucketName.trim().toLowerCase());
      setBucketName('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          Criar Bucket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Bucket</DialogTitle>
          <DialogDescription>
            Digite o nome do novo bucket. O nome deve ser único e em minúsculas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bucketName">Nome do Bucket</Label>
            <Input
              id="bucketName"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="meu-novo-bucket"
              className="lowercase"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!bucketName.trim() || isCreating}
            >
              {isCreating ? 'Criando...' : 'Criar Bucket'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
