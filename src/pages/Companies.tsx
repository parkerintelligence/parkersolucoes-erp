
import React, { useState } from 'react';
import { Building2, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageWrapper } from '@/components/PageWrapper';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useCompanies } from '@/hooks/useCompanies';

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { getResponsiveClasses, getGridCols } = useResponsiveLayout();
  const classes = getResponsiveClasses();
  
  const { 
    companies, 
    isLoading, 
    createCompany, 
    updateCompany, 
    deleteCompany 
  } = useCompanies();

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj?.includes(searchTerm)
  ) || [];

  const headerActions = (
    <>
      <Button className="bg-blue-600 hover:bg-blue-700">
        <Plus className="mr-2 h-4 w-4" />
        Nova Empresa
      </Button>
    </>
  );

  return (
    <PageWrapper
      title="Empresas"
      subtitle="Gerencie suas empresas cadastradas"
      icon={<Building2 className="h-6 w-6 text-blue-400" />}
      headerActions={headerActions}
    >
      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button variant="outline" className="border-slate-600 text-gray-200 hover:bg-slate-700">
              <Filter className="mr-2 h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className={`${classes.grid} grid-cols-1 md:grid-cols-3`}>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{companies?.length || 0}</p>
                <p className="text-sm text-gray-400">Total de Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {companies?.filter(c => c.email).length || 0}
                </p>
                <p className="text-sm text-gray-400">Com Email</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {companies?.filter(c => c.cnpj).length || 0}
                </p>
                <p className="text-sm text-gray-400">Com CNPJ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Empresas Cadastradas
            <Badge variant="secondary" className="bg-slate-700">
              {filteredCompanies.length} empresa(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Carregando empresas...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Building2 className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhuma empresa encontrada</p>
              {searchTerm && (
                <p className="text-sm mt-2">
                  Tente ajustar os filtros ou cadastrar uma nova empresa
                </p>
              )}
            </div>
          ) : (
            <div className={`${classes.grid} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}>
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white">{company.name}</h3>
                      {company.email && (
                        <p className="text-sm text-gray-400">{company.email}</p>
                      )}
                      {company.phone && (
                        <p className="text-sm text-gray-400">{company.phone}</p>
                      )}
                      {company.cnpj && (
                        <Badge variant="outline" className="border-slate-500 text-gray-300">
                          CNPJ: {company.cnpj}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 border-slate-500 text-gray-300 hover:bg-slate-600">
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-slate-500 text-gray-300 hover:bg-slate-600">
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Companies;
