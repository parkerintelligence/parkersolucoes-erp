
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, Download, Trash2, RefreshCw, Search, File, Folder, Settings, AlertTriangle, Database } from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';
import { WasabiUploadDialog } from '@/components/WasabiUploadDialog';
import { WasabiCreateBucketDialog } from '@/components/WasabiCreateBucketDialog';

const Wasabi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  
  const { 
    buckets,
    isLoadingBuckets,
    bucketsError,
    wasabiIntegration,
    wasabiIntegrations,
    getFilesQuery,
    uploadFiles,
    downloadFile,
    deleteFile,
    createBucket,
  } = useWasabi();

  const { data: files = [], isLoading: isLoadingFiles, error: filesError } = getFilesQuery(selectedBucket);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFileUpload = (files: FileList) => {
    if (!selectedBucket) return;
    uploadFiles.mutate({ files, bucketName: selectedBucket });
  };

  const handleCreateBucket = (bucketName: string) => {
    createBucket.mutate(bucketName);
  };

  const handleDownload = (fileName: string) => {
    if (!selectedBucket) return;
    downloadFile.mutate({ fileName, bucketName: selectedBucket });
  };

  const handleDelete = (fileName: string) => {
    if (!selectedBucket) return;
    if (confirm(`Tem certeza que deseja remover o arquivo "${fileName}"?`)) {
      deleteFile.mutate({ fileName, bucketName: selectedBucket });
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'image': 'bg-purple-900/20 text-purple-300 border-purple-600',
      'video': 'bg-red-900/20 text-red-300 border-red-600',
      'audio': 'bg-pink-900/20 text-pink-300 border-pink-600',
      'document': 'bg-orange-900/20 text-orange-300 border-orange-600',
      'archive': 'bg-yellow-900/20 text-yellow-300 border-yellow-600',
      'code': 'bg-green-900/20 text-green-300 border-green-600',
      'database': 'bg-blue-900/20 text-blue-300 border-blue-600',
      'file': 'bg-gray-900/20 text-gray-300 border-gray-600',
    };
    return <Badge className={colors[type] || colors.file}>{type}</Badge>;
  };

  if (!wasabiIntegration) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="space-y-6 p-6">
          <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <HardDrive className="h-20 w-20 text-gray-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Integração Wasabi não configurada</h2>
              <p className="text-gray-400 mb-6 text-lg">
                Para usar o armazenamento Wasabi, você precisa configurar uma integração primeiro.
              </p>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/admin'}>
                <Settings className="h-5 w-5 mr-2" />
                Configurar Integração
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bucketsError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="space-y-6 p-6">
          <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-20 w-20 text-red-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Erro de Conexão com Wasabi</h2>
              <p className="text-gray-400 mb-4 text-lg">
                Não foi possível conectar ao Wasabi. Verifique suas credenciais e configurações.
              </p>
              <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-800 p-3 rounded">
                {bucketsError.message}
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/admin'}>
                  <Settings className="h-5 w-5 mr-2" />
                  Verificar Configurações
                </Button>
                <Button size="lg" variant="outline" onClick={handleRefresh} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-end gap-2">
          <WasabiCreateBucketDialog
            onCreateBucket={handleCreateBucket}
            isCreating={createBucket.isPending}
          />
          <WasabiUploadDialog
            selectedBucket={selectedBucket}
            onUpload={handleFileUpload}
            isUploading={uploadFiles.isPending}
          />
          <Button variant="outline" onClick={handleRefresh} disabled={isLoadingBuckets} className="border-gray-600 text-gray-200 hover:bg-gray-700">
            <RefreshCw className={`h-5 w-5 mr-2 ${isLoadingBuckets ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Control Panel */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
              {/* Bucket Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Selecionar Bucket</label>
                {isLoadingBuckets ? (
                  <div className="flex items-center gap-2 p-3 border border-gray-600 rounded-lg bg-gray-700">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-300">Carregando buckets...</span>
                  </div>
                ) : (
                  <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Escolha um bucket" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {buckets.map((bucket) => (
                        <SelectItem key={bucket.name} value={bucket.name} className="text-gray-200 hover:bg-gray-700">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-blue-400" />
                            {bucket.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Search */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Buscar Arquivos</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                    disabled={!selectedBucket}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{buckets.length}</p>
                  <p className="text-sm text-gray-400">Total de Buckets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{files.length}</p>
                  <p className="text-sm text-gray-400">Arquivos no Bucket</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {files.reduce((total, file) => total + (file.sizeBytes || 0), 0) > 0 ? 
                      Math.round(files.reduce((total, file) => total + (file.sizeBytes || 0), 0) / 1024 / 1024) + ' MB' : 
                      '0 MB'
                    }
                  </p>
                  <p className="text-sm text-gray-400">Espaço Usado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <File className="h-5 w-5" />
              Arquivos {selectedBucket && `- ${selectedBucket}`}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {selectedBucket ? 
                `${filteredFiles.length} arquivo(s) encontrado(s)` : 
                'Selecione um bucket para visualizar os arquivos'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBucket ? (
              <div className="text-center py-12 text-gray-400">
                <Folder className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-medium text-gray-300">Selecione um bucket</p>
                <p className="text-sm">Escolha um bucket acima para visualizar seus arquivos</p>
              </div>
            ) : isLoadingFiles ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">Carregando arquivos do bucket {selectedBucket}...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Nome do Arquivo</TableHead>
                      <TableHead className="text-gray-300">Tamanho</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="hidden lg:table-cell text-gray-300">Última Modificação</TableHead>
                      <TableHead className="text-right text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell className="font-medium max-w-xs text-gray-200">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{file.size}</TableCell>
                        <TableCell>{getTypeBadge(file.type)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-300">{file.lastModified}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(file.name)}
                              disabled={downloadFile.isPending}
                              className="border-gray-600 text-gray-200 hover:bg-gray-700"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-400 hover:text-red-300 hover:border-red-600 border-red-600"
                              onClick={() => handleDelete(file.name)}
                              disabled={deleteFile.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredFiles.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <File className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium text-gray-300">Nenhum arquivo encontrado</p>
                    <p className="text-sm">
                      {searchTerm ? 'Tente ajustar sua busca' : `Faça upload de arquivos para o bucket ${selectedBucket}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wasabi;
