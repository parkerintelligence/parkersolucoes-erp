import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Cloud, RefreshCcw, AlertTriangle, CheckCircle, Settings, FileText, Folder, Download, Upload, Trash2, FolderPlus, ArrowLeft, ChevronRight, FolderX } from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';
import { WasabiCreateBucketDialog } from '@/components/WasabiCreateBucketDialog';
import { WasabiUploadDialog } from '@/components/WasabiUploadDialog';
import { WasabiBucketSelector } from '@/components/WasabiBucketSelector';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Wasabi = () => {
  const {
    wasabiIntegration, buckets, objects, currentPath, isLoading, isLoadingBuckets,
    createBucket, uploadFile, downloadObject, deleteObject, listObjects, listBuckets, navigateToFolder, navigateBack,
    createFolder, deleteFolder
  } = useWasabi();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [createBucketDialogOpen, setCreateBucketDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; fileName: string; isFolder: boolean }>({ open: false, fileName: '', isFolder: false });
  const [uploadResult, setUploadResult] = useState<{ open: boolean; success: boolean; message: string }>({ open: false, success: true, message: '' });
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const isConfigured = !!wasabiIntegration;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      listBuckets();
      if (selectedBucket) listObjects(selectedBucket);
      toast({ title: "Dados atualizados", description: "Informações do Wasabi foram atualizadas." });
    } catch (error) {
      toast({ title: "Erro ao atualizar", description: "Não foi possível atualizar os dados.", variant: "destructive" });
    } finally { setRefreshing(false); }
  };

  const onBucketChange = (bucketName: string) => {
    setSelectedBucket(bucketName);
    if (bucketName) listObjects(bucketName, '');
  };

  const handleCreateBucket = (bucketName: string) => {
    createBucket.mutate(bucketName, { onSuccess: () => { setCreateBucketDialogOpen(false); listBuckets(); } });
  };

  const handleUpload = (files: FileList, bucketName: string) => {
    uploadFile(files, bucketName);
    setUploadDialogOpen(false);
    setUploadResult({ open: true, success: true, message: `${files.length} arquivo(s) enviado(s) com sucesso para ${bucketName}/${currentPath || ''}` });
  };

  const handleDownload = (fileName: string) => { if (selectedBucket) downloadObject(selectedBucket, currentPath ? `${currentPath}${fileName}` : fileName); };
  
  const handleDeleteRequest = (fileName: string, isFolder = false) => {
    setDeleteConfirm({ open: true, fileName, isFolder });
  };

  const handleDeleteConfirm = () => {
    if (selectedBucket && deleteConfirm.fileName) {
      if (deleteConfirm.isFolder) {
        deleteFolder.mutate(deleteConfirm.fileName);
      } else {
        deleteObject(selectedBucket, currentPath ? `${currentPath}${deleteConfirm.fileName}` : deleteConfirm.fileName);
      }
    }
    setDeleteConfirm({ open: false, fileName: '', isFolder: false });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder.mutate(newFolderName.trim());
      setNewFolderName('');
      setCreateFolderDialog(false);
    }
  };

  const handleFileClick = (file: any) => { if (file.isFolder) navigateToFolder(file.name); };
  const getFileIcon = (file: any) => file.isFolder ? <Folder className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />;
  const getCurrentPathDisplay = () => !currentPath ? selectedBucket : `${selectedBucket}/${currentPath.replace(/\/$/, '')}`;

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
            <h3 className="text-base font-semibold text-foreground mb-2">Wasabi não configurado</h3>
            <p className="text-muted-foreground text-sm mb-4">Configure a integração no painel de administração.</p>
            <Button onClick={() => window.location.href = '/admin'} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
              <Settings className="mr-1.5 h-3.5 w-3.5" /> Configurar Wasabi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Wasabi Cloud Storage
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">Gerencie seus arquivos no armazenamento em nuvem</p>
            <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
              <CheckCircle className="h-2.5 w-2.5 mr-1" /> Conectado
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8 text-xs">
            <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateBucketDialogOpen(true)} className="h-8 text-xs">
            <FolderPlus className="h-3.5 w-3.5 mr-1" /> Criar Bucket
          </Button>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)} disabled={!selectedBucket} className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload
          </Button>
        </div>
      </div>

      <Tabs defaultValue="storage" className="w-full">
        <TabsList className="bg-muted/50 border border-border h-8">
          <TabsTrigger value="storage" className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Armazenamento
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Análise de Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="storage" className="mt-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <WasabiBucketSelector buckets={buckets || []} selectedBucket={selectedBucket} onBucketChange={onBucketChange} isLoading={isLoadingBuckets} />
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" />
                    {selectedBucket ? `Arquivos em: ${getCurrentPathDisplay()}` : 'Selecione um bucket'}
                  </CardTitle>
                  {currentPath && (
                    <Button variant="outline" size="sm" onClick={navigateBack} className="h-7 text-xs">
                      <ArrowLeft className="h-3 w-3 mr-1" /> Voltar
                    </Button>
                  )}
                </div>
                <CardDescription className="text-muted-foreground text-xs">
                  {selectedBucket ? 'Gerencie os arquivos no bucket selecionado' : 'Escolha um bucket para visualizar os arquivos'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedBucket ? (
                  <div className="text-center py-10">
                    <Cloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">Nenhum bucket selecionado</p>
                    <p className="text-xs text-muted-foreground/70">Selecione um bucket no menu acima.</p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-xs text-muted-foreground">Carregando arquivos...</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {objects && objects.length > 0 ? objects.map((object: any, index: number) => (
                      <div
                        key={object.id || `file-${index}`}
                        className={`flex items-center justify-between p-2.5 rounded-md border border-border/50 hover:bg-muted/20 transition-colors ${object.isFolder ? 'cursor-pointer' : ''}`}
                        onClick={() => object.isFolder ? handleFileClick(object) : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(object)}
                          <div>
                            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                              {object.name || object.Key || `arquivo-${index + 1}`}
                              {object.isFolder && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {object.isFolder ? 'Pasta' : (
                                <>
                                  {object.size || object.Size ? `${typeof (object.size || object.Size) === 'number' ? ((object.size || object.Size) / 1024).toFixed(2) : object.size || object.Size} ${typeof (object.size || object.Size) === 'number' ? 'KB' : ''}` : 'Tamanho desconhecido'} • 
                                  {object.lastModified || object.LastModified ? new Date(object.lastModified || object.LastModified).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        {!object.isFolder && (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleDownload(object.name || object.Key)} className="h-6 w-6 p-0">
                              <Download className="h-2.5 w-2.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteRequest(object.name || object.Key)} className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-10">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">Pasta vazia</p>
                        <p className="text-xs text-muted-foreground/70">Esta pasta não contém nenhum arquivo.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-foreground">Total de Buckets</CardTitle>
                <Folder className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">{buckets?.length || 0}</div>
                <p className="text-[11px] text-muted-foreground">Buckets configurados</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-foreground">Arquivos Totais</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">{objects?.length || 0}</div>
                <p className="text-[11px] text-muted-foreground">Arquivos armazenados</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-foreground">Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">Operacional</Badge>
                <p className="text-[11px] text-muted-foreground mt-1">Serviço ativo</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <WasabiCreateBucketDialog open={createBucketDialogOpen} onOpenChange={setCreateBucketDialogOpen} onCreateBucket={handleCreateBucket} isCreating={createBucket.isPending} />
      <WasabiUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} selectedBucket={selectedBucket} onUpload={handleUpload} isUploading={false} />

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center text-foreground">Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground text-sm">
              Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirm.fileName}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary/80">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resultado do upload */}
      <Dialog open={uploadResult.open} onOpenChange={(open) => setUploadResult(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-foreground">Upload realizado!</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              {uploadResult.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button size="sm" onClick={() => setUploadResult(prev => ({ ...prev, open: false }))} className="bg-primary text-primary-foreground hover:bg-primary/90">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wasabi;
