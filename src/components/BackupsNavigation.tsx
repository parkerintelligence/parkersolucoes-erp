
import React from 'react';
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
    <div className="flex items-center gap-3 p-2.5 bg-muted/30 border border-border rounded-lg">
      <Folder className="h-3.5 w-3.5 text-muted-foreground" />
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigateToDirectory('/')} 
        disabled={currentPath === '/'} 
        className="h-7 px-2.5 text-xs"
      >
        <Home className="h-3 w-3 mr-1" />
        Raiz
      </Button>
      
      <Select onValueChange={value => navigateToDirectory(value)}>
        <SelectTrigger className="h-7 w-48 text-xs bg-card border-border">
          <SelectValue placeholder="Selecionar diretório" />
        </SelectTrigger>
        <SelectContent>
          {directories.map(dir => (
            <SelectItem key={dir.path} value={dir.path}>
              <div className="flex items-center gap-2">
                <Folder className="h-3 w-3 text-primary" />
                {dir.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-xs text-muted-foreground ml-auto">
        <span className="text-primary">{currentPath}</span>
      </div>
    </div>
  );
};

export default BackupsNavigation;
