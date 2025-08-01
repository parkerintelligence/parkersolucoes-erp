
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, Home } from 'lucide-react';

interface BackupsNavigationProps {
  directories: any[];
  currentPath: string;
  navigateToDirectory: (path: string) => void;
}

const BackupsNavigation: React.FC<BackupsNavigationProps> = ({
  directories,
  currentPath,
  navigateToDirectory
}) => {
  if (directories.length === 0) return null;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Navegação de Diretórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateToDirectory('/')} 
              disabled={currentPath === '/'} 
              className="border-gray-600 bg-gray-900 hover:bg-gray-800 text-gray-50"
            >
              <Home className="h-4 w-4 mr-1" />
              Raiz
            </Button>
          </div>
          
          <div className="flex-1 max-w-md">
            <Select onValueChange={value => navigateToDirectory(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecionar diretório" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {directories.map(dir => (
                  <SelectItem key={dir.path} value={dir.path} className="text-gray-200 hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-400" />
                      {dir.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-gray-400">
            Caminho atual: <span className="text-blue-400">{currentPath}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupsNavigation;
