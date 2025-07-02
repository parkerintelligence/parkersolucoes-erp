

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Search, Folder, File, Eye } from 'lucide-react';

const Documents = () => {
  const documents = [
    { id: '1', name: 'Certificado_Digital_ClienteA.p12', client: 'Cliente A', type: 'Certificado', size: '2.3 KB', modified: '2024-06-25', category: 'Segurança' },
    { id: '2', name: 'Termo_Servico_ClienteB.pdf', client: 'Cliente B', type: 'PDF', size: '156 KB', modified: '2024-06-28', category: 'Contrato' },
    { id: '3', name: 'Licenca_Software_Sistema.txt', client: 'Cliente C', type: 'Licença', size: '1.2 KB', modified: '2024-06-20', category: 'Licença' },
    { id: '4', name: 'Manual_Usuario_ERP.pdf', client: 'Cliente A', type: 'PDF', size: '2.8 MB', modified: '2024-06-15', category: 'Manual' },
    { id: '5', name: 'Backup_Config_Firewall.cfg', client: 'Cliente D', type: 'Config', size: '15 KB', modified: '2024-06-29', category: 'Configuração' },
  ];

  const folders = [
    { name: 'Cliente A', files: 8, size: '15.2 MB' },
    { name: 'Cliente B', files: 12, size: '23.8 MB' },
    { name: 'Cliente C', files: 6, size: '8.9 MB' },
    { name: 'Cliente D', files: 4, size: '5.1 MB' },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'Certificado':
        return <File className="h-4 w-4 text-green-500" />;
      case 'Config':
        return <File className="h-4 w-4 text-blue-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Segurança': 'bg-red-100 text-red-800 border-red-200',
      'Contrato': 'bg-blue-100 text-blue-800 border-blue-200',
      'Licença': 'bg-green-100 text-green-800 border-green-200',
      'Manual': 'bg-purple-100 text-purple-800 border-purple-200',
      'Configuração': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge className={colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'}>{category}</Badge>;
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documento
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{documents.length}</p>
                  <p className="text-sm text-blue-600">Documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{folders.length}</p>
                  <p className="text-sm text-blue-600">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">53 MB</p>
                  <p className="text-sm text-blue-600">Tamanho Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">3</p>
                  <p className="text-sm text-blue-600">Uploads Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar documentos..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Pastas por Cliente
              </CardTitle>
              <CardDescription>Organização por cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {folders.map((folder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">{folder.name}</p>
                        <p className="text-sm text-gray-600">{folder.files} arquivos</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{folder.size}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="lg:col-span-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Documentos Recentes</CardTitle>
              <CardDescription>Últimos documentos adicionados ou modificados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Modificado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-blue-50">
                      <TableCell className="flex items-center gap-2">
                        {getFileIcon(doc.type)}
                        <span className="font-medium">{doc.name}</span>
                      </TableCell>
                      <TableCell>{doc.client}</TableCell>
                      <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell className="text-gray-600">{doc.modified}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* OwnCloud Integration Status */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Status da Integração OwnCloud</CardTitle>
            <CardDescription>Conectividade e sincronização com o servidor de documentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900">Servidor Online</p>
                  <p className="text-sm text-green-600">Conectado e funcionando</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-blue-900">Sincronização Ativa</p>
                  <p className="text-sm text-blue-600">Última sync: 2 min atrás</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Espaço Disponível</p>
                  <p className="text-sm text-gray-600">1.2 GB de 5 GB usados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  export default Documents;
