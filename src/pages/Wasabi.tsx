
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, Upload, Trash2, RefreshCw, Search, File, Folder } from 'lucide-react';
import { useWasabi } from '@/hooks/useWasabi';

const Wasabi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  const { 
    files, 
    isLoadingFiles, 
    wasabiIntegration,
    uploadFiles,
    downloadFile,
    deleteFile,
    bucketName
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

    uploadFiles.mutate({ files: selectedFiles });
    setSelectedFiles(null);
  };

  const handleDownload = (fileName: string) => {
    downloadFile.mutate({ fileName });
  };

  const handleDelete = (fileName: string) => {
    deleteFile.mutate({ fileName });
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

  if (!wasabiIntegration) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-8 text-center">
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <HardDrive className="h-8 w-8" />
            Wasabi Storage
          </h1>
          <p className="text-blue-600 mt-1">
            Bucket: <span className="font-semibold">{bucketName}</span>
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoadingFiles}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Folder className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">1</p>
                <p className="text-sm text-blue-600">Bucket Ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{files.length}</p>
                <p className="text-sm text-blue-600">Arquivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {files.reduce((total, file) => {
                    const sizeInMB = parseFloat(file.size.replace(/[^\d.]/g, ''));
                    return total + (file.size.includes('GB') ? sizeInMB * 1000 : sizeInMB);
                  }, 0).toFixed(0)} MB
                </p>
                <p className="text-sm text-blue-600">Usado</p>
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
          <CardDescription>
            Envie arquivos para o bucket: <strong>{bucketName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button 
            onClick={handleFileUpload} 
            disabled={uploadFiles.isPending || !selectedFiles || selectedFiles.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadFiles.isPending ? 'Enviando...' : 'Fazer Upload'}
          </Button>
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
              <CardDescription>Bucket: {bucketName}</CardDescription>
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
          {isLoadingFiles ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Carregando arquivos...</p>
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
                      <TableCell className="font-medium max-w-xs truncate">{file.name}</TableCell>
                      <TableCell>{file.size}</TableCell>
                      <TableCell>{getTypeBadge(file.type)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{file.lastModified}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
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
                  <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
                  <p className="text-sm">
                    {searchTerm ? 'Tente ajustar sua busca' : 'Faça upload de arquivos para começar'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Wasabi;
