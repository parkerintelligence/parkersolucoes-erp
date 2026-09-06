
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
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
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
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    documentId: string | null;
    documentTitle: string;
  }>({ open: false, documentId: null, documentTitle: '' });
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

  const handleDeleteDocument = () => {
    if (deleteConfirmDialog.documentId) {
      deleteDocument.mutate(deleteConfirmDialog.documentId);
      setDeleteConfirmDialog({ open: false, documentId: null, documentTitle: '' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Ativo</Badge>;
      case 'archived':
        return <Badge className="bg-secondary text-muted-foreground border-border">Arquivado</Badge>;
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
        return <File className="h-4 w-4 text-muted-foreground" />;
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
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
        <div className="text-muted-foreground">Carregando documentos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingDocument ? 'Editar Documento' : 'Novo Documento'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Preencha as informações do documento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-foreground">Título *</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nome do documento"
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-foreground">Descrição</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do documento"
                    rows={3}
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type" className="text-foreground">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-secondary border-border">
                        <SelectItem value="contract" className="text-foreground hover:bg-muted">Contrato</SelectItem>
                        <SelectItem value="invoice" className="text-foreground hover:bg-muted">Fatura</SelectItem>
                        <SelectItem value="report" className="text-foreground hover:bg-muted">Relatório</SelectItem>
                        <SelectItem value="proposal" className="text-foreground hover:bg-muted">Proposta</SelectItem>
                        <SelectItem value="other" className="text-foreground hover:bg-muted">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-foreground">Categoria</Label>
                    <Input 
                      id="category" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Ex: Jurídico, Financeiro"
                      className="bg-secondary border-border text-foreground placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="company_id" className="text-foreground">Empresa</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border-border">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-foreground hover:bg-muted">
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tags" className="text-foreground">Tags (separadas por vírgula)</Label>
                  <Input 
                    id="tags" 
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="tag1, tag2, tag3"
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
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
                }} className="border-border text-foreground hover:bg-secondary">
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{totalDocuments}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <File className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{activeDocuments}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Folder className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{archivedDocuments}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Arquivados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Edit className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{draftDocuments}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Rascunhos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-secondary border-border text-foreground placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {filteredDocuments.length} documento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento cadastrado'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-card/50">
                      <TableHead className="text-muted-foreground">Documento</TableHead>
                      <TableHead className="text-muted-foreground">Tipo</TableHead>
                      <TableHead className="text-muted-foreground">Empresa</TableHead>
                      <TableHead className="text-muted-foreground">Categoria</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id} className="border-border hover:bg-card/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(document.type)}
                            <div>
                              <div className="font-medium text-foreground">{document.title}</div>
                              {document.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">{document.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">{document.type}</TableCell>
                        <TableCell className="text-foreground">{getCompanyName(document.company_id)}</TableCell>
                        <TableCell className="text-muted-foreground">{document.category || '-'}</TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(document)}
                              className="border-border text-foreground hover:bg-secondary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-600 text-red-400 hover:bg-red-900/30"
                              onClick={() => setDeleteConfirmDialog({ 
                                open: true, 
                                documentId: document.id, 
                                documentTitle: document.title 
                              })}
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

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteConfirmDialog.open}
        onOpenChange={(open) => setDeleteConfirmDialog({ ...deleteConfirmDialog, open })}
        itemName={deleteConfirmDialog.documentTitle}
        itemType="documento"
        onConfirm={handleDeleteDocument}
      />
    </div>
  );
};

export default Documents;
