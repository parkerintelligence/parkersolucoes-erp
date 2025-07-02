import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, Plus, Eye, Edit, FileText } from 'lucide-react';
import { useBudgets, useCreateBudget, useBudgetItems, useCreateBudgetItem } from '@/hooks/useBudgets';
import { format } from 'date-fns';

const Budgets = () => {
  const { data: budgets = [], isLoading } = useBudgets();
  const createBudget = useCreateBudget();
  const createBudgetItem = useCreateBudgetItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    budget_number: '',
    company_name: '',
    title: '',
    description: '',
    valid_until: ''
  });

  const { data: budgetItems = [] } = useBudgetItems(selectedBudget || '');

  const handleSave = () => {
    if (!formData.title || !formData.company_name) return;

    const budgetNumber = formData.budget_number || `ORC-${Date.now()}`;
    
    createBudget.mutate({
      ...formData,
      budget_number: budgetNumber,
      company_id: '', // Será removido ou usado apenas como referência
      status: 'draft',
      total_amount: 0
    });

    setFormData({ budget_number: '', company_name: '', title: '', description: '', valid_until: '' });
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-orange-100 text-orange-800',
    };
    const labels = {
      'draft': 'Rascunho',
      'sent': 'Enviado',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'expired': 'Expirado',
    };
    return <Badge className={colors[status]}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-slate-600">Carregando orçamentos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              Orçamentos
            </h1>
            <p className="text-slate-600 text-sm">Gerencie orçamentos de serviços de TI</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Orçamento</DialogTitle>
                <DialogDescription>
                  Preencha os dados do orçamento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget_number">Número do Orçamento</Label>
                  <Input 
                    id="budget_number" 
                    placeholder="Deixe vazio para gerar automaticamente"
                    value={formData.budget_number}
                    onChange={(e) => setFormData({...formData, budget_number: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input 
                    id="company_name" 
                    placeholder="Digite o nome da empresa"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input 
                    id="title" 
                    placeholder="Título do orçamento"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descrição do orçamento"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valid_until">Válido até</Label>
                  <Input 
                    id="valid_until" 
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                  Criar Orçamento
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Orçamentos Criados</CardTitle>
            <CardDescription>Lista de todos os orçamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum orçamento criado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => (
                    <TableRow key={budget.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{budget.budget_number}</TableCell>
                      <TableCell>{budget.companies?.name || 'N/A'}</TableCell>
                      <TableCell>{budget.title}</TableCell>
                      <TableCell>R$ {(budget.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(budget.status || 'draft')}</TableCell>
                      <TableCell>{format(new Date(budget.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedBudget(budget.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{budgets.length}</p>
                  <p className="text-sm text-blue-600">Total de Orçamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{budgets.filter(b => b.status === 'approved').length}</p>
                  <p className="text-sm text-green-600">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-900">{budgets.filter(b => b.status === 'sent').length}</p>
                  <p className="text-sm text-yellow-600">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">
                    R$ {budgets.reduce((sum, b) => sum + (b.total_amount || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-purple-600">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Budgets;
