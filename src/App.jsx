import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './store.jsx'
import Landing from './pages/Landing.jsx'
import Register from './pages/Register.jsx'
import Pending from './pages/Pending.jsx'
import Supervisor from './pages/Supervisor.jsx'
import Collector from './pages/Collector.jsx'
import Vendor from './pages/Vendor.jsx'

function Guard({ role, children }) {
  const { session } = useApp()
  if (!session) return <Navigate to="/" replace />
  if (session.status === 'PENDING') return <Navigate to="/pending" replace />
  if (session.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { toast } = useApp()
  const loc = useLocation()
  return (
    <div className="app-shell" key={loc.pathname}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/supervisor/*" element={<Guard role="Supervisor"><Supervisor /></Guard>} />
        <Route path="/collector/*" element={<Guard role="Collector"><Collector /></Guard>} />
        <Route path="/vendor/*" element={<Guard role="Vendor"><Vendor /></Guard>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
