import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import VPS from '@/pages/VPS';
import Admin from '@/pages/Admin';
import GLPI from '@/pages/GLPI';
import Guacamole from '@/pages/Guacamole';
import Backups from '@/pages/Backups';
import Passwords from '@/pages/Passwords';
import Annotations from '@/pages/Annotations';
import Links from '@/pages/Links';
import WhatsApp from '@/pages/WhatsApp';
import WhatsAppTemplates from '@/pages/WhatsAppTemplates';
import Wasabi from '@/pages/Wasabi';
import Schedule from '@/pages/Schedule';
import Automation from '@/pages/Automation';
import Zabbix from '@/pages/Zabbix';
import Services from '@/pages/Services';
import Budgets from '@/pages/Budgets';
import Contracts from '@/pages/Contracts';
import Financial from '@/pages/Financial';
import Companies from '@/pages/Companies';
import Bacula from '@/pages/Bacula';
import ReportsDashboard from '@/pages/ReportsDashboard';
import ActionPlan from '@/pages/ActionPlan';
import Alertas from '@/pages/Alertas';
import Security from '@/pages/Security';
import UniFi from '@/pages/UniFi';
import { Layout } from '@/components/Layout';

// Create a single QueryClient instance
const queryClient = new QueryClient();

function App() {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(
          'div',
          { className: 'min-h-screen bg-background' },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/', element: React.createElement(Login) }),
            React.createElement(Route, { path: '/login', element: React.createElement(Login) }),
            React.createElement(Route, {
              path: '/alertas',
              element: React.createElement(Layout, null, React.createElement(Alertas))
            }),
            React.createElement(Route, {
              path: '/links',
              element: React.createElement(Layout, null, React.createElement(Links))
            }),
            React.createElement(Route, {
              path: '/vps',
              element: React.createElement(Layout, null, React.createElement(VPS))
            }),
            React.createElement(Route, {
              path: '/admin',
              element: React.createElement(Layout, null, React.createElement(Admin))
            }),
            React.createElement(Route, {
              path: '/glpi',
              element: React.createElement(Layout, null, React.createElement(GLPI))
            }),
            React.createElement(Route, {
              path: '/conexao-remota',
              element: React.createElement(Layout, null, React.createElement(Guacamole))
            }),
            React.createElement(Route, {
              path: '/backups',
              element: React.createElement(Layout, null, React.createElement(Backups))
            }),
            React.createElement(Route, {
              path: '/passwords',
              element: React.createElement(Layout, null, React.createElement(Passwords))
            }),
            React.createElement(Route, {
              path: '/annotations',
              element: React.createElement(Layout, null, React.createElement(Annotations))
            }),
            React.createElement(Route, {
              path: '/whatsapp',
              element: React.createElement(Layout, null, React.createElement(WhatsApp))
            }),
            React.createElement(Route, {
              path: '/whatsapp-templates',
              element: React.createElement(Layout, null, React.createElement(WhatsAppTemplates))
            }),
            React.createElement(Route, {
              path: '/wasabi',
              element: React.createElement(Layout, null, React.createElement(Wasabi))
            }),
            React.createElement(Route, {
              path: '/schedule',
              element: React.createElement(Layout, null, React.createElement(Schedule))
            }),
            React.createElement(Route, {
              path: '/automation',
              element: React.createElement(Layout, null, React.createElement(Automation))
            }),
            React.createElement(Route, {
              path: '/zabbix',
              element: React.createElement(Layout, null, React.createElement(Zabbix))
            }),
            React.createElement(Route, {
              path: '/services',
              element: React.createElement(Layout, null, React.createElement(Services))
            }),
            React.createElement(Route, {
              path: '/budgets',
              element: React.createElement(Layout, null, React.createElement(Budgets))
            }),
            React.createElement(Route, {
              path: '/contracts',
              element: React.createElement(Layout, null, React.createElement(Contracts))
            }),
            React.createElement(Route, {
              path: '/financial',
              element: React.createElement(Layout, null, React.createElement(Financial))
            }),
            React.createElement(Route, {
              path: '/companies',
              element: React.createElement(Layout, null, React.createElement(Companies))
            }),
            React.createElement(Route, {
              path: '/bacula',
              element: React.createElement(Layout, null, React.createElement(Bacula))
            }),
            React.createElement(Route, {
              path: '/reports',
              element: React.createElement(Layout, null, React.createElement(ReportsDashboard))
            }),
            React.createElement(Route, {
              path: '/plano-de-acao',
              element: React.createElement(Layout, null, React.createElement(ActionPlan))
            }),
            React.createElement(Route, {
              path: '/security',
              element: React.createElement(Layout, null, React.createElement(Security))
            }),
            React.createElement(Route, {
              path: '/unifi',
              element: React.createElement(Layout, null, React.createElement(UniFi))
            })
          )
        )
      )
    )
  );
}

export default App;