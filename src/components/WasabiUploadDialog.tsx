import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
interface WasabiUploadDialogProps {
  selectedBucket: string;
  onUpload: (files: FileList, bucketName: string) => void;
  isUploading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  bucketName?: string;
  folder?: string;
}
export const WasabiUploadDialog = ({
  selectedBucket,
  onUpload,
  isUploading = false,
  open,
  onOpenChange,
  bucketName,
  folder = ''
}: WasabiUploadDialogProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or uncontrolled state based on props
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Use bucketName prop if provided, otherwise fall back to selectedBucket
  const targetBucket = bucketName || selectedBucket;
  const handleUpload = () => {
    if (selectedFiles && selectedFiles.length > 0 && targetBucket) {
      onUpload(selectedFiles, targetBucket);
      setSelectedFiles(null);
      setIsOpen(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Upload de Arquivos</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enviar arquivos para o bucket: <strong>{targetBucket}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Selecionar Arquivos</Label>
            <Input id="files" type="file" multiple onChange={e => setSelectedFiles(e.target.files)} className="cursor-pointer" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}>
              {isUploading ? 'Enviando...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};