
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, DollarSign, FileText, Calendar, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">28</p>
                  <p className="text-xs md:text-sm text-gray-400">Empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">R$ 15.240</p>
                  <p className="text-xs md:text-sm text-gray-400">Receita Mensal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">12</p>
                  <p className="text-xs md:text-sm text-gray-400">Contratos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white">5</p>
                  <p className="text-xs md:text-sm text-gray-400">Tarefas Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de informações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
              <CardDescription className="text-gray-400">Últimas movimentações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Novo contrato assinado</p>
                  <p className="text-sm text-gray-400">Empresa XYZ - R$ 2.500/mês</p>
                </div>
                <Badge className="bg-green-600 text-white">Concluído</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Orçamento enviado</p>
                  <p className="text-sm text-gray-400">Empresa ABC - R$ 1.800</p>
                </div>
                <Badge className="bg-yellow-600 text-white">Pendente</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Reunião agendada</p>
                  <p className="text-sm text-gray-400">Hoje às 14h30</p>
                </div>
                <Badge className="bg-blue-600 text-white">Agendado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Tarefas
              </CardTitle>
              <CardDescription className="text-gray-400">Agenda dos próximos dias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Backup mensal</p>
                  <p className="text-sm text-gray-400">Hoje - 18:00</p>
                </div>
                <Badge className="bg-orange-600 text-white">Hoje</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Revisão de contrato</p>
                  <p className="text-sm text-gray-400">Amanhã - 10:00</p>
                </div>
                <Badge className="bg-gray-600 text-white">Amanhã</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Apresentação proposta</p>
                  <p className="text-sm text-gray-400">Quinta - 15:30</p>
                </div>
                <Badge className="bg-gray-600 text-white">Esta semana</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
