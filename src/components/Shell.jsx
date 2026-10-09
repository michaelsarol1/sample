import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Shell({ title, subtitle, chips, nav, children }) {
  const { session, setSession } = useApp()
  const go = useNavigate()
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="mark">M</div>
          <div>
            {title}
            <small>{subtitle}</small>
          </div>
        </div>
        <div className="top-meta">
          {chips?.map((c) => <span className="chip" key={c}>{c}</span>)}
          <span className="chip">{session?.name}</span>
          <button className="btn gold" onClick={() => { setSession(null); go('/') }}>Sign out</button>
        </div>
      </header>
      <div className="layout">
        <nav className="nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => isActive ? 'active' : ''}>
              <div>
                <strong>{n.label}</strong>
                <span>{n.hint}</span>
              </div>
            </NavLink>
          ))}
        </nav>
        <main className="main">{children}</main>
      </div>
    </>
  )
}
