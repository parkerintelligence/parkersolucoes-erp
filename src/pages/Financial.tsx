
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileText,
  Calculator,
  TrendingUp
} from 'lucide-react';

const Financial = () => {
  const navigate = useNavigate();

  const financialItems = [
    {
      title: 'Empresas',
      description: 'Gerenciar empresas e clientes',
      icon: Building2,
      path: '/companies',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Serviços',
      description: 'Cadastro e gestão de serviços',
      icon: Users,
      path: '/services',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Orçamentos',
      description: 'Criar e gerenciar orçamentos',
      icon: Calculator,
      path: '/budgets',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Contratos',
      description: 'Gestão de contratos e acordos',
      icon: FileText,
      path: '/contracts',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <PageWrapper
      title="Painel Financeiro"
      subtitle="Gerencie todas as funcionalidades financeiras do sistema"
      icon={<DollarSign className="h-8 w-8 text-green-400" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {financialItems.map((item) => (
          <Card 
            key={item.title}
            className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer group"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-xl ${item.color} transition-colors duration-200`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {item.description}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                >
                  Acessar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estatísticas Rápidas */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-white mb-6">Estatísticas Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Empresas</p>
                  <p className="text-2xl font-bold text-white">-</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Orçamentos Ativos</p>
                  <p className="text-2xl font-bold text-white">-</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Contratos Vigentes</p>
                  <p className="text-2xl font-bold text-white">-</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Financial;
