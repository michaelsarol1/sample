import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Pending() {
  const { session, setSession } = useApp()
  if (!session) return <Link to="/">Return home</Link>
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <div className="mark">M</div>
          <div>Merkado<small>Application status</small></div>
        </Link>
      </header>
      <div className="hero" style={{ maxWidth: 640 }}>
        <div className="hero-card">
          <span className={`badge ${session.status === 'REJECTED' ? 'rejected' : 'pending'}`}>{session.status}</span>
          <h1 style={{ marginTop: 12 }}>{session.status === 'REJECTED' ? 'Application not approved' : 'Waiting for supervisor review'}</h1>
          <p className="muted">
            {session.status === 'REJECTED'
              ? `A rejection email was sent to ${session.email}. Reason: ${session.reason || 'Incomplete documents.'}`
              : `Hello ${session.name}. Your account is saved but not active. The market supervisor has a system alert to review your ID and credentials.`}
          </p>
          <p className="tiny muted">Reference {session.appId || 'APP-NEW'} · POST /api/v1/auth/register completed.</p>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn ghost" onClick={() => { setSession(null) }}>Sign out</button>
            <Link to="/" className="btn primary" style={{ textDecoration: 'none' }}>Back to portal</Link>
          </div>
        </div>
      </div>
    </>
  )
}
