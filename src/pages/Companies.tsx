
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies';

const Companies = () => {
  const { isAuthenticated } = useAuth();
  const { data: companies = [], isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact: '',
    email: '',
    phone: '',
    address: ''
  });

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSave = () => {
    if (!formData.name) {
      return;
    }

    if (editingCompany) {
      updateCompany.mutate({ id: editingCompany, updates: formData });
    } else {
      createCompany.mutate(formData);
    }

    setFormData({ name: '', cnpj: '', contact: '', email: '', phone: '', address: '' });
    setIsDialogOpen(false);
    setEditingCompany(null);
  };

  const handleEdit = (company: any) => {
    setFormData({
      name: company.name || '',
      cnpj: company.cnpj || '',
      contact: company.contact || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || ''
    });
    setEditingCompany(company.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCompany.mutate(id);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-slate-600">Carregando empresas...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Building className="h-8 w-8" />
              Cadastro de Empresas
            </h1>
            <p className="text-blue-600">Gerencie as empresas cadastradas no sistema</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany ? 'Edite os dados da empresa.' : 'Preencha os dados da empresa cliente.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome da empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input 
                    id="contact" 
                    placeholder="Nome do responsável"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="email@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea 
                    id="address" 
                    placeholder="Endereço completo"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                  {editingCompany ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingCompany(null);
                  setFormData({ name: '', cnpj: '', contact: '', email: '', phone: '', address: '' });
                }}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Empresas Cadastradas</CardTitle>
            <CardDescription>Lista de todas as empresas registradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma empresa cadastrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.cnpj || '-'}</TableCell>
                      <TableCell>{company.contact || '-'}</TableCell>
                      <TableCell>{company.email || '-'}</TableCell>
                      <TableCell>{company.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(company.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{companies.length}</p>
                  <p className="text-sm text-blue-600">Total de Empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{companies.filter(c => c.cnpj).length}</p>
                  <p className="text-sm text-green-600">Com CNPJ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{companies.filter(c => c.email).length}</p>
                  <p className="text-sm text-purple-600">Com E-mail</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Companies;
