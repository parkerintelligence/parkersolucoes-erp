
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
  email: string;
}

export const CompanyForm = () => {
  const [companies, setCompanies] = useState<Company[]>([
    { id: '1', name: 'Empresa A', cnpj: '12.345.678/0001-90', contact: 'João Silva', email: 'joao@empresaa.com' },
    { id: '2', name: 'Empresa B', cnpj: '98.765.432/0001-10', contact: 'Maria Santos', email: 'maria@empresab.com' },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact: '',
    email: ''
  });

  const handleSave = () => {
    if (!formData.name || !formData.cnpj) {
      toast({
        title: "Erro",
        description: "Nome da empresa e CNPJ são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newCompany: Company = {
      id: Date.now().toString(),
      ...formData
    };

    setCompanies([...companies, newCompany]);
    setFormData({ name: '', cnpj: '', contact: '', email: '' });
    setIsDialogOpen(false);
    
    toast({
      title: "Sucesso!",
      description: "Empresa cadastrada com sucesso.",
    });
  };

  const handleDelete = (id: string) => {
    setCompanies(companies.filter(company => company.id !== id));
    toast({
      title: "Empresa removida!",
      description: "A empresa foi removida com sucesso.",
    });
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Cadastro de Empresas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                <DialogDescription>Preencha os dados da empresa cliente.</DialogDescription>
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
                  <Label htmlFor="cnpj">CNPJ *</Label>
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
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className="hover:bg-blue-50">
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.cnpj}</TableCell>
                <TableCell>{company.contact}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
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
      </CardContent>
    </Card>
  );
};
