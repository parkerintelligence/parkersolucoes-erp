
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, DollarSign, FileText, Calendar, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Dashboard
        </h1>
        <p className="text-slate-600 text-sm">Visão geral do seu negócio</p>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">28</p>
                <p className="text-xs md:text-sm text-blue-600">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">R$ 15.240</p>
                <p className="text-xs md:text-sm text-blue-600">Receita Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">12</p>
                <p className="text-xs md:text-sm text-blue-600">Contratos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-blue-900">5</p>
                <p className="text-xs md:text-sm text-blue-600">Tarefas Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas movimentações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Novo contrato assinado</p>
                <p className="text-sm text-gray-600">Empresa XYZ - R$ 2.500/mês</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Concluído</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Orçamento enviado</p>
                <p className="text-sm text-gray-600">Empresa ABC - R$ 1.800</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Reunião agendada</p>
                <p className="text-sm text-gray-600">Hoje às 14h30</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Agendado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Tarefas
            </CardTitle>
            <CardDescription>Agenda dos próximos dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Backup mensal</p>
                <p className="text-sm text-gray-600">Hoje - 18:00</p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Hoje</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Revisão de contrato</p>
                <p className="text-sm text-gray-600">Amanhã - 10:00</p>
              </div>
              <Badge className="bg-gray-100 text-gray-800">Amanhã</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Apresentação proposta</p>
                <p className="text-sm text-gray-600">Quinta - 15:30</p>
              </div>
              <Badge className="bg-gray-100 text-gray-800">Esta semana</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
