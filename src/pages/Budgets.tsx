
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
import { Progress } from '@/components/ui/progress';
import { DollarSign, Plus, Edit, Trash2, Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';

const Budgets = () => {
  const { data: budgets = [], isLoading } = useBudgets();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    spent: 0,
    category: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });

  const handleSave = () => {
    if (!formData.title || !formData.amount) return;

    if (editingBudget) {
      updateBudget.mutate({ id: editingBudget, updates: formData });
    } else {
      createBudget.mutate(formData);
    }

    setFormData({
      title: '',
      description: '',
      amount: 0,
      spent: 0,
      category: '',
      start_date: '',
      end_date: '',
      status: 'active'
    });
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget: any) => {
    setFormData({
      title: budget.title || '',
      description: budget.description || '',
      amount: budget.amount || 0,
      spent: budget.spent || 0,
      category: budget.category || '',
      start_date: budget.start_date || '',
      end_date: budget.end_date || '',
      status: budget.status || 'active'
    });
    setEditingBudget(budget.id);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">Ativo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">Concluído</Badge>;
      case 'exceeded':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Excedido</Badge>;
      default:
        return <Badge className="bg-gray-700 text-gray-400 border-gray-600">Pausado</Badge>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const averageUsage = budgets.length > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <div className="text-gray-400">Carregando orçamentos...</div>
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
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editingBudget ? 'Edite as informações do orçamento.' : 'Crie um novo orçamento para controle financeiro.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-gray-200">Título *</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nome do orçamento"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-gray-200">Descrição</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do orçamento"
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="text-gray-200">Valor Orçado *</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      placeholder="0,00"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spent" className="text-gray-200">Valor Gasto</Label>
                    <Input 
                      id="spent" 
                      type="number"
                      step="0.01"
                      value={formData.spent}
                      onChange={(e) => setFormData({...formData, spent: parseFloat(e.target.value) || 0})}
                      placeholder="0,00"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-gray-200">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="marketing" className="text-white hover:bg-gray-600">Marketing</SelectItem>
                      <SelectItem value="infraestrutura" className="text-white hover:bg-gray-600">Infraestrutura</SelectItem>
                      <SelectItem value="desenvolvimento" className="text-white hover:bg-gray-600">Desenvolvimento</SelectItem>
                      <SelectItem value="operacional" className="text-white hover:bg-gray-600">Operacional</SelectItem>
                      <SelectItem value="treinamento" className="text-white hover:bg-gray-600">Treinamento</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {editingBudget ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingBudget(null);
                  setFormData({
                    title: '',
                    description: '',
                    amount: 0,
                    spent: 0,
                    category: '',
                    start_date: '',
                    end_date: '',
                    status: 'active'
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
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
                  <p className="text-xs md:text-sm text-gray-400">Total Orçado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
                  <p className="text-xs md:text-sm text-gray-400">Total Gasto</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalBudget - totalSpent)}</p>
                  <p className="text-xs md:text-sm text-gray-400">Disponível</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">{budgets.length}</p>
                  <p className="text-xs md:text-sm text-gray-400">Orçamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budgets List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Orçamentos
            </CardTitle>
            <CardDescription className="text-gray-400">Controle e acompanhamento de orçamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum orçamento cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Orçamento</TableHead>
                      <TableHead className="text-gray-300">Categoria</TableHead>
                      <TableHead className="text-gray-300">Orçado</TableHead>
                      <TableHead className="text-gray-300">Gasto</TableHead>
                      <TableHead className="text-gray-300">Progresso</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-right text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => {
                      const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                      return (
                        <TableRow key={budget.id} className="border-gray-700 hover:bg-gray-800/30">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-200">{budget.title}</div>
                              {budget.description && (
                                <div className="text-sm text-gray-400">{budget.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300 capitalize">{budget.category || '-'}</TableCell>
                          <TableCell className="text-gray-200 font-medium">{formatCurrency(budget.amount)}</TableCell>
                          <TableCell className="text-gray-200">{formatCurrency(budget.spent)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={Math.min(percentage, 100)} className="h-2" />
                              <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(budget.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEdit(budget)}
                                className="border-gray-600 text-gray-200 hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-red-600 text-red-400 hover:bg-red-900/30"
                                onClick={() => deleteBudget.mutate(budget.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default Budgets;
