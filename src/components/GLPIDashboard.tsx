
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  Monitor, 
  Printer, 
  Server, 
  HardDrive,
  Building,
  UserCheck,
  FileText,
  TrendingUp,
  AlertCircle,
  Wifi
} from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';

export const GLPIDashboard = () => {
  const { 
    tickets, 
    problems, 
    changes, 
    computers, 
    monitors, 
    printers, 
    networkEquipment, 
    software, 
    suppliers, 
    contracts, 
    users, 
    entities, 
    locations 
  } = useGLPIExpanded();

  const ticketStats = {
    critical: tickets.data?.filter(t => t.priority >= 5).length || 0,
    high: tickets.data?.filter(t => t.priority === 4).length || 0,
    inProgress: tickets.data?.filter(t => t.status === 2 || t.status === 3).length || 0,
    resolved: tickets.data?.filter(t => t.status === 5).length || 0,
    pending: tickets.data?.filter(t => t.status === 4).length || 0,
    total: tickets.data?.filter(t => t.status !== 6).length || 0,
  };

  const assetStats = {
    computers: computers.data?.length || 0,
    monitors: monitors.data?.length || 0,
    printers: printers.data?.length || 0,
    networkEquipment: networkEquipment.data?.length || 0,
    software: software.data?.length || 0,
  };

  const organizationStats = {
    users: users.data?.filter(u => u.is_active === 1).length || 0,
    entities: entities.data?.length || 0,
    locations: locations.data?.length || 0,
    suppliers: suppliers.data?.filter(s => s.is_active === 1).length || 0,
    contracts: contracts.data?.filter(c => c.is_deleted === 0).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas de Chamados */}
      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📞 Gestão de Chamados</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{ticketStats.critical}</p>
                  <p className="text-sm text-red-700">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{ticketStats.high}</p>
                  <p className="text-sm text-orange-700">Alta Prioridade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{ticketStats.inProgress}</p>
                  <p className="text-sm text-blue-700">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{ticketStats.pending}</p>
                  <p className="text-sm text-yellow-700">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{ticketStats.resolved}</p>
                  <p className="text-sm text-green-700">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{ticketStats.total}</p>
                  <p className="text-sm text-purple-700">Total Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas de Ativos */}
      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💻 Inventário de Ativos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{assetStats.computers}</p>
                  <p className="text-sm text-blue-700">Computadores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{assetStats.monitors}</p>
                  <p className="text-sm text-green-700">Monitores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{assetStats.printers}</p>
                  <p className="text-sm text-purple-700">Impressoras</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{assetStats.networkEquipment}</p>
                  <p className="text-sm text-orange-700">Rede</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold text-cyan-600">{assetStats.software}</p>
                  <p className="text-sm text-cyan-700">Software</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Organizacionais */}
      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🏢 Organização e Gestão</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{organizationStats.users}</p>
                  <p className="text-sm text-indigo-700">Usuários Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold text-teal-600">{organizationStats.entities}</p>
                  <p className="text-sm text-teal-700">Entidades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold text-pink-600">{organizationStats.locations}</p>
                  <p className="text-sm text-pink-700">Localizações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{organizationStats.suppliers}</p>
                  <p className="text-sm text-emerald-700">Fornecedores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-2xl font-bold text-rose-600">{organizationStats.contracts}</p>
                  <p className="text-sm text-rose-700">Contratos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Indicadores Adicionais */}
      <div>
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔄 Gestão ITIL</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">{problems.data?.length || 0}</p>
                  <p className="text-sm text-amber-700">Problemas Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-2xl font-bold text-violet-600">{changes.data?.length || 0}</p>
                  <p className="text-sm text-violet-700">Mudanças Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-600">
                    {((ticketStats.resolved / (ticketStats.total || 1)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-700">Taxa de Resolução</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
