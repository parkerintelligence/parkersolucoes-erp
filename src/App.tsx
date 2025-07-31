import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Companies from '@/pages/Companies'
import Services from '@/pages/Services'
import Passwords from '@/pages/Passwords'
import Budgets from '@/pages/Budgets'
import Contracts from '@/pages/Contracts'
import Schedule from '@/pages/Schedule'
import Annotations from '@/pages/Annotations'
import Alertas from '@/pages/Alertas'
import Monitoring from '@/pages/Monitoring'
import GLPI from '@/pages/GLPI'
import Bacula from '@/pages/Bacula'
import UniFi from '@/pages/UniFi'
import WhatsApp from '@/pages/WhatsApp'
import WhatsAppChats from '@/pages/WhatsAppChats'
import WhatsAppTemplates from '@/pages/WhatsAppTemplates'
import Wasabi from '@/pages/Wasabi'
import Guacamole from '@/pages/Guacamole'
import Zabbix from '@/pages/Zabbix'
import Admin from '@/pages/Admin'
import ActionPlan from '@/pages/ActionPlan'
import Links from '@/pages/Links'
import Documents from '@/pages/Documents'
import Financial from '@/pages/Financial'
import Automation from '@/pages/Automation'
import ReportsDashboard from '@/pages/ReportsDashboard'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/alertas" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/alertas" element={<Alertas />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/glpi" element={<GLPI />} />
                <Route path="/bacula" element={<Bacula />} />
                <Route path="/unifi" element={<UniFi />} />
                <Route path="/whatsapp" element={<WhatsApp />} />
                <Route path="/whatsapp-chats" element={<WhatsAppChats />} />
                <Route path="/whatsapp-templates" element={<WhatsAppTemplates />} />
                <Route path="/wasabi" element={<Wasabi />} />
                <Route path="/guacamole" element={<Guacamole />} />
                <Route path="/zabbix" element={<Zabbix />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/acao" element={<ActionPlan />} />
                <Route path="/links" element={<Links />} />
                <Route path="/documentos" element={<Documents />} />
                <Route path="/financeiro" element={<Financial />} />
                <Route path="/automacao" element={<Automation />} />
                <Route path="/relatorios" element={<ReportsDashboard />} />
                <Route path="/empresas" element={<Companies />} />
                <Route path="/servicos" element={<Services />} />
                <Route path="/senhas" element={<Passwords />} />
                <Route path="/orcamentos" element={<Budgets />} />
                <Route path="/contratos" element={<Contracts />} />
                <Route path="/agenda" element={<Schedule />} />
                <Route path="/anotacoes" element={<Annotations />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App