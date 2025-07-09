
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  FileText, 
  Settings, 
  Building, 
  DollarSign,
  TrendingUp,
  BarChart3,
  CreditCard
} from 'lucide-react';

const Financial = () => {
  const navigate = useNavigate();

  const financialModules = [
    {
      title: 'Serviços',
      description: 'Gerenciar catálogo de serviços e preços',
      icon: Settings,
      path: '/services',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Orçamentos',
      description: 'Criar e gerenciar orçamentos para clientes',
      icon: Calculator,
      path: '/budgets',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Contratos',
      description: 'Administrar contratos e documentos',
      icon: FileText,
      path: '/contracts',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Empresas',
      description: 'Gerenciar cadastro de empresas clientes',
      icon: Building,
      path: '/companies',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Gerencie todos os aspectos financeiros do seu negócio
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 45.320</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Ativos</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              8 aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Vigentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              3 vencem este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Cadastradas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              5 novas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos Financeiros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Módulos Financeiros
          </CardTitle>
          <CardDescription>
            Acesse os diferentes módulos do sistema financeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {financialModules.map((module) => (
              <Card 
                key={module.title} 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-primary/20"
                onClick={() => handleModuleClick(module.path)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full ${module.color} flex items-center justify-center mx-auto mb-4 transition-all duration-200`}>
                    <module.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {module.description}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModuleClick(module.path);
                    }}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesso rápido às funções mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate('/budgets')}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Novo Orçamento
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/contracts')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Novo Contrato
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/services')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Cadastrar Serviço
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/companies')}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
