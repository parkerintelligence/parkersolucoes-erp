import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Router, BarChart3, Network, Cpu, HardDrive } from 'lucide-react';
import { useMikrotikIntegration } from '@/hooks/useMikrotikIntegration';

const Mikrotik = () => {
  const { isConfigured, interfaces, resources, isLoading, refetchAll } = useMikrotikIntegration();

  if (!isConfigured) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Router className="h-8 w-8" />
                Mikrotik - Gerenciamento RouterOS
              </h1>
              <p className="text-blue-600">Plataforma completa de gerenciamento de roteadores Mikrotik</p>
            </div>
          </div>

          <Card className="border-blue-200">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Mikrotik não configurado</h3>
              <p className="text-gray-600 mb-4">
                Configure a integração com Mikrotik no painel administrativo para acessar o gerenciamento completo.
              </p>
              <Button onClick={() => window.location.href = '/admin'}>
                <Settings className="mr-2 h-4 w-4" />
                Configurar Mikrotik
              </Button>
            </CardContent>
          </Card>
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
              <Router className="h-8 w-8" />
              Mikrotik - Gerenciamento RouterOS
            </h1>
            <p className="text-blue-600">Gestão completa de roteadores e monitoramento em tempo real</p>
          </div>
          <Button onClick={refetchAll} variant="outline">
            Atualizar Dados
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="interfaces" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Interfaces
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Recursos do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Carregando...</p>
                  ) : resources ? (
                    <div className="space-y-2">
                      <p><strong>CPU:</strong> {resources.cpu_load}%</p>
                      <p><strong>Memória:</strong> {Math.round((resources.free_memory / resources.total_memory) * 100)}% livre</p>
                      <p><strong>Uptime:</strong> {resources.uptime}</p>
                      <p><strong>Versão:</strong> {resources.version}</p>
                    </div>
                  ) : (
                    <p>Dados não disponíveis</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Interfaces Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold">{interfaces.filter(i => i.running).length}</p>
                      <p className="text-sm text-gray-600">de {interfaces.length} totais</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tráfego Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="space-y-2">
                      <p><strong>RX:</strong> {interfaces.reduce((sum, i) => sum + (i.rx_bytes || 0), 0)} bytes</p>
                      <p><strong>TX:</strong> {interfaces.reduce((sum, i) => sum + (i.tx_bytes || 0), 0)} bytes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interfaces" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Interfaces</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Carregando interfaces...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Nome</th>
                          <th className="border border-gray-300 p-2 text-left">Tipo</th>
                          <th className="border border-gray-300 p-2 text-left">Status</th>
                          <th className="border border-gray-300 p-2 text-left">RX Bytes</th>
                          <th className="border border-gray-300 p-2 text-left">TX Bytes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interfaces.map((iface) => (
                          <tr key={iface.id}>
                            <td className="border border-gray-300 p-2">{iface.name}</td>
                            <td className="border border-gray-300 p-2">{iface.type}</td>
                            <td className="border border-gray-300 p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                iface.running ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {iface.running ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-2">{iface.rx_bytes?.toLocaleString() || '0'}</td>
                            <td className="border border-gray-300 p-2">{iface.tx_bytes?.toLocaleString() || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recursos do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Carregando recursos...</p>
                ) : resources ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Informações do Sistema</h4>
                      <div className="space-y-2">
                        <p><strong>Placa:</strong> {resources.board_name}</p>
                        <p><strong>Versão:</strong> {resources.version}</p>
                        <p><strong>Uptime:</strong> {resources.uptime}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Performance</h4>
                      <div className="space-y-2">
                        <p><strong>CPU Load:</strong> {resources.cpu_load}%</p>
                        <p><strong>Memória Total:</strong> {(resources.total_memory / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Memória Livre:</strong> {(resources.free_memory / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Uso de Memória:</strong> {Math.round(((resources.total_memory - resources.free_memory) / resources.total_memory) * 100)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Dados de recursos não disponíveis</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas de Configuração</CardTitle>
              </CardHeader>
              <CardContent className="text-center p-8">
                <HardDrive className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Configuração Avançada</h3>
                <p className="text-gray-600 mb-4">
                  Ferramentas de configuração e backup em desenvolvimento
                </p>
                <div className="text-sm text-gray-500">
                  • Backup automático de configurações<br/>
                  • Aplicação de scripts em lote<br/>
                  • Configuração de QoS<br/>
                  • Gerenciamento de firewall
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Mikrotik;