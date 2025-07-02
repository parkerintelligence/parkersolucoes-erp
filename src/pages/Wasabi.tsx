
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
      'image': 'bg-purple-100 text-purple-800 border-purple-200',
      'video': 'bg-red-100 text-red-800 border-red-200',
      'audio': 'bg-pink-100 text-pink-800 border-pink-200',
      'document': 'bg-orange-100 text-orange-800 border-orange-200',
      'archive': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'code': 'bg-green-100 text-green-800 border-green-200',
      'database': 'bg-blue-100 text-blue-800 border-blue-200',
      'file': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return <Badge className={colors[type] || colors.file}>{type}</Badge>;
  };

  if (!wasabiIntegration) {
    return (
      <div className="space-y-6">
          <Card className="border-orange-200 bg-orange-50 max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <HardDrive className="h-20 w-20 text-orange-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-orange-900 mb-4">Integração Wasabi não configurada</h2>
              <p className="text-orange-700 mb-6 text-lg">
                Para usar o armazenamento Wasabi, você precisa configurar uma integração primeiro.
              </p>
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700" onClick={() => window.location.href = '/admin'}>
                <Settings className="h-5 w-5 mr-2" />
                Configurar Integração
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
      <div className="space-y-6">
          <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-red-900 mb-4">Erro de Conexão com Wasabi</h2>
              <p className="text-red-700 mb-4 text-lg">
                Não foi possível conectar ao Wasabi. Verifique suas credenciais e configurações.
              </p>
              <p className="text-sm text-red-600 mb-6 font-mono bg-red-100 p-3 rounded">
                {bucketsError.message}
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-red-600 hover:bg-red-700" onClick={() => window.location.href = '/admin'}>
                  <Settings className="h-5 w-5 mr-2" />
                  Verificar Configurações
                </Button>
                <Button size="lg" variant="outline" onClick={handleRefresh}>
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
    <div className="space-y-6">
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
          <Button variant="outline" onClick={handleRefresh} disabled={isLoadingBuckets}>
            <RefreshCw className={`h-5 w-5 mr-2 ${isLoadingBuckets ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Control Panel */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
              {/* Bucket Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Selecionar Bucket</label>
                {isLoadingBuckets ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Carregando buckets...</span>
                  </div>
                ) : (
                  <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolha um bucket" />
                    </SelectTrigger>
                    <SelectContent>
                      {buckets.map((bucket) => (
                        <SelectItem key={bucket.name} value={bucket.name}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-blue-500" />
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
                <label className="text-sm font-medium text-gray-700">Buscar Arquivos</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={!selectedBucket}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{buckets.length}</p>
                  <p className="text-sm text-blue-600">Total de Buckets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{files.length}</p>
                  <p className="text-sm text-blue-600">Arquivos no Bucket</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {files.reduce((total, file) => total + (file.sizeBytes || 0), 0) > 0 ? 
                      Math.round(files.reduce((total, file) => total + (file.sizeBytes || 0), 0) / 1024 / 1024) + ' MB' : 
                      '0 MB'
                    }
                  </p>
                  <p className="text-sm text-blue-600">Espaço Usado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Arquivos {selectedBucket && `- ${selectedBucket}`}
            </CardTitle>
            <CardDescription>
              {selectedBucket ? 
                `${filteredFiles.length} arquivo(s) encontrado(s)` : 
                'Selecione um bucket para visualizar os arquivos'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBucket ? (
              <div className="text-center py-12 text-gray-500">
                <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Selecione um bucket</p>
                <p className="text-sm">Escolha um bucket acima para visualizar seus arquivos</p>
              </div>
            ) : isLoadingFiles ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Carregando arquivos do bucket {selectedBucket}...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Arquivo</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden lg:table-cell">Última Modificação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id} className="hover:bg-blue-50">
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{file.size}</TableCell>
                        <TableCell>{getTypeBadge(file.type)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{file.lastModified}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(file.name)}
                              disabled={downloadFile.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
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
                  <div className="text-center py-12 text-gray-500">
                    <File className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
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
    </div>
  );
};

export default Wasabi;
