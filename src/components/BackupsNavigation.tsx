
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
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
      <Folder className="h-4 w-4 text-slate-400" />
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigateToDirectory('/')} 
        disabled={currentPath === '/'} 
        className="h-8 px-3 text-sm border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
      >
        <Home className="h-3 w-3 mr-1" />
        Raiz
      </Button>
      
      <Select onValueChange={value => navigateToDirectory(value)}>
        <SelectTrigger className="h-8 w-48 text-sm bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Selecionar diretório" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {directories.map(dir => (
            <SelectItem key={dir.path} value={dir.path} className="text-white hover:bg-slate-600">
              <div className="flex items-center gap-2">
                <Folder className="h-3 w-3 text-blue-400" />
                {dir.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-sm text-slate-400 ml-auto">
        <span className="text-blue-400">{currentPath}</span>
      </div>
    </div>
  );
};

export default BackupsNavigation;
