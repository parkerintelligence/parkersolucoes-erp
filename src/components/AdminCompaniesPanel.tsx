
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Plus, Edit, Trash2 } from 'lucide-react';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies';
import { toast } from '@/hooks/use-toast';

export function AdminCompaniesPanel() {
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

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome da empresa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const companyData = {
      name: formData.name.trim(),
      cnpj: formData.cnpj.trim() || null,
      contact: formData.contact.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null
    };

    if (editingCompany) {
      updateCompany.mutate({ id: editingCompany, updates: companyData });
    } else {
      createCompany.mutate(companyData);
    }

    resetForm();
  };

  const resetForm = () => {
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

  if (isLoading) {
    return <div className="text-center py-4">Carregando empresas...</div>;
  }

  return (
    <Card className="border-green-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <Building className="h-5 w-5" />
              Gerenciamento de Empresas
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie as empresas do sistema (Apenas usuários Master)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
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
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={handleSave}
                  disabled={createCompany.isPending || updateCompany.isPending}
                >
                  {editingCompany ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma empresa cadastrada ainda.</p>
            <p className="text-sm mt-2">Adicione empresas para começar a gerenciar contratos e orçamentos.</p>
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
                <TableRow key={company.id} className="hover:bg-green-50">
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
                        onClick={() => deleteCompany.mutate(company.id)}
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
  );
}
