import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Register() {
  const nav = useNavigate()
  const { setSession, setApps, ping } = useApp()
  const [form, setForm] = useState({
    role: 'Vendor',
    name: '',
    email: '',
    phone: '',
    idType: 'National ID',
    file: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Full name is required'
    if (!form.email.includes('@')) next.email = 'Valid email is required'
    if (form.phone.replace(/\D/g, '').length < 11) next.phone = 'Use an 11-digit PH mobile number'
    if (!form.file) next.file = 'Upload a government ID or vendor credential'
    setErrors(next)
    if (Object.keys(next).length) {
      ping('POST /api/v1/auth/register — validation failed')
      return
    }
    const id = `APP-${1044 + Math.floor(Math.random() * 20)}`
    setApps((apps) => [{ id, name: form.name, role: 'Vendor', stall: null, docs: [form.idType], status: 'PENDING', needsStallSelection: false }, ...apps])
    setSession({ name: form.name, email: form.email, role: 'Vendor', status: 'PENDING', appId: id, stall: null, needsStallSelection: false })
    ping('Account saved as PENDING. Supervisor has been alerted. You will choose your preferred stall after approval.')
    nav('/pending')
  }

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <div className="mark">M</div>
          <div>Merkado<small>Vendor Registration</small></div>
        </Link>
      </header>
      <div className="hero" style={{ maxWidth: 720 }}>
        <div className="hero-card">
          <h1>Create a vendor account</h1>
          <p className="muted">Status starts as PENDING. After supervisor approves your ID and credentials, you can log in and select your preferred stall from the available ones.</p>
          <span className="chip" style={{ marginBottom: 12 }}>Vendor application</span>
          <form className="form" onSubmit={submit} style={{ marginTop: 18 }}>
            <label>Full name
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Juan Dela Cruz" />
              {errors.name && <span className="tiny" style={{ color: 'var(--rose)' }}>{errors.name}</span>}
            </label>
            <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <label>Email
                <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
                {errors.email && <span className="tiny" style={{ color: 'var(--rose)' }}>{errors.email}</span>}
              </label>
              <label>Mobile
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09XXXXXXXXX" />
                {errors.phone && <span className="tiny" style={{ color: 'var(--rose)' }}>{errors.phone}</span>}
              </label>
            </div>
            <div className="card" style={{ padding: 16, background: 'var(--paper)', marginBottom: 0 }}>
              <p style={{ margin: 0 }}><strong>ℹ️  Stall selection happens after approval</strong></p>
              <p className="tiny muted" style={{ margin: '6px 0 0' }}>Once your application is approved by a supervisor, you will be able to view the full map of vacant stalls and pick your preferred location (Wet Market, Dry Goods, or Food Court).</p>
            </div>
            <label>ID / credential type
              <select value={form.idType} onChange={(e) => set('idType', e.target.value)}>
                <option>National ID</option>
                <option>Driver's License</option>
                <option>Barangay Clearance</option>
                <option>NBI Clearance</option>
              </select>
            </label>
            <div className="upload">
              <strong>Upload ID / credentials</strong>
              <p className="muted tiny">JPG or PDF, max 5 MB. Used only for supervisor verification.</p>
              <input type="file" onChange={(e) => set('file', e.target.files?.[0]?.name || '')} />
              <button type="button" className="btn ghost" onClick={() => set('file', 'national-id-sample.jpg')}>Use sample ID</button>
              {form.file && <span className="tiny muted">Attached: {form.file}</span>}
              {errors.file && <span className="tiny" style={{ color: 'var(--rose)' }}>{errors.file}</span>}
            </div>
            <button className="btn primary" type="submit">Submit application</button>
          </form>
        </div>
      </div>
    </>
  )
}
