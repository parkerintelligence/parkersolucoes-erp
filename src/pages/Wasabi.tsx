
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, Upload, Trash2, RefreshCw, Search, FolderOpen, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';

const Wasabi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [bucketContents, setBucketContents] = useState<any[]>([]);
  
  const { data: integrations } = useIntegrations();
  const wasabiIntegration = integrations?.find(int => int.type === 'wasabi');

  // Dados simulados dos buckets (substituir pela API real do Wasabi)
  const mockBuckets = [
    { name: 'backups', creationDate: '2024-01-15', size: '2.3 GB' },
    { name: 'documents', creationDate: '2024-01-10', size: '856 MB' },
    { name: 'media', creationDate: '2024-01-05', size: '1.2 GB' },
  ];

  // Dados simulados dos arquivos (substituir pela API real do Wasabi)
  const mockFiles = [
    { 
      id: '1', 
      name: 'backup-2024-01-15.tar.gz', 
      size: '2.3 GB', 
      lastModified: '2024-01-15 14:30', 
      type: 'backup',
      bucket: 'backups'
    },
    { 
      id: '2', 
      name: 'database-dump.sql', 
      size: '156 MB', 
      lastModified: '2024-01-14 09:15', 
      type: 'database',
      bucket: 'backups'
    },
    { 
      id: '3', 
      name: 'images-archive.zip', 
      size: '854 MB', 
      lastModified: '2024-01-13 16:45', 
      type: 'media',
      bucket: 'media'
    },
    { 
      id: '4', 
      name: 'contracts-2024.pdf', 
      size: '45 MB', 
      lastModified: '2024-01-12 11:20', 
      type: 'document',
      bucket: 'documents'
    },
  ];

  const filteredFiles = bucketContents.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Inicializar com dados simulados
    setBuckets(mockBuckets);
    setBucketContents(mockFiles);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Aqui seria a chamada real para a API do Wasabi
      // const response = await fetch(`${wasabiIntegration?.base_url}/buckets`);
      // const data = await response.json();
      // setBuckets(data);
      
      // Simulação
      setTimeout(() => {
        setBuckets(mockBuckets);
        setBucketContents(mockFiles);
        setIsLoading(false);
        toast({
          title: "Atualizado!",
          description: "Lista de buckets e arquivos atualizada com sucesso.",
        });
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados do Wasabi.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um ou mais arquivos para upload.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedBucket) {
      toast({
        title: "Bucket não selecionado",
        description: "Selecione um bucket de destino.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Aqui seria a implementação real do upload para Wasabi
      // const formData = new FormData();
      // Array.from(selectedFiles).forEach(file => {
      //   formData.append('files', file);
      // });
      
      // const response = await fetch(`${wasabiIntegration?.base_url}/upload/${selectedBucket}`, {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Authorization': `Bearer ${wasabiIntegration?.api_token}`
      //   }
      // });

      // Simulação
      setTimeout(() => {
        setIsLoading(false);
        setSelectedFiles(null);
        toast({
          title: "Upload concluído!",
          description: `${selectedFiles.length} arquivo(s) enviado(s) para o bucket ${selectedBucket}.`,
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar arquivos para o Wasabi.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (fileName: string) => {
    // Aqui seria a implementação real do download
    toast({
      title: "Download iniciado",
      description: `Fazendo download de ${fileName}`,
    });
  };

  const handleDelete = (fileName: string) => {
    // Aqui seria a implementação real da exclusão
    toast({
      title: "Arquivo removido",
      description: `${fileName} foi removido com sucesso.`,
    });
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
      <div className="container mx-auto px-4 py-8">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <HardDrive className="h-8 w-8" />
            Wasabi Storage
          </h1>
          <p className="text-blue-600 mt-1">Gerencie arquivos no armazenamento Wasabi</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{buckets.length}</p>
                <p className="text-sm text-blue-600">Total de Buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{bucketContents.length}</p>
                <p className="text-sm text-blue-600">Total de Arquivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{getTotalUsedSpace()} GB</p>
                <p className="text-sm text-blue-600">Espaço Usado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{(100 - parseFloat(getTotalUsedSpace())).toFixed(1)} GB</p>
                <p className="text-sm text-blue-600">Espaço Disponível</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            disabled={isLoading || !selectedFiles || !selectedBucket}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? 'Enviando...' : 'Fazer Upload'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <Card key={bucket.name} className="border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FolderOpen className="h-6 w-6 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{bucket.name}</h3>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <File className="h-5 w-5" />
                Arquivos Armazenados
              </CardTitle>
              <CardDescription>Gerencie seus arquivos no Wasabi</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
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
                  <TableHead>Última Modificação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.bucket}</Badge>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{getTypeBadge(file.type)}</TableCell>
                    <TableCell>{file.lastModified}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDelete(file.name)}
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
