
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, Upload, Trash2, RefreshCw, Search, FolderOpen, File } from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';

const Wasabi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  
  const { 
    buckets, 
    files, 
    isLoadingBuckets, 
    isLoadingFiles, 
    wasabiIntegration,
    uploadFiles,
    downloadFile,
    deleteFile
  } = useWasabi();

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    if (!selectedBucket) {
      return;
    }

    uploadFiles.mutate({ files: selectedFiles, bucket: selectedBucket });
    setSelectedFiles(null);
  };

  const handleDownload = (fileName: string, bucket: string) => {
    downloadFile.mutate({ fileName, bucket });
  };

  const handleDelete = (fileName: string, bucket: string) => {
    deleteFile.mutate({ fileName, bucket });
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'backup': 'bg-blue-100 text-blue-800 border-blue-200',
      'database': 'bg-green-100 text-green-800 border-green-200',
      'media': 'bg-purple-100 text-purple-800 border-purple-200',
      'document': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}>{type}</Badge>;
  };

  const getTotalUsedSpace = () => {
    return buckets.reduce((total, bucket) => {
      const sizeInGB = parseFloat(bucket.size.replace(' GB', '').replace(' MB', '')) / (bucket.size.includes('MB') ? 1000 : 1);
      return total + sizeInGB;
    }, 0).toFixed(1);
  };

  if (!wasabiIntegration) {
    return (
      <div className="p-4 space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <HardDrive className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-orange-900 mb-2">Integração Wasabi não configurada</h2>
            <p className="text-orange-700 mb-6">
              Para usar o armazenamento Wasabi, você precisa configurar uma integração primeiro.
            </p>
            <Button className="bg-orange-600 hover:bg-orange-700">
              Configurar Integração
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-blue-900 flex items-center gap-3">
            <HardDrive className="h-6 w-6 lg:h-8 lg:w-8" />
            Wasabi Storage
          </h1>
          <p className="text-blue-600 mt-1">Gerencie arquivos no armazenamento Wasabi</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoadingBuckets || isLoadingFiles}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingBuckets || isLoadingFiles) ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
              <div>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">{buckets.length}</p>
                <p className="text-xs lg:text-sm text-blue-600">Buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <File className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
              <div>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">{files.length}</p>
                <p className="text-xs lg:text-sm text-blue-600">Arquivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
              <div>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">{getTotalUsedSpace()} GB</p>
                <p className="text-xs lg:text-sm text-blue-600">Usado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
              <div>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">{(100 - parseFloat(getTotalUsedSpace())).toFixed(1)} GB</p>
                <p className="text-xs lg:text-sm text-blue-600">Disponível</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos
          </CardTitle>
          <CardDescription>Envie arquivos para seus buckets no Wasabi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Bucket de Destino
              </label>
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um bucket</option>
                {buckets.map((bucket) => (
                  <option key={bucket.name} value={bucket.name}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Arquivos
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <Button 
            onClick={handleFileUpload} 
            disabled={uploadFiles.isPending || !selectedFiles || !selectedBucket}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadFiles.isPending ? 'Enviando...' : 'Fazer Upload'}
          </Button>
        </CardContent>
      </Card>

      {/* Buckets List */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Buckets Disponíveis
          </CardTitle>
          <CardDescription>Lista de buckets no seu armazenamento Wasabi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <Card key={bucket.name} className="border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FolderOpen className="h-6 w-6 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{bucket.name}</h3>
                      <p className="text-sm text-gray-500">Criado em {bucket.creationDate}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-600">{bucket.size}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBucket(bucket.name)}
                      className={selectedBucket === bucket.name ? 'border-blue-500 bg-blue-50' : ''}
                    >
                      {selectedBucket === bucket.name ? 'Selecionado' : 'Selecionar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <File className="h-5 w-5" />
                Arquivos Armazenados
              </CardTitle>
              <CardDescription>Gerencie seus arquivos no Wasabi</CardDescription>
            </div>
            <div className="w-full lg:w-64">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Bucket</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Última Modificação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium max-w-xs truncate">{file.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.bucket}</Badge>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{getTypeBadge(file.type)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{file.lastModified}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file.name, file.bucket)}
                          disabled={downloadFile.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDelete(file.name, file.bucket)}
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
                <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
                <p className="text-sm">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Faça upload de arquivos para começar'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wasabi;
