
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useFtp } from '@/hooks/useFtp';
import { FtpConnectionStatus } from '@/components/FtpConnectionStatus';
import { FtpFileExplorer } from '@/components/FtpFileExplorer';
import { FtpToolbar } from '@/components/FtpToolbar';
import { FtpDirectoryNavigator } from '@/components/FtpDirectoryNavigator';
import { FtpUploadDialog } from '@/components/FtpUploadDialog';
import { 
  Activity, 
  Server, 
  Database, 
  RefreshCw, 
  Settings, 
  HardDrive,
  Folder,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  Download
} from 'lucide-react';

const Backups = () => {
  const { data: integrations } = useIntegrations();
  const ftpIntegration = integrations?.find(integration => integration.type === 'ftp');
  
  const {
    connectionStatus,
    currentPath,
    files,
    isLoading,
    error,
    navigateToPath,
    refresh,
    createFolder,
    deleteFile,
    downloadFile,
    uploadFile
  } = useFtp();

  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  if (!ftpIntegration) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <HardDrive className="h-8 w-8" />
                Backups FTP
              </h1>
              <p className="text-blue-600">Gerencie seus backups via FTP</p>
            </div>
          </div>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure uma integração FTP no painel administrativo para começar a gerenciar seus backups.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Sort files by modification date (oldest first)
  const sortedFiles = files?.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  }) || [];

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    refresh();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <HardDrive className="h-8 w-8" />
              Backups FTP
            </h1>
            <p className="text-blue-600">Gerencie seus backups via FTP</p>
          </div>
          <Button onClick={refresh} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <FtpConnectionStatus 
          status={connectionStatus} 
          serverInfo={ftpIntegration} 
        />

        {connectionStatus === 'connected' && (
          <Tabs defaultValue="files" className="space-y-6">
            <TabsList>
              <TabsTrigger value="files">Arquivos</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Explorador de Arquivos</CardTitle>
                      <CardDescription>
                        Navegue pelos arquivos do servidor FTP
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowUploadDialog(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FtpDirectoryNavigator 
                      currentPath={currentPath}
                      onNavigate={navigateToPath}
                    />

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nome da nova pasta"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button 
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim()}
                        size="sm"
                        variant="outline"
                      >
                        <Folder className="h-4 w-4 mr-1" />
                        Criar Pasta
                      </Button>
                    </div>

                    <FtpToolbar 
                      currentPath={currentPath}
                      onRefresh={refresh}
                      onNavigateUp={() => {
                        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
                        navigateToPath(parentPath);
                      }}
                    />

                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <FtpFileExplorer 
                      files={sortedFiles}
                      isLoading={isLoading}
                      onNavigate={navigateToPath}
                      onDownload={downloadFile}
                      onDelete={deleteFile}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-900">
                          {sortedFiles?.filter(f => f.type === 'file').length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Arquivos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Folder className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-900">
                          {sortedFiles?.filter(f => f.type === 'directory').length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Pastas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Database className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-900">
                          {sortedFiles?.reduce((total, file) => total + (file.size || 0), 0) || 0}
                        </p>
                        <p className="text-sm text-gray-600">Bytes (Pasta Atual)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <FtpUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUploadComplete={handleUploadComplete}
          currentPath={currentPath}
        />
      </div>
    </Layout>
  );
};

export default Backups;
