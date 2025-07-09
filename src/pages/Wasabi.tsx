import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Cloud, Upload, RefreshCcw, Plus, Download, Trash2, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { WasabiCreateBucketDialog } from '@/components/WasabiCreateBucketDialog';
import { WasabiUploadDialog } from '@/components/WasabiUploadDialog';
import { useWasabi } from '@/hooks/useWasabi';

const Wasabi = () => {
  const {
    buckets,
    isLoadingBuckets,
    bucketsError,
    wasabiIntegration,
    getFilesQuery,
    uploadFiles,
    downloadFile,
    deleteFile,
    createBucket,
  } = useWasabi();

  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filesQuery = getFilesQuery(selectedBucket);
  const objects = filesQuery.data || [];
  const isLoadingObjects = filesQuery.isLoading;

  const handleRefresh = async () => {
    if (selectedBucket) {
      await filesQuery.refetch();
    }
  };

  const handleBucketSelect = (bucketName: string) => {
    setSelectedBucket(bucketName);
  };

  const handleDownload = async (obj: any) => {
    if (!selectedBucket) return;
    
    try {
      await downloadFile.mutateAsync({ fileName: obj.key || obj.Key, bucketName: selectedBucket });
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  const handleDelete = async (obj: any) => {
    if (!selectedBucket || !confirm(`Tem certeza que deseja excluir ${obj.key || obj.Key}?`)) return;
    
    try {
      await deleteFile.mutateAsync({ fileName: obj.key || obj.Key, bucketName: selectedBucket });
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleCreateBucket = async (bucketName: string) => {
    try {
      await createBucket.mutateAsync(bucketName);
      setShowCreateBucket(false);
    } catch (error) {
      console.error('Erro ao criar bucket:', error);
    }
  };

  const handleUpload = async (files: FileList) => {
    if (!selectedBucket) return;
    
    try {
      await uploadFiles.mutateAsync({ files, bucketName: selectedBucket });
      setShowUpload(false);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const filteredObjects = objects.filter((obj: any) => 
    (obj.key || obj.Key || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConnectionStatusIcon = () => {
    if (wasabiIntegration) {
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
  };

  const getConnectionStatusColor = () => {
    if (wasabiIntegration) {
      return 'text-green-400';
    } else {
      return 'text-red-400';
    }
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
              Gerencie arquivos e buckets no armazenamento em nuvem
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getConnectionStatusIcon()}
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {wasabiIntegration ? 'Conectado' : 'Não Configurado'}
            </span>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoadingBuckets || isLoadingObjects}
            variant="outline"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoadingBuckets || isLoadingObjects ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {!wasabiIntegration && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Wasabi não configurado</h3>
                <p className="text-sm text-red-700">Configure a integração do Wasabi no painel de administração.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Buckets</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buckets.length}</div>
            <p className="text-xs text-muted-foreground">
              Buckets configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetos</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{objects.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedBucket ? `Em ${selectedBucket}` : 'Total de arquivos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bucket Selecionado</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{selectedBucket || 'Nenhum'}</div>
            <p className="text-xs text-muted-foreground">
              Bucket ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {getConnectionStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {wasabiIntegration ? 'Online' : 'Offline'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="buckets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="objects" disabled={!selectedBucket}>
            Objetos {selectedBucket && `(${selectedBucket})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buckets" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Buckets Disponíveis</CardTitle>
                  <CardDescription>
                    Lista de buckets no seu armazenamento Wasabi
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowCreateBucket(true)}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Bucket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingBuckets ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando buckets...</p>
                </div>
              ) : buckets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cloud className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhum bucket encontrado</p>
                  <p className="text-sm">Crie seu primeiro bucket para começar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buckets.map((bucket) => (
                    <Card 
                      key={bucket.name} 
                      className={`cursor-pointer transition-colors ${
                        selectedBucket === bucket.name 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleBucketSelect(bucket.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded">
                            <Cloud className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{bucket.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Criado em {new Date(bucket.creationDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objects" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Objetos em {selectedBucket}</CardTitle>
                  <CardDescription>
                    Arquivos armazenados no bucket selecionado
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowUpload(true)}
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button 
                    onClick={handleRefresh}
                    disabled={isLoadingObjects}
                    variant="outline"
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${isLoadingObjects ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {isLoadingObjects ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Carregando objetos...</p>
                  </div>
                ) : filteredObjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">
                      {searchTerm ? 'Nenhum arquivo encontrado' : 'Nenhum objeto encontrado'}
                    </p>
                    <p className="text-sm">
                      {searchTerm ? 'Tente ajustar sua busca.' : 'Faça upload do seu primeiro arquivo.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredObjects.map((obj: any) => (
                      <div key={obj.key || obj.Key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{obj.key || obj.Key}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(obj.size || obj.Size || 0)}</span>
                            <span>Modificado em {new Date(obj.lastModified || obj.LastModified).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(obj)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(obj)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WasabiCreateBucketDialog 
        onCreateBucket={handleCreateBucket} 
        isCreating={createBucket.isPending}
      />

      <WasabiUploadDialog
        selectedBucket={selectedBucket || ''}
        onUpload={handleUpload}
        isUploading={uploadFiles.isPending}
      />
    </div>
  );
};

export default Wasabi;
