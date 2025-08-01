
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Ativo</Badge>;
      case 'expired':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Expirado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-700 text-gray-400 border-gray-600">Cancelado</Badge>;
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
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <div className="text-gray-400">Carregando contratos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Preencha as informações do contrato.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-gray-200">Título *</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nome do contrato"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="contract_number" className="text-gray-200">Número do Contrato *</Label>
                  <Input 
                    id="contract_number" 
                    value={formData.contract_number}
                    onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                    placeholder="CONT-001"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="company_id" className="text-gray-200">Empresa *</Label>
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
                  <Label htmlFor="content" className="text-gray-200">Conteúdo *</Label>
                  <Textarea 
                    id="content" 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Conteúdo detalhado do contrato"
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="total_value" className="text-gray-200">Valor Total</Label>
                  <Input 
                    id="total_value" 
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({...formData, total_value: parseFloat(e.target.value) || 0})}
                    placeholder="0,00"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date" className="text-gray-200">Data Início</Label>
                    <Input 
                      id="start_date" 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date" className="text-gray-200">Data Fim</Label>
                    <Input 
                      id="end_date" 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
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
                  <p className="text-xl md:text-2xl font-bold text-white">{contracts.length}</p>
                  <p className="text-xs md:text-sm text-gray-400">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{activeContracts}</p>
                  <p className="text-xs md:text-sm text-gray-400">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{expiredContracts}</p>
                  <p className="text-xs md:text-sm text-gray-400">Expirados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
                  <p className="text-xs md:text-sm text-gray-400">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Contratos
            </CardTitle>
            <CardDescription className="text-gray-400">Gerencie todos os contratos da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum contrato cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Contrato</TableHead>
                      <TableHead className="text-gray-300">Empresa</TableHead>
                      <TableHead className="text-gray-300">Número</TableHead>
                      <TableHead className="text-gray-300">Valor</TableHead>
                      <TableHead className="text-gray-300">Período</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-right text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-200">{contract.title}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-200">{getCompanyName(contract.company_id)}</TableCell>
                        <TableCell className="text-gray-300">{contract.contract_number}</TableCell>
                        <TableCell className="text-gray-200 font-medium">{formatCurrency(contract.total_value || 0)}</TableCell>
                        <TableCell className="text-gray-300">
                          {contract.start_date && contract.end_date ? (
                            <div className="text-sm">
                              <div>{new Date(contract.start_date).toLocaleDateString('pt-BR')}</div>
                              <div className="text-gray-400">até {new Date(contract.end_date).toLocaleDateString('pt-BR')}</div>
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
                              className="border-gray-600 text-gray-200 hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-600 text-red-400 hover:bg-red-900/30"
                              onClick={() => deleteContract.mutate(contract.id)}
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

export default Contracts;
