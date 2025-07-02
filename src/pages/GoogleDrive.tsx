import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { GoogleDriveUploadDialog } from '@/components/GoogleDriveUploadDialog';
import { GoogleDriveCreateFolderDialog } from '@/components/GoogleDriveCreateFolderDialog';
import { 
  Cloud, 
  Upload, 
  FolderPlus, 
  Search, 
  Download, 
  Trash2, 
  Folder, 
  File,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';

const GoogleDrive = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    files,
    isLoading,
    currentPath,
    navigateToFolder,
    navigateBack,
    downloadFile,
    deleteFile,
    createFolder,
    uploadFile,
    searchFiles,
    isConnected
  } = useGoogleDrive();

  const filteredFiles = files?.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getFileIcon = (file: any) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Drive</h1>
          <p className="text-muted-foreground">
            Gerencie seus arquivos no Google Drive
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Conexão necessária
            </CardTitle>
            <CardDescription>
              Para usar o Google Drive, você precisa configurar a integração no painel de administração e autorizar sua conta Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Passos necessários:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Configure o Client ID e Secret no painel de administração</li>
                <li>Clique em "Autorizar Conta Google" para conectar sua conta</li>
                <li>Complete a autorização no Google</li>
              </ol>
            </div>
            <Button asChild>
              <a href="/admin">Ir para Administração</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Drive</h1>
          <p className="text-muted-foreground">
            Gerencie seus arquivos no Google Drive
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <Cloud className="h-3 w-3" />
          Conectado
        </Badge>
      </div>

      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigateToFolder('root')}>
                    Meu Drive
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentPath.map((folder, index) => (
                  <BreadcrumbItem key={folder.id}>
                    <BreadcrumbLink 
                      onClick={() => navigateToFolder(folder.id)}
                      className={index === currentPath.length - 1 ? "font-medium" : ""}
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            
            {currentPath.length > 0 && (
              <Button variant="outline" size="sm" onClick={navigateBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCreateFolderDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Pasta
              </Button>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos e Pastas</CardTitle>
          <CardDescription>
            {filteredFiles.length} item(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Cloud className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Carregando arquivos...</p>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Tamanho</th>
                    <th className="text-left py-2">Modificado</th>
                    <th className="text-right py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">
                        <div 
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            if (file.mimeType === 'application/vnd.google-apps.folder') {
                              navigateToFolder(file.id);
                            }
                          }}
                        >
                          {getFileIcon(file)}
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {file.mimeType === 'application/vnd.google-apps.folder' 
                          ? '-' 
                          : formatFileSize(file.size || 0)
                        }
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(file.modifiedTime)}
                      </td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {file.mimeType !== 'application/vnd.google-apps.folder' && (
                              <DropdownMenuItem onClick={() => downloadFile(file.id, file.name)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => deleteFile(file.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <GoogleDriveUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={uploadFile}
        currentFolderId={currentPath[currentPath.length - 1]?.id || 'root'}
      />
      
      <GoogleDriveCreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        onCreateFolder={createFolder}
        currentFolderId={currentPath[currentPath.length - 1]?.id || 'root'}
      />
    </div>
  );
};

export default GoogleDrive;