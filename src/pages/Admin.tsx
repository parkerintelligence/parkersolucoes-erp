
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  Database, 
  Palette, 
  Shield,
  Bug
} from 'lucide-react';
import { AdminCompaniesPanel } from '@/components/AdminCompaniesPanel';
import { AdminApiPanel } from '@/components/AdminApiPanel';
import SystemSettingsPanel from '@/components/SystemSettingsPanel';
import { BrandingSettingsPanel } from '@/components/BrandingSettingsPanel';
import { ScheduledReportsPanel } from '@/components/ScheduledReportsPanel';
import DebugPanel from '@/components/DebugPanel';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Painel de Administração</h1>
          <p className="text-blue-600">Gerencie configurações, integrações e usuários</p>
        </div>

        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-blue-100">
            <TabsTrigger value="integrations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Database className="mr-2 h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="mr-2 h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Palette className="mr-2 h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Shield className="mr-2 h-4 w-4" />
              Automação
            </TabsTrigger>
            <TabsTrigger value="debug" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Bug className="mr-2 h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <AdminApiPanel />
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <AdminCompaniesPanel />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettingsPanel />
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <BrandingSettingsPanel />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <ScheduledReportsPanel />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <DebugPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
