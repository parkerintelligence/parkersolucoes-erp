
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, Upload, Trash2, RefreshCw, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Wasabi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dados simulados dos arquivos no Wasabi
  const files = [
    { id: '1', name: 'backup-2024-01-15.tar.gz', size: '2.3 GB', lastModified: '2024-01-15 14:30', type: 'backup' },
    { id: '2', name: 'database-dump.sql', size: '156 MB', lastModified: '2024-01-14 09:15', type: 'database' },
    { id: '3', name: 'images-archive.zip', size: '854 MB', lastModified: '2024-01-13 16:45', type: 'media' },
    { id: '4', name: 'logs-2024-01.txt', size: '45 MB', lastModified: '2024-01-12 11:20', type: 'logs' },
  ];

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    setIsLoading(true);
    // Simular carregamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Atualizado!",
        description: "Lista de arquivos atualizada com sucesso.",
      });
    }, 1000);
  };

  const handleDownload = (fileName: string) => {
    toast({
      title: "Download iniciado",
      description: `Fazendo download de ${fileName}`,
    });
  };

  const handleDelete = (fileName: string) => {
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
      'logs': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}>{type}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <HardDrive className="h-8 w-8" />
              Wasabi Storage
            </h1>
            <p className="text-blue-600">Gerencie arquivos no armazenamento Wasabi</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{files.length}</p>
                  <p className="text-sm text-blue-600">Total de Arquivos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">3.4 GB</p>
                  <p className="text-sm text-blue-600">Espaço Usado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">24</p>
                  <p className="text-sm text-blue-600">Uploads Este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">96.6 GB</p>
                  <p className="text-sm text-blue-600">Espaço Disponível</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Arquivos */}
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-blue-900">Arquivos no Wasabi</CardTitle>
                <CardDescription>Gerencie seus arquivos armazenados</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Última Modificação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{getTypeBadge(file.type)}</TableCell>
                    <TableCell>{file.lastModified}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
                          className="text-red-600 hover:text-red-700"
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
              <div className="text-center py-8 text-gray-500">
                Nenhum arquivo encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Wasabi;
