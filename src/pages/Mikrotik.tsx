import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Router, BarChart3, Network, Cpu, HardDrive, Wifi, Shield, Clock, AlertTriangle, CheckCircle, XCircle, Terminal, Download, Upload } from 'lucide-react';
import { useMikrotikTunnel } from '@/hooks/useMikrotikTunnel';
import { MikrotikConnectionStatus } from '@/components/MikrotikConnectionStatus';

const Mikrotik = () => {
  const { isConfigured, interfaces, resources, isLoading, refetchAll, isWorkerReady, testConnection } = useMikrotikTunnel();

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
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isWorkerReady ? "default" : "destructive"}>
                HTTP Tunnel: {isWorkerReady ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => testConnection.mutate()} variant="outline" disabled={testConnection.isPending}>
              {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
            </Button>
            <Button onClick={refetchAll} variant="outline">
              Atualizar Dados
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="interfaces" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Interfaces
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Rede
            </TabsTrigger>
            <TabsTrigger value="firewall" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Firewall
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Ferramentas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Status Geral */}
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">RouterOS</h3>
                      <p className="text-sm text-green-600">
                        {isLoading ? 'Verificando...' : resources ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CPU Load */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Cpu className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">CPU Load</h3>
                      {isLoading ? (
                        <p className="text-sm text-gray-600">Carregando...</p>
                      ) : resources ? (
                        <>
                          <p className="text-sm text-gray-600">{resources.cpu_load}%</p>
                          <Progress value={resources.cpu_load} className="h-2 mt-1" />
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">N/A</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Memória */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <HardDrive className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Memória</h3>
                      {isLoading ? (
                        <p className="text-sm text-gray-600">Carregando...</p>
                      ) : resources ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {Math.round(((resources.total_memory - resources.free_memory) / resources.total_memory) * 100)}% usado
                          </p>
                          <Progress 
                            value={((resources.total_memory - resources.free_memory) / resources.total_memory) * 100} 
                            className="h-2 mt-1" 
                          />
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">N/A</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uptime */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Uptime</h3>
                      <p className="text-sm text-gray-600">
                        {isLoading ? 'Carregando...' : resources?.uptime || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connection Status */}
            <div className="mb-6">
              <MikrotikConnectionStatus />
            </div>

            {/* Informações do Sistema e Interfaces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Router className="h-5 w-5" />
                    Informações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : resources ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Placa:</span>
                        <span>{resources.board_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Versão:</span>
                        <Badge variant="outline">{resources.version}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Memória Total:</span>
                        <span>{(resources.total_memory / 1024 / 1024).toFixed(0)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Memória Livre:</span>
                        <span>{(resources.free_memory / 1024 / 1024).toFixed(0)} MB</span>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Não foi possível carregar as informações do sistema.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Status das Interfaces */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Status das Interfaces
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : interfaces.length > 0 ? (
                    <div className="space-y-2">
                      {interfaces.slice(0, 5).map((iface) => (
                        <div key={iface.id} className="flex justify-between items-center p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${iface.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{iface.name}</span>
                            <Badge variant="secondary" className="text-xs">{iface.type}</Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {(iface.rx_bytes / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                      ))}
                      {interfaces.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{interfaces.length - 5} interfaces adicionais
                        </p>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhuma interface encontrada.
                      </AlertDescription>
                    </Alert>
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

          <TabsContent value="system" className="mt-6">
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

          <TabsContent value="network" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Configuração IP
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <Network className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">Configuração de Rede</h3>
                  <p className="text-gray-600 mb-4">
                    Gerencie IPs, rotas, DHCP e configurações wireless
                  </p>
                  <div className="text-sm text-gray-500">
                    • Endereços IP<br/>
                    • Rotas estáticas<br/>
                    • DHCP Server/Client<br/>
                    • Configuração wireless
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Bandwidth Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold mb-2">Monitoramento de Banda</h3>
                  <p className="text-gray-600 mb-4">
                    Visualize o tráfego em tempo real por interface
                  </p>
                  <div className="text-sm text-gray-500">
                    • Gráficos de tráfego<br/>
                    • Histórico de banda<br/>
                    • Top usuários<br/>
                    • Alertas de limite
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="firewall" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Regras de Firewall
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-red-600" />
                  <h3 className="text-lg font-semibold mb-2">Firewall Rules</h3>
                  <p className="text-gray-600 mb-4">
                    Configure regras de segurança e controle de acesso
                  </p>
                  <div className="text-sm text-gray-500">
                    • Filter rules<br/>
                    • NAT configuration<br/>
                    • Mangle rules<br/>
                    • Address lists
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    QoS / Queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-semibold mb-2">Quality of Service</h3>
                  <p className="text-gray-600 mb-4">
                    Gerencie a qualidade de serviço e limitação de banda
                  </p>
                  <div className="text-sm text-gray-500">
                    • Simple Queues<br/>
                    • Queue Trees<br/>
                    • PCQ configuration<br/>
                    • Burst settings
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Terminal
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-6">
                  <Terminal className="h-10 w-10 mx-auto mb-3 text-gray-600" />
                  <h4 className="font-semibold mb-2">Console RouterOS</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Execute comandos diretamente no RouterOS
                  </p>
                  <Button size="sm" variant="outline" disabled>
                    Em Desenvolvimento
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-6">
                  <Download className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-semibold mb-2">Backup de Configuração</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download automático das configurações
                  </p>
                  <Button size="sm" variant="outline" disabled>
                    Em Desenvolvimento
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Ping/Traceroute
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-6">
                  <Network className="h-10 w-10 mx-auto mb-3 text-green-600" />
                  <h4 className="font-semibold mb-2">Ferramentas de Rede</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Teste de conectividade e diagnóstico
                  </p>
                  <Button size="sm" variant="outline" disabled>
                    Em Desenvolvimento
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Mikrotik;