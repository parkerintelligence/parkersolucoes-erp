
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, Download, Upload, Trash2, RefreshCw, Search, File, Folder, Settings, AlertTriangle, Database } from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';

const Wasabi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
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
  } = useWasabi();

  const { data: files = [], isLoading: isLoadingFiles, error: filesError } = getFilesQuery(selectedBucket);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !selectedBucket) {
      return;
    }

    uploadFiles.mutate({ files: selectedFiles, bucketName: selectedBucket });
    setSelectedFiles(null);
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
      <div className="min-h-screen bg-gray-50 p-6">
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
    );
  }

  if (bucketsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
              <HardDrive className="h-8 w-8" />
              Wasabi Storage
            </h1>
            <p className="text-blue-600 mt-1">
              Integração: <span className="font-semibold">{wasabiIntegration.name}</span>
            </p>
            <p className="text-blue-600 text-sm">
              Endpoint: {wasabiIntegration.base_url} | Região: {wasabiIntegration.region || 'us-east-1'}
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoadingBuckets}>
            <RefreshCw className={`h-5 w-5 mr-2 ${isLoadingBuckets ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Buckets */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Buckets Disponíveis
                </CardTitle>
                <CardDescription>
                  Selecione um bucket para visualizar seus arquivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBuckets ? (
                  <div className="text-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-gray-600">Carregando buckets...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {buckets.map((bucket) => (
                      <div
                        key={bucket.name}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedBucket === bucket.name
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedBucket(bucket.name)}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{bucket.name}</p>
                            <p className="text-xs text-gray-500">{bucket.creationDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {buckets.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <Folder className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum bucket encontrado</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
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

            {/* Upload Section */}
            {selectedBucket && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload de Arquivos
                  </CardTitle>
                  <CardDescription>
                    Envie arquivos para o bucket: <strong>{selectedBucket}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none hover:border-gray-400 transition-colors"
                    />
                  </div>
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={uploadFiles.isPending || !selectedFiles || selectedFiles.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    {uploadFiles.isPending ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Files List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <File className="h-5 w-5" />
                      Arquivos
                    </CardTitle>
                    <CardDescription>
                      {selectedBucket ? `Bucket: ${selectedBucket}` : 'Selecione um bucket para visualizar os arquivos'}
                    </CardDescription>
                  </div>
                  {selectedBucket && (
                    <div className="w-full lg:w-80">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Buscar arquivos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedBucket ? (
                  <div className="text-center py-12 text-gray-500">
                    <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Selecione um bucket</p>
                    <p className="text-sm">Escolha um bucket na barra lateral para visualizar seus arquivos</p>
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
    </div>
  );
};

export default Wasabi;
