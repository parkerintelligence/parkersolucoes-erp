import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Cloud, RefreshCcw, AlertTriangle, CheckCircle, Settings, FileText, Folder, Download, Upload, Trash2, Eye, FolderPlus } from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';
import { WasabiCreateBucketDialog } from '@/components/WasabiCreateBucketDialog';
import { WasabiUploadDialog } from '@/components/WasabiUploadDialog';
import { WasabiBucketSelector } from '@/components/WasabiBucketSelector';
import { toast } from '@/hooks/use-toast';
const Wasabi = () => {
  const {
    wasabiIntegration,
    buckets,
    objects,
    isLoading,
    isLoadingBuckets,
    createBucket,
    uploadFile,
    downloadObject,
    deleteObject,
    listObjects,
    listBuckets
  } = useWasabi();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [createBucketDialogOpen, setCreateBucketDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const isConfigured = !!wasabiIntegration;
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      listBuckets();
      if (selectedBucket) {
        listObjects(selectedBucket);
      }
      toast({
        title: "Dados atualizados",
        description: "Informações do Wasabi foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do Wasabi.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  const onBucketChange = (bucketName: string) => {
    console.log('Bucket selecionado:', bucketName);
    setSelectedBucket(bucketName);
    if (bucketName) {
      listObjects(bucketName);
    }
  };
  const handleCreateBucket = (bucketName: string) => {
    createBucket.mutate(bucketName, {
      onSuccess: () => {
        setCreateBucketDialogOpen(false);
        listBuckets();
      }
    });
  };
  const handleUpload = (files: FileList, bucketName: string) => {
    uploadFile(files, bucketName);
    setUploadDialogOpen(false);
  };
  const handleDownload = (fileName: string) => {
    if (selectedBucket) {
      downloadObject(selectedBucket, fileName);
    }
  };
  const handleDelete = (fileName: string) => {
    if (selectedBucket) {
      deleteObject(selectedBucket, fileName);
    }
  };
  if (!isConfigured) {
    return <div className="min-h-screen bg-gray-900 text-white p-6">
        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">Wasabi não configurado</h3>
            <p className="text-yellow-300 mb-4">
              Para usar o armazenamento Wasabi, configure a integração no painel de administração.
            </p>
            <Button onClick={() => window.location.href = '/admin'} className="bg-blue-800 hover:bg-blue-700 text-white border border-yellow-600">
              <Settings className="mr-2 h-4 w-4" />
              Configurar Wasabi
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="text-2xl font-bold text-white">Wasabi Cloud Storage</h1>
              <p className="text-gray-400">
                Gerencie seus arquivos no armazenamento em nuvem Wasabi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-400">Conectado</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRefresh} disabled={refreshing} className="bg-blue-800 hover:bg-blue-700 text-white">
                <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={() => setCreateBucketDialogOpen(true)} className="bg-blue-800 hover:bg-blue-700 text-white">
                <FolderPlus className="mr-2 h-4 w-4" />
                Criar Bucket
              </Button>
              <Button onClick={() => setUploadDialogOpen(true)} disabled={!selectedBucket} className="bg-blue-800 hover:bg-blue-700 text-white disabled:opacity-50">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="storage" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger value="storage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Armazenamento
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Análise de Uso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="storage" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <WasabiBucketSelector buckets={buckets || []} selectedBucket={selectedBucket} onBucketChange={onBucketChange} isLoading={isLoadingBuckets} />
                </div>
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {selectedBucket ? `Arquivos em: ${selectedBucket}` : 'Selecione um bucket'}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {selectedBucket ? 'Gerencie os arquivos no bucket selecionado' : 'Escolha um bucket para visualizar os arquivos'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedBucket ? <div className="text-center py-8 text-gray-400">
                      <Cloud className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-lg font-medium mb-2">Nenhum bucket selecionado</p>
                      <p>Selecione um bucket no menu acima para visualizar os arquivos.</p>
                    </div> : isLoading ? <div className="text-center py-8 text-gray-400">
                      <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Carregando arquivos...</p>
                    </div> : <div className="space-y-2">
                      {objects && objects.length > 0 ? objects.map((object: any, index: number) => <div key={object.id || `file-${index}`} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-400" />
                              <div>
                                <p className="text-white font-medium">
                                  {object.name || object.Key || `arquivo-${index + 1}`}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {object.size || object.Size ? `${typeof (object.size || object.Size) === 'number' ? ((object.size || object.Size) / 1024).toFixed(2) : object.size || object.Size} ${typeof (object.size || object.Size) === 'number' ? 'KB' : ''}` : 'Tamanho desconhecido'} • 
                                  {object.lastModified || object.LastModified ? new Date(object.lastModified || object.LastModified).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              
                              <Button size="sm" variant="outline" onClick={() => handleDownload(object.name || object.Key)} className="border-gray-600 bg-blue-950 hover:bg-blue-800 text-slate-50">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(object.name || object.Key)} className="border-gray-600 bg-red-800 hover:bg-red-700 text-slate-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>) : <div className="text-center py-8 text-gray-400">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-lg font-medium mb-2">Bucket vazio</p>
                          <p>Este bucket não contém nenhum arquivo.</p>
                        </div>}
                    </div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total de Buckets</CardTitle>
                  <Folder className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{buckets?.length || 0}</div>
                  <p className="text-xs text-gray-400">Buckets configurados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Arquivos Totais</CardTitle>
                  <FileText className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{objects?.length || 0}</div>
                  <p className="text-xs text-gray-400">Arquivos armazenados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      Operacional
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Serviço ativo</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <WasabiCreateBucketDialog open={createBucketDialogOpen} onOpenChange={setCreateBucketDialogOpen} onCreateBucket={handleCreateBucket} isCreating={createBucket.isPending} />

        <WasabiUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} selectedBucket={selectedBucket} onUpload={handleUpload} isUploading={false} />
      </div>
    </div>;
};
export default Wasabi;