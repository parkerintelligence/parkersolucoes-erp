import { Routes, Route } from 'react-router-dom'
import Login from '@/pages/Login'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  )
}

export default App