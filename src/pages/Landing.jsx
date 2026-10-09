import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

const DEMOS = {
  Supervisor: { name: 'Atty. Elena Ramos', email: 'supervisor@merkado.gov' },
  Collector: { name: 'Paolo Villar', email: 'collector@merkado.gov' },
  Vendor: { name: 'Rosa Dela Cruz', email: 'vendor@merkado.gov', stall: 'A-04' },
}

export default function Landing() {
  const [role, setRole] = useState('Supervisor')
  const nav = useNavigate()
  const { setSession, ping } = useApp()

  const enterDemo = () => {
    setSession({ ...DEMOS[role], role, status: 'ACTIVE' })
    ping(`Signed in as ${role} demo account`)
    nav(`/${role.toLowerCase()}`)
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="mark">M</div>
          <div>
            Merkado
            <small>Public Market Authority</small>
          </div>
        </div>
        <div className="top-meta">
          <span className="chip">Bayanihan Public Market · Quezon City</span>
        </div>
      </header>
      <div className="hero">
        <div className="hero-card">
          <p className="muted tiny" style={{ letterSpacing: '.14em', textTransform: 'uppercase' }}>Stall leasing · Monthly collection · Compliance</p>
          <h1 className="display" style={{ fontSize: 48, margin: '8px 0 10px', lineHeight: 1.05 }}>
            One market. Three roles. Clear money, clear stalls.
          </h1>
          <p className="muted" style={{ maxWidth: 640, fontSize: 18 }}>
            Merkado is the leasing and collection desk for public markets: supervisors run the floor,
            collectors take payment in the aisle, and vendors pay and renew without lining up at the treasurer.
          </p>

          <div className="role-pick">
            {['Supervisor', 'Collector', 'Vendor'].map((r) => (
              <button type="button" key={r} className={`role ${role === r ? 'selected' : ''}`} onClick={() => setRole(r)}>
                <strong>{r}</strong>
                <p className="muted tiny" style={{ margin: '8px 0 0' }}>
                  {r === 'Supervisor' && 'Occupancy, leases, meters, penalty notices, and audit ledgers.'}
                  {r === 'Collector' && 'Field POS, monthly rent, water/power bills, and remittance.'}
                  {r === 'Vendor' && 'Pay rent and utilities, e-ORs, contracts, and violation notices.'}
                </p>
              </button>
            ))}
          </div>

          <div className="row">
            <button className="btn gold" onClick={enterDemo}>Enter {role} workspace</button>
            <Link to="/register" className="btn ghost" style={{ textDecoration: 'none' }}>Register vendor account</Link>
          </div>
          <p className="muted tiny" style={{ marginTop: 18 }}>
            Demo bypasses approval. Real registrations stay PENDING until a supervisor verifies ID and credentials.
          </p>
        </div>
      </div>
    </>
  )
}
