import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface FileUpload {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface GoogleDriveUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, folderId: string) => Promise<any>;
  currentFolderId: string;
}

export const GoogleDriveUploadDialog = ({ 
  open, 
  onOpenChange, 
  onUpload, 
  currentFolderId 
}: GoogleDriveUploadDialogProps) => {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (uploads.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];
      if (upload.status !== 'pending') continue;

      try {
        // Update status to uploading
        setUploads(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'uploading', progress: 0 } : u
        ));

        // Simulate progress (since we can't track real progress with base64 upload)
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map((u, idx) => 
            idx === i && u.status === 'uploading' 
              ? { ...u, progress: Math.min(u.progress + 10, 90) } 
              : u
          ));
        }, 200);

        await onUpload(upload.file, currentFolderId);

        clearInterval(progressInterval);

        // Update status to success
        setUploads(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'success', progress: 100 } : u
        ));

      } catch (error) {
        // Update status to error
        setUploads(prev => prev.map((u, idx) => 
          idx === i ? { 
            ...u, 
            status: 'error', 
            progress: 0, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          } : u
        ));
      }
    }

    setIsUploading(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploads([]);
      onOpenChange(false);
    }
  };

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUpload = uploads.length > 0 && uploads.some(u => u.status === 'pending');
  const allCompleted = uploads.length > 0 && uploads.every(u => u.status === 'success' || u.status === 'error');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload para Google Drive</DialogTitle>
          <DialogDescription>
            Selecione os arquivos que deseja enviar para o Google Drive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive 
                  ? "Solte os arquivos aqui..." 
                  : "Arraste arquivos aqui ou clique para selecionar"
                }
              </p>
            </div>
          </div>

          {/* File List */}
          {uploads.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded">
                  {getStatusIcon(upload.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </p>
                    
                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="h-1 mt-1" />
                    )}
                    
                    {upload.status === 'error' && upload.error && (
                      <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                    )}
                  </div>

                  {!isUploading && upload.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {allCompleted ? 'Fechar' : 'Cancelar'}
            </Button>
            
            {canUpload && (
              <Button onClick={startUpload} disabled={isUploading}>
                {isUploading ? 'Enviando...' : 'Iniciar Upload'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};