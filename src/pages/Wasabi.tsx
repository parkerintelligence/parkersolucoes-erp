
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
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-900 p-2 rounded-lg">
            <Cloud className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Wasabi Cloud Storage</h1>
            <p className="text-gray-400">
              Gerencie seus arquivos na nuvem com Wasabi Cloud Storage
            </p>
          </div>
        </div>

        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <Cloud className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">Wasabi não configurado</h3>
            <p className="text-yellow-300 mb-4">
              Para usar o Wasabi, configure a integração no painel de administração.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin'} 
              className="bg-blue-800 hover:bg-blue-700 text-white border border-yellow-600"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurar Wasabi
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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 p-2 rounded-lg">
              <Cloud className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Wasabi Cloud Storage</h1>
              <p className="text-gray-400">
                Gerencie seus arquivos na nuvem com Wasabi Cloud Storage
              </p>
            </div>
          </div>
          <Button 
            onClick={listBuckets} 
            disabled={isLoading}
            className="bg-blue-800 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total de Buckets</CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalBuckets || 0}</div>
              <p className="text-xs text-gray-400">
                Containers de armazenamento
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total de Objetos</CardTitle>
              <HardDrive className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalObjects || 0}</div>
              <p className="text-xs text-gray-400">
                Arquivos armazenados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Tamanho Total</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatFileSize(stats?.totalSize || 0)}</div>
              <p className="text-xs text-gray-400">
                Espaço utilizado
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Status</CardTitle>
              <Cloud className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Conectado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={() => setCreateBucketOpen(true)}
            className="bg-blue-800 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Bucket
          </Button>
          <Button 
            onClick={() => handleUpload(selectedBucket)}
            disabled={!selectedBucket}
            className="bg-blue-800 hover:bg-blue-700 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Arquivo
          </Button>
          <Button 
            onClick={listBuckets}
            className="bg-blue-800 hover:bg-blue-700 text-white border-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Listar Buckets
          </Button>
        </div>

        {error && (
          <Card className="border-red-600 bg-red-900/20">
            <CardContent className="p-4">
              <p className="text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="buckets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger value="buckets" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white text-gray-300">Buckets</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white text-gray-300">Arquivos</TabsTrigger>
          </TabsList>

          <TabsContent value="buckets" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5" />
                  Buckets Disponíveis
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Liste e gerencie seus buckets de armazenamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-gray-300">Carregando buckets...</p>
                  </div>
                ) : buckets.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-lg font-medium text-white">Nenhum bucket encontrado</p>
                    <p className="text-sm text-gray-400 mb-4">Crie seu primeiro bucket para começar.</p>
                    <Button onClick={() => setCreateBucketOpen(true)} className="bg-blue-800 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Bucket
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Nome</TableHead>
                        <TableHead className="text-gray-300">Região</TableHead>
                        <TableHead className="text-gray-300">Data de Criação</TableHead>
                        <TableHead className="text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buckets.map((bucket) => (
                        <TableRow key={bucket.name} className="border-gray-700">
                          <TableCell className="font-medium text-white">{bucket.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">us-east-1</Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{formatDate(bucket.creationDate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedBucket(bucket.name);
                                  listObjects(bucket.name);
                                }}
                                className="bg-blue-800 hover:bg-blue-700 text-white"
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleUpload(bucket.name)}
                                className="bg-blue-800 hover:bg-blue-700 text-white"
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
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <HardDrive className="h-5 w-5" />
                      Arquivos
                      {selectedBucket && (
                        <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300">
                          {selectedBucket}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {currentPath ? `Caminho: ${currentPath}` : 'Selecione um bucket para ver os arquivos'}
                    </CardDescription>
                  </div>
                  {currentPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateBack}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Voltar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedBucket ? (
                  <div className="text-center py-8">
                    <Folder className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-lg font-medium text-white">Selecione um bucket</p>
                    <p className="text-sm text-gray-400">Escolha um bucket na aba anterior para ver os arquivos.</p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-gray-300">Carregando arquivos...</p>
                  </div>
                ) : objects.length === 0 ? (
                  <div className="text-center py-8">
                    <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-lg font-medium text-white">Bucket vazio</p>
                    <p className="text-sm text-gray-400 mb-4">Faça upload do seu primeiro arquivo.</p>
                    <Button onClick={() => handleUpload(selectedBucket, selectedFolder)} className="bg-blue-800 hover:bg-blue-700 text-white">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Arquivo
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Nome</TableHead>
                        <TableHead className="text-gray-300">Tamanho</TableHead>
                        <TableHead className="text-gray-300">Última Modificação</TableHead>
                        <TableHead className="text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {objects.map((object) => (
                        <TableRow key={object.id} className="border-gray-700">
                          <TableCell className="font-medium text-white">
                            <div className="flex items-center gap-2">
                              {object.name?.endsWith('/') ? (
                                <Folder className="h-4 w-4 text-blue-400" />
                              ) : (
                                <HardDrive className="h-4 w-4 text-gray-400" />
                              )}
                              {object.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {object.sizeBytes ? formatFileSize(object.sizeBytes) : '-'}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {object.lastModified ? formatDate(object.lastModified) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {object.name?.endsWith('/') ? (
                                <Button
                                  size="sm"
                                  onClick={() => navigateToFolder(object.name!)}
                                  className="bg-blue-800 hover:bg-blue-700 text-white"
                                >
                                  <FolderOpen className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => downloadObject(selectedBucket, object.name!)}
                                    className="bg-blue-800 hover:bg-blue-700 text-white"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteObject(selectedBucket, object.name!)}
                                    className="bg-red-800 hover:bg-red-700 text-white"
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
          onCreateBucket={(bucketName) => createBucket.mutate(bucketName)}
          isCreating={createBucket.isPending}
        />

        <WasabiUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          selectedBucket={selectedBucket}
          bucketName={selectedBucket}
          folder={selectedFolder}
          onUpload={uploadFile}
          isUploading={false}
        />
      </div>
    </div>
  );
};

export default Wasabi;
