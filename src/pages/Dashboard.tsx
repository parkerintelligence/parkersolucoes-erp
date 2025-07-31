import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Calendar, FileText, Server, Database } from 'lucide-react'
const Dashboard = () => {
  const stats = [
    {
      title: 'Total de Empresas',
      value: '12',
      icon: Users,
      description: 'Empresas cadastradas'
    },
    {
      title: 'Serviços Ativos',
      value: '45',
      icon: Server,
      description: 'Serviços em funcionamento'
    },
    {
      title: 'Agendamentos',
      value: '8',
      icon: Calendar,
      description: 'Tarefas programadas'
    },
    {
      title: 'Relatórios',
      value: '23',
      icon: FileText,
      description: 'Relatórios gerados'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-secondary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do Sistema Parker
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-secondary" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="h-2 w-2 bg-secondary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistema inicializado</p>
                  <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Base de dados conectada</p>
                  <p className="text-xs text-muted-foreground">Há 3 minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-secondary" />
              <span>Status do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Autenticação</span>
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                  Ativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Base de Dados</span>
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                  Conectado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Integrações</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Standby
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default Dashboard;