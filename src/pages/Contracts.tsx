
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
import { FileText, Plus, Edit, Trash2, Calendar, DollarSign, Building } from 'lucide-react';
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/useContracts';
import { useCompanies } from '@/hooks/useCompanies';

const Contracts = () => {
  const { data: contracts = [], isLoading } = useContracts();
  const { data: companies = [] } = useCompanies();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    contractId: string | null;
    contractTitle: string;
  }>({ open: false, contractId: null, contractTitle: '' });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    company_id: '',
    contract_number: '',
    total_value: 0,
    start_date: '',
    end_date: '',
    status: 'draft',
    budget_id: '',
    signed_date: ''
  });

  const handleSave = () => {
    if (!formData.title || !formData.company_id || !formData.contract_number || !formData.content) return;

    if (editingContract) {
      updateContract.mutate({ id: editingContract, updates: formData });
    } else {
      createContract.mutate(formData);
    }

    setFormData({
      title: '',
      content: '',
      company_id: '',
      contract_number: '',
      total_value: 0,
      start_date: '',
      end_date: '',
      status: 'draft',
      budget_id: '',
      signed_date: ''
    });
    setIsDialogOpen(false);
    setEditingContract(null);
  };

  const handleEdit = (contract: any) => {
    setFormData({
      title: contract.title || '',
      content: contract.content || '',
      company_id: contract.company_id || '',
      contract_number: contract.contract_number || '',
      total_value: contract.total_value || 0,
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      status: contract.status || 'draft',
      budget_id: contract.budget_id || '',
      signed_date: contract.signed_date || ''
    });
    setEditingContract(contract.id);
    setIsDialogOpen(true);
  };

  const handleDeleteContract = () => {
    if (deleteConfirmDialog.contractId) {
      deleteContract.mutate(deleteConfirmDialog.contractId);
      setDeleteConfirmDialog({ open: false, contractId: null, contractTitle: '' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Ativo</Badge>;
      case 'expired':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Expirado</Badge>;
      case 'cancelled':
        return <Badge className="bg-secondary text-muted-foreground border-border">Cancelado</Badge>;
      default:
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">Rascunho</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Empresa não encontrada';
  };

  const totalValue = contracts.reduce((sum, contract) => sum + (contract.total_value || 0), 0);
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const expiredContracts = contracts.filter(c => c.status === 'expired').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
        <div className="text-muted-foreground">Carregando contratos...</div>
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
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Preencha as informações do contrato.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-foreground">Título *</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nome do contrato"
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="contract_number" className="text-foreground">Número do Contrato *</Label>
                  <Input 
                    id="contract_number" 
                    value={formData.contract_number}
                    onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                    placeholder="CONT-001"
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="company_id" className="text-foreground">Empresa *</Label>
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
                  <Label htmlFor="content" className="text-foreground">Conteúdo *</Label>
                  <Textarea 
                    id="content" 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Conteúdo detalhado do contrato"
                    rows={3}
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="total_value" className="text-foreground">Valor Total</Label>
                  <Input 
                    id="total_value" 
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({...formData, total_value: parseFloat(e.target.value) || 0})}
                    placeholder="0,00"
                    className="bg-secondary border-border text-foreground placeholder-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date" className="text-foreground">Data Início</Label>
                    <Input 
                      id="start_date" 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date" className="text-foreground">Data Fim</Label>
                    <Input 
                      id="end_date" 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editingContract ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingContract(null);
                  setFormData({
                    title: '',
                    content: '',
                    company_id: '',
                    contract_number: '',
                    total_value: 0,
                    start_date: '',
                    end_date: '',
                    status: 'draft',
                    budget_id: '',
                    signed_date: ''
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
                  <p className="text-xl md:text-2xl font-bold text-foreground">{contracts.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{activeContracts}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{expiredContracts}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Expirados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Contratos
            </CardTitle>
            <CardDescription className="text-muted-foreground">Gerencie todos os contratos da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-card/50">
                      <TableHead className="text-muted-foreground">Contrato</TableHead>
                      <TableHead className="text-muted-foreground">Empresa</TableHead>
                      <TableHead className="text-muted-foreground">Número</TableHead>
                      <TableHead className="text-muted-foreground">Valor</TableHead>
                      <TableHead className="text-muted-foreground">Período</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} className="border-border hover:bg-card/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{contract.title}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{getCompanyName(contract.company_id)}</TableCell>
                        <TableCell className="text-muted-foreground">{contract.contract_number}</TableCell>
                        <TableCell className="text-foreground font-medium">{formatCurrency(contract.total_value || 0)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {contract.start_date && contract.end_date ? (
                            <div className="text-sm">
                              <div>{new Date(contract.start_date).toLocaleDateString('pt-BR')}</div>
                              <div className="text-muted-foreground">até {new Date(contract.end_date).toLocaleDateString('pt-BR')}</div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status || 'draft')}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(contract)}
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
                                contractId: contract.id, 
                                contractTitle: contract.title 
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
        itemName={deleteConfirmDialog.contractTitle}
        itemType="contrato"
        onConfirm={handleDeleteContract}
      />
    </div>
  );
};

export default Contracts;
