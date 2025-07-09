
import { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, BarChart3, RefreshCw } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const Financial = () => {
  const { data: integrations = [] } = useIntegrations();
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState({
    balance: 0,
    revenue: 0,
    expenses: 0,
    transactions: []
  });

  const bomControleIntegration = integrations.find(integration => 
    integration.type === 'bomcontrole' && integration.is_active
  );

  const fetchFinancialData = async () => {
    if (!bomControleIntegration) {
      toast({
        title: "Integração não configurada",
        description: "Configure a integração com o Bom Controle no painel de administração.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock data - substituir pela integração real com Bom Controle
      setTimeout(() => {
        setFinancialData({
          balance: 25780.50,
          revenue: 45320.00,
          expenses: 19539.50,
          transactions: [
            { id: 1, description: 'Prestação de Serviços - Cliente A', amount: 2500.00, type: 'income', date: '2024-01-15' },
            { id: 2, description: 'Compra de Equipamentos', amount: -1200.00, type: 'expense', date: '2024-01-14' },
            { id: 3, description: 'Prestação de Serviços - Cliente B', amount: 3200.00, type: 'income', date: '2024-01-13' },
          ]
        });
        setIsLoading(false);
        toast({
          title: "Dados atualizados",
          description: "Informações financeiras sincronizadas com o Bom Controle.",
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível conectar com o Bom Controle.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (bomControleIntegration) {
      fetchFinancialData();
    }
  }, [bomControleIntegration]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Button 
            onClick={fetchFinancialData}
            disabled={isLoading || !bomControleIntegration}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {!bomControleIntegration && (
          <Card className="bg-yellow-900/20 border-yellow-600">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <DollarSign className="h-5 w-5" />
                <p>Para usar a gestão financeira, configure a integração com o Bom Controle no painel de administração.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Saldo Atual</p>
                  <p className="text-2xl font-bold text-white">
                    R$ {financialData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Receitas</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {financialData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    R$ {financialData.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Conteúdo */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Transações</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Visão geral da situação financeira atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bomControleIntegration ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Margem de Lucro</p>
                        <p className="text-lg font-semibold text-green-400">
                          {((financialData.revenue - financialData.expenses) / financialData.revenue * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total de Movimentações</p>
                        <p className="text-lg font-semibold text-blue-400">
                          {financialData.transactions.length}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure a integração com o Bom Controle para ver os dados financeiros.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Últimas Transações</CardTitle>
                <CardDescription className="text-gray-400">
                  Movimentações financeiras recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bomControleIntegration && financialData.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {financialData.transactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-700/30">
                        <div className="flex items-center gap-3">
                          {transaction.type === 'income' ? (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-400">{transaction.date}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transação encontrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Relatórios</CardTitle>
                <CardDescription className="text-gray-400">
                  Relatórios financeiros detalhados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Relatórios em desenvolvimento.</p>
                  <p className="text-sm mt-2">Em breve você terá acesso a relatórios detalhados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Financial;
