import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useRealFtp } from '@/hooks/useRealFtp';
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
  Download,
  Calendar,
  Clock,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BackupAlertDialog } from '@/components/BackupAlertDialog';
import { useSystemSetting } from '@/hooks/useSystemSettings';

const Backups = () => {
  const { data: integrations } = useIntegrations();
  const { data: alertHoursSetting } = useSystemSetting('ftp_backup_alert_hours', '48');
  const ftpIntegration = integrations?.find(integration => integration.type === 'ftp');
  
  // Obter o valor de horas da configuração
  const alertHours = alertHoursSetting ? parseInt(alertHoursSetting.setting_value) : 48;
  
  const {
    files,
    isLoadingFiles,
    filesError,
    ftpIntegration: activeFtpIntegration,
    currentPath,
    directories,
    navigateToDirectory,
    goToParentDirectory,
    downloadFile,
    uploadFile,
    deleteFile,
    refetchFiles
  } = useRealFtp();

  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showWhatsAppAlert, setShowWhatsAppAlert] = useState(false);
  const [showGLPIAlert, setShowGLPIAlert] = useState(false);

  if (!ftpIntegration) {
    return (
      <div className="space-y-6">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Configure uma integração FTP no painel administrativo para começar a gerenciar seus backups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Sort files by modification date (oldest first) and add color coding logic
  const sortedFiles = files?.sort((a, b) => {
    if (!a.lastModified || !b.lastModified) return 0;
    return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
  }) || [];

  // Function to get row background color based on file age (using configurable parameter)
  const getRowBackgroundColor = (lastModified: Date) => {
    const hoursDiff = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60));
    if (hoursDiff > alertHours) {
      return 'bg-red-50 hover:bg-red-100 border-red-200'; // Red for old files
    }
    return 'bg-green-50 hover:bg-green-100 border-green-200'; // Green for recent files
  };

  // Function to get age badge color (using configurable parameter)
  const getAgeBadgeColor = (lastModified: Date) => {
    const hoursDiff = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60));
    if (hoursDiff > alertHours) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    refetchFiles();
  };

  const connectionStatus = activeFtpIntegration ? 'connected' : 'disconnected';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowWhatsAppAlert(true)} 
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setShowGLPIAlert(true)} 
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button onClick={() => refetchFiles()} disabled={isLoadingFiles} className="bg-gray-600 hover:bg-gray-700">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus === 'connected' && ftpIntegration && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Conectado</span>
              </div>
              <Badge variant="outline">
                <Server className="h-3 w-3 mr-1" />
                {ftpIntegration.base_url}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {/* Directory Navigation */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Folder className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Caminho atual: {currentPath}</span>
                    {currentPath !== '/' && (
                      <Button 
                        onClick={goToParentDirectory}
                        size="sm"
                        variant="outline"
                      >
                        Voltar
                      </Button>
                    )}
                  </div>

                  {filesError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{filesError.message}</AlertDescription>
                    </Alert>
                  )}

                  {/* Files List */}
                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2">Carregando arquivos...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${getRowBackgroundColor(file.lastModified)}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {file.isDirectory ? (
                              <Folder className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-gray-500" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{file.name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>
                                  {file.isDirectory ? 'Pasta' : `${Math.round(file.size / 1024)} KB`}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {format(file.lastModified, 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {file.isDirectory ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigateToDirectory(`${currentPath}/${file.name}`.replace('//', '/'))}
                              >
                                Abrir
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile.mutate(file.name)}
                                disabled={downloadFile.isPending}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                        {sortedFiles?.filter(f => !f.isDirectory).length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Arquivos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs de Alerta */}
      <BackupAlertDialog
        open={showWhatsAppAlert}
        onOpenChange={setShowWhatsAppAlert}
        files={sortedFiles}
        type="whatsapp"
      />
      
      <BackupAlertDialog
        open={showGLPIAlert}
        onOpenChange={setShowGLPIAlert}
        files={sortedFiles}
        type="glpi"
      />
    </div>
  );
};

export default Backups;