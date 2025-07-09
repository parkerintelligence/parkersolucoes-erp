
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Cloud, 
  Plus, 
  Upload, 
  Folder,
  FolderOpen,
  Download,
  Trash2,
  RefreshCw,
  Settings,
  Database,
  HardDrive,
  Activity
} from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';
import { WasabiCreateBucketDialog } from '@/components/WasabiCreateBucketDialog';
import { WasabiUploadDialog } from '@/components/WasabiUploadDialog';

const Wasabi = () => {
  const [createBucketOpen, setCreateBucketOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const { 
    buckets, 
    objects, 
    currentPath,
    isLoading, 
    error,
    isConfigured,
    stats,
    listBuckets,
    listObjects,
    createBucket,
    uploadFile,
    deleteObject,
    downloadObject,
    navigateToFolder,
    navigateBack
  } = useWasabi();

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Cloud className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cloud Server</h1>
            <p className="text-muted-foreground">
              Gerencie seus arquivos na nuvem com Wasabi Cloud Storage
            </p>
          </div>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <Cloud className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cloud Server não configurado</h3>
            <p className="text-yellow-700 mb-4">
              Para usar o Cloud Server, configure a integração Wasabi no painel de administração.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar Cloud Server
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpload = (bucketName: string, folder?: string) => {
    setSelectedBucket(bucketName);
    setSelectedFolder(folder || '');
    setUploadDialogOpen(true);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Cloud className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cloud Server</h1>
            <p className="text-muted-foreground">
              Gerencie seus arquivos na nuvem com Wasabi Cloud Storage
            </p>
          </div>
        </div>
        <Button 
          onClick={listBuckets} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Buckets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBuckets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Containers de armazenamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Objetos</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalObjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Arquivos armazenados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats?.totalSize || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Espaço utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Conectado</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setCreateBucketOpen(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Bucket
        </Button>
        <Button 
          onClick={() => handleUpload(selectedBucket)}
          disabled={!selectedBucket}
          className="bg-blue-900 hover:bg-blue-800 text-white"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Arquivo
        </Button>
        <Button 
          onClick={listBuckets}
          variant="outline"
          className="bg-blue-900 hover:bg-blue-800 text-white border-blue-900"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Listar Buckets
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="buckets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
        </TabsList>

        <TabsContent value="buckets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Buckets Disponíveis
              </CardTitle>
              <CardDescription>
                Liste e gerencie seus buckets de armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando buckets...</p>
                </div>
              ) : buckets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Nenhum bucket encontrado</p>
                  <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro bucket para começar.</p>
                  <Button onClick={() => setCreateBucketOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Bucket
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buckets.map((bucket) => (
                      <TableRow key={bucket.Name}>
                        <TableCell className="font-medium">{bucket.Name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">us-east-1</Badge>
                        </TableCell>
                        <TableCell>{formatDate(bucket.CreationDate)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedBucket(bucket.Name);
                                listObjects(bucket.Name);
                              }}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpload(bucket.Name)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Arquivos
                    {selectedBucket && (
                      <Badge variant="outline" className="ml-2">
                        {selectedBucket}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {currentPath ? `Caminho: ${currentPath}` : 'Selecione um bucket para ver os arquivos'}
                  </CardDescription>
                </div>
                {currentPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateBack}
                  >
                    Voltar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedBucket ? (
                <div className="text-center py-8">
                  <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Selecione um bucket</p>
                  <p className="text-sm text-muted-foreground">Escolha um bucket na aba anterior para ver os arquivos.</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando arquivos...</p>
                </div>
              ) : objects.length === 0 ? (
                <div className="text-center py-8">
                  <HardDrive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Bucket vazio</p>
                  <p className="text-sm text-muted-foreground mb-4">Faça upload do seu primeiro arquivo.</p>
                  <Button onClick={() => handleUpload(selectedBucket, selectedFolder)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Arquivo
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Última Modificação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objects.map((object) => (
                      <TableRow key={object.Key}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {object.Key?.endsWith('/') ? (
                              <Folder className="h-4 w-4 text-blue-500" />
                            ) : (
                              <HardDrive className="h-4 w-4" />
                            )}
                            {object.Key}
                          </div>
                        </TableCell>
                        <TableCell>
                          {object.Size ? formatFileSize(object.Size) : '-'}
                        </TableCell>
                        <TableCell>
                          {object.LastModified ? formatDate(object.LastModified) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {object.Key?.endsWith('/') ? (
                              <Button
                                size="sm"
                                onClick={() => navigateToFolder(object.Key!)}
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => downloadObject(selectedBucket, object.Key!)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteObject(selectedBucket, object.Key!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WasabiCreateBucketDialog
        open={createBucketOpen}
        onOpenChange={setCreateBucketOpen}
        onCreateBucket={createBucket}
      />

      <WasabiUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        bucketName={selectedBucket}
        folder={selectedFolder}
        onUpload={uploadFile}
      />
    </div>
  );
};

export default Wasabi;
