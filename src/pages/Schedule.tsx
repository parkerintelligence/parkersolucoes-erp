
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ScheduleForm } from '@/components/ScheduleForm';
import { ScheduleList } from '@/components/ScheduleList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export interface ScheduleItem {
  id: string;
  title: string;
  type: 'certificate' | 'license' | 'system_update';
  dueDate: string;
  description: string;
  company: string;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
}

const Schedule = () => {
  const { isAuthenticated } = useAuth();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: 'Renovação Certificado SSL',
      type: 'certificate',
      dueDate: '2024-08-15',
      description: 'Renovar certificado SSL do site principal',
      company: 'Empresa ABC',
      status: 'pending',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Licença Office 365',
      type: 'license',
      dueDate: '2024-07-30',
      description: 'Renovação da licença Office 365',
      company: 'Empresa XYZ',
      status: 'pending',
      createdAt: '2024-01-10'
    }
  ]);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const addScheduleItem = (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'status'>) => {
    const newItem: ScheduleItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setScheduleItems([...scheduleItems, newItem]);
  };

  const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
    setScheduleItems(scheduleItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteScheduleItem = (id: string) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id));
  };

  const pendingCount = scheduleItems.filter(item => item.status === 'pending').length;
  const overdueCount = scheduleItems.filter(item => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    return dueDate < today && item.status === 'pending';
  }).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Agenda de Vencimentos
          </h1>
          <p className="text-slate-600">Gerencie certificados, licenças e atualizações do sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{pendingCount}</p>
                  <p className="text-sm text-blue-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
                  <p className="text-sm text-red-600">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{scheduleItems.length}</p>
                  <p className="text-sm text-green-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Cadastro */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Novo Agendamento</CardTitle>
              <CardDescription>
                Cadastre um novo item na agenda de vencimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleForm onSubmit={addScheduleItem} />
            </CardContent>
          </Card>

          {/* Lista de Agendamentos */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Próximos Vencimentos</CardTitle>
              <CardDescription>
                Lista de certificados, licenças e atualizações agendadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleList 
                items={scheduleItems}
                onUpdate={updateScheduleItem}
                onDelete={deleteScheduleItem}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
