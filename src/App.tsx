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
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/empresas" element={<Companies />} />
                <Route path="/servicos" element={<Services />} />
                <Route path="/senhas" element={<Passwords />} />
                <Route path="/orcamentos" element={<Budgets />} />
                <Route path="/contratos" element={<Contracts />} />
                <Route path="/agenda" element={<Schedule />} />
                <Route path="/anotacoes" element={<Annotations />} />
                <Route path="*" element={<Navigate to="/" replace />} />
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