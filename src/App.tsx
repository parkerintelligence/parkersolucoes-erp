import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Login from '@/pages/Login'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    </AuthProvider>
  )
}

export default App