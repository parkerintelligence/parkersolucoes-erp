
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2, Download, Eye, File, Folder, Search } from 'lucide-react';
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { useCompanies } from '@/hooks/useCompanies';

const Documents = () => {
  const { data: documents = [], isLoading } = useDocuments();
  const { data: companies = [] } = useCompanies();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_id: '',
    category: '',
    type: 'contract',
    status: 'active',
    file_path: '',
    tags: ''
  });

  const handleSave = () => {
    if (!formData.title) return;

    if (editingDocument) {
      updateDocument.mutate({ id: editingDocument, updates: formData });
    } else {
      createDocument.mutate(formData);
    }

    setFormData({
      title: '',
      description: '',
      company_id: '',
      category: '',
      type: 'contract',
      status: 'active',
      file_path: '',
      tags: ''
    });
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  const handleEdit = (document: any) => {
    setFormData({
      title: document.title || '',
      description: document.description || '',
      company_id: document.company_id || '',
      category: document.category || '',
      type: document.type || 'contract',
      status: document.status || 'active',
      file_path: document.file_path || '',
      tags: document.tags || ''
    });
    setEditingDocument(document.id);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Ativo</Badge>;
      case 'archived':
        return <Badge className="bg-gray-700 text-gray-400 border-gray-600">Arquivado</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Rascunho</Badge>;
      default:
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Pendente</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'invoice':
        return <File className="h-4 w-4 text-green-400" />;
      case 'report':
        return <FileText className="h-4 w-4 text-purple-400" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Não especificada';
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDocuments = documents.length;
  const activeDocuments = documents.filter(d => d.status === 'active').length;
  const archivedDocuments = documents.filter(d => d.status === 'archived').length;
  const draftDocuments = documents.filter(d => d.status === 'draft').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="text-gray-400">Carregando documentos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingDocument ? 'Editar Documento' : 'Novo Documento'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Preencha as informações do documento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-gray-200">Título *</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nome do documento"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-gray-200">Descrição</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do documento"
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type" className="text-gray-200">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="contract" className="text-white hover:bg-gray-600">Contrato</SelectItem>
                        <SelectItem value="invoice" className="text-white hover:bg-gray-600">Fatura</SelectItem>
                        <SelectItem value="report" className="text-white hover:bg-gray-600">Relatório</SelectItem>
                        <SelectItem value="proposal" className="text-white hover:bg-gray-600">Proposta</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-gray-600">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-gray-200">Categoria</Label>
                    <Input 
                      id="category" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Ex: Jurídico, Financeiro"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="company_id" className="text-gray-200">Empresa</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-white hover:bg-gray-600">
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tags" className="text-gray-200">Tags (separadas por vírgula)</Label>
                  <Input 
                    id="tags" 
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="tag1, tag2, tag3"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editingDocument ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingDocument(null);
                  setFormData({
                    title: '',
                    description: '',
                    company_id: '',
                    category: '',
                    type: 'contract',
                    status: 'active',
                    file_path: '',
                    tags: ''
                  });
                }} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{totalDocuments}</p>
                  <p className="text-xs md:text-sm text-gray-400">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <File className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{activeDocuments}</p>
                  <p className="text-xs md:text-sm text-gray-400">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Folder className="h-6 w-6 md:h-8 md:w-8 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{archivedDocuments}</p>
                  <p className="text-xs md:text-sm text-gray-400">Arquivados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Edit className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{draftDocuments}</p>
                  <p className="text-xs md:text-sm text-gray-400">Rascunhos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
            <CardDescription className="text-gray-400">
              {filteredDocuments.length} documento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">
                  {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento cadastrado'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Documento</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300">Empresa</TableHead>
                      <TableHead className="text-gray-300">Categoria</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-right text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(document.type)}
                            <div>
                              <div className="font-medium text-gray-200">{document.title}</div>
                              {document.description && (
                                <div className="text-sm text-gray-400 truncate max-w-xs">{document.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 capitalize">{document.type}</TableCell>
                        <TableCell className="text-gray-200">{getCompanyName(document.company_id)}</TableCell>
                        <TableCell className="text-gray-300">{document.category || '-'}</TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(document)}
                              className="border-gray-600 text-gray-200 hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-600 text-red-400 hover:bg-red-900/30"
                              onClick={() => deleteDocument.mutate(document.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documents;
