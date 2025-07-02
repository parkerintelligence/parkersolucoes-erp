
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: companies = [], isLoading } = useCompanies();

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Empresas
          </h1>
          <p className="text-slate-600 text-sm">Gerencie suas empresas clientes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">{companies.length}</p>
                <p className="text-xs md:text-sm text-blue-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Badge className="h-6 w-6 md:h-8 md:w-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center flex-shrink-0">A</Badge>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">{companies.filter(c => c.name).length}</p>
                <p className="text-xs md:text-sm text-blue-600">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">{companies.filter(c => c.email).length}</p>
                <p className="text-xs md:text-sm text-blue-600">Com E-mail</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Phone className="h-6 w-6 md:h-8 md:w-8 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">{companies.filter(c => c.phone).length}</p>
                <p className="text-xs md:text-sm text-blue-600">Com Telefone</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Lista de Empresas
              </CardTitle>
              <CardDescription>Gerencie informações das suas empresas</CardDescription>
            </div>
            <div className="w-full lg:w-64">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando empresas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                    <TableHead className="hidden lg:table-cell">Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.cnpj || '-'}</TableCell>
                      <TableCell>{company.email || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{company.phone || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{company.contact || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCompanies.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhuma empresa encontrada</p>
                  <p className="text-sm">
                    {searchTerm ? 'Tente ajustar sua busca' : 'Cadastre sua primeira empresa'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Companies;
