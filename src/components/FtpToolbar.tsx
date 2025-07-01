
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  Home, 
  ArrowLeft,
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { useFtp } from '@/hooks/useFtp';
import { FtpUploadDialog } from './FtpUploadDialog';

interface FtpToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
}

export const FtpToolbar = ({ 
  searchTerm, 
  setSearchTerm, 
  currentPath, 
  setCurrentPath, 
  selectedFiles, 
  setSelectedFiles 
}: FtpToolbarProps) => {
  const { downloadFile, deleteFile, refetchFiles } = useFtp();

  const handleDownloadSelected = async () => {
    for (const fileName of selectedFiles) {
      try {
        await downloadFile.mutateAsync(fileName);
      } catch (error) {
        console.error('Erro ao baixar arquivo:', fileName, error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    for (const fileName of selectedFiles) {
      try {
        await deleteFile.mutateAsync(fileName);
      } catch (error) {
        console.error('Erro ao excluir arquivo:', fileName, error);
      }
    }
    setSelectedFiles([]);
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
    refetchFiles();
  };

  const getPathBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPathBuild = '';
    parts.forEach(part => {
      currentPathBuild += `/${part}`;
      breadcrumbs.push({ name: part, path: currentPathBuild });
    });
    
    return breadcrumbs;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPath('/')}
          className="flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Início
        </Button>
        {currentPath !== '/' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const parts = currentPath.split('/').filter(Boolean);
              parts.pop();
              navigateToPath(parts.length ? `/${parts.join('/')}` : '/');
            }}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
        {getPathBreadcrumbs().map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">/</span>}
            <button
              onClick={() => navigateToPath(crumb.path)}
              className="hover:text-blue-600 hover:underline px-1 py-0.5 rounded"
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <FtpUploadDialog />
        
        {selectedFiles.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSelected}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Baixar ({selectedFiles.length})
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir ({selectedFiles.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedFiles.length} arquivo(s) selecionado(s)?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                    Excluir Arquivos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
};
