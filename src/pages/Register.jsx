import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Register() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { setSession, setApps, ping } = useApp()
  const [form, setForm] = useState({
    role: params.get('role') || 'Vendor',
    name: '',
    email: '',
    phone: '',
    idType: 'National ID',
    stall: 'A-05',
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
    if (!form.file) next.file = 'Upload a government ID or employee credential'
    setErrors(next)
    if (Object.keys(next).length) {
      ping('POST /api/v1/auth/register — validation failed')
      return
    }
    const id = `APP-${1044 + Math.floor(Math.random() * 20)}`
    setApps((apps) => [{ id, name: form.name, role: form.role, stall: form.role === 'Vendor' ? form.stall : '—', docs: [form.idType], status: 'PENDING' }, ...apps])
    setSession({ name: form.name, email: form.email, role: form.role, status: 'PENDING', appId: id })
    ping('Account saved as PENDING. Supervisor has been alerted.')
    nav('/pending')
  }

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <div className="mark">M</div>
          <div>Merkado<small>Registration</small></div>
        </Link>
      </header>
      <div className="hero" style={{ maxWidth: 720 }}>
        <div className="hero-card">
          <h1>Create an account</h1>
          <p className="muted">Status starts as PENDING. A market supervisor reviews ID and credentials before login is enabled.</p>
          <form className="form" onSubmit={submit} style={{ marginTop: 18 }}>
            <label>Role
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option>Vendor</option>
                <option>Collector</option>
                <option>Supervisor</option>
              </select>
            </label>
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
            {form.role === 'Vendor' && (
              <label>Preferred stall
                <select value={form.stall} onChange={(e) => set('stall', e.target.value)}>
                  <option>A-05</option>
                  <option>B-03</option>
                  <option>C-04</option>
                </select>
              </label>
            )}
            <label>ID / credential type
              <select value={form.idType} onChange={(e) => set('idType', e.target.value)}>
                <option>National ID</option>
                <option>Driver’s License</option>
                <option>Employee ID</option>
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
