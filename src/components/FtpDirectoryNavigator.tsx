
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Folder, Home, ArrowLeft } from 'lucide-react';

interface FtpDirectoryNavigatorProps {
  currentPath: string;
  directories: Array<{ name: string; path: string }>;
  onNavigate: (path: string) => void;
  onGoBack: () => void;
}

export const FtpDirectoryNavigator = ({ 
  currentPath, 
  directories, 
  onNavigate, 
  onGoBack 
}: FtpDirectoryNavigatorProps) => {
  const getPathBreadcrumbs = () => {
    if (currentPath === '/') return [{ name: 'Raiz', path: '/' }];
    
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Raiz', path: '/' }];
    
    let buildPath = '';
    parts.forEach(part => {
      buildPath += `/${part}`;
      breadcrumbs.push({ name: part, path: buildPath });
    });
    
    return breadcrumbs;
  };

  const handleDirectoryChange = (directoryPath: string) => {
    if (directoryPath && directoryPath !== currentPath) {
      onNavigate(directoryPath);
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 border-b">
      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1"
          disabled={currentPath === '/'}
        >
          <Home className="h-4 w-4" />
          Raiz
        </Button>
        
        {currentPath !== '/' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGoBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
      </div>

      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 text-sm text-gray-600 bg-white px-3 py-1 rounded border">
        <Folder className="h-4 w-4" />
        <span className="font-medium">Caminho:</span>
        {getPathBreadcrumbs().map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">/</span>}
            <button
              onClick={() => onNavigate(crumb.path)}
              className="hover:text-blue-600 hover:underline px-1 py-0.5 rounded"
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Directory selector */}
      {directories.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Navegar para:</span>
          <Select onValueChange={handleDirectoryChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar pasta" />
            </SelectTrigger>
            <SelectContent>
              {directories.map((dir) => (
                <SelectItem key={dir.path} value={dir.path}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-500" />
                    {dir.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
