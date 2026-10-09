import React, { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { useApp } from '../store.jsx'
import { SupervisorUtilities } from './Utilities.jsx'
import { SupervisorNotices } from './Notices.jsx'

const NAV = [
  { to: '/supervisor', end: true, label: '1. Stall & Section', hint: 'Interactive map and pricing' },
  { to: '/supervisor/onboarding', label: '2. Vendor Onboarding', hint: 'Approve applications & docs' },
  { to: '/supervisor/leases', label: '3. Lease Lifecycle', hint: 'Create, renew, terminate' },
  { to: '/supervisor/reports', label: '4. Financial & Audit', hint: 'Ledgers, zones, collector logs' },
  { to: '/supervisor/enforcement', label: '5. Enforcement', hint: 'Delinquency, notices, lockouts' },
  { to: '/supervisor/utilities', label: '6. Utility meters', hint: 'Water & electricity billing' },
  { to: '/supervisor/notices', label: '7. Penalty notices', hint: 'Violation notice generator' },
]

function Kpis() {
  const { stalls } = useApp()
  const occ = stalls.filter((s) => s.status === 'occupied').length
  const rate = Math.round((occ / stalls.length) * 100)
  const delq = stalls.filter((s) => s.status === 'occupied' && !s.paid).length
  return (
    <div className="kpis">
      <div className="kpi"><div className="label">October collections</div><div className="value">₱145,200</div></div>
      <div className="kpi"><div className="label">Occupancy rate</div><div className="value">{rate}%</div></div>
      <div className="kpi warn"><div className="label">Unpaid this month</div><div className="value">{delq}</div></div>
    </div>
  )
}

function Stalls() {
  const { stalls, setStalls, ping } = useApp()
  const [sel, setSel] = useState(stalls[0])
  const [rate, setRate] = useState(sel.rate)

  const pick = (s) => { setSel(s); setRate(s.rate) }
  const saveRate = () => {
    setStalls((all) => all.map((s) => s.id === sel.id ? { ...s, rate: Number(rate) } : s))
    ping(`Pricing schedule updated for ${sel.id}`)
  }

  return (
    <>
      <Kpis />
      <div className="grid cols-2">
        <div className="card">
          <div className="row space">
            <h2>Market floor map</h2>
            <span className="tiny muted">Tap a stall · occupied · unpaid · vacant · maintenance</span>
          </div>
          <div className="stall-map">
            {stalls.map((s) => (
              <button
                key={s.id}
                className={`stall ${s.status === 'occupied' && !s.paid ? 'unpaid' : s.status} ${sel.id === s.id ? 'selected' : ''}`}
                onClick={() => pick(s)}
              >
                <strong>{s.id}</strong>
                <span>{s.type}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Stall {sel.id}</h2>
          <p><strong>{sel.zone}</strong> · {sel.type}</p>
          <p className="muted">Vendor: {sel.vendor || '—'} · Status: {sel.status}{sel.status === 'occupied' ? (sel.paid ? ' · PAID Oct 2026' : ' · UNPAID Oct 2026') : ''}</p>
          <label>Monthly rent (₱)
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={saveRate}>Save pricing</button>
          </div>
        </div>
      </div>
    </>
  )
}

function Onboarding() {
  const { apps, setApps, ping, setStalls } = useApp()
  const [reason, setReason] = useState('Incomplete barangay clearance')
  const pending = apps.filter((a) => a.status === 'PENDING')

  const approve = (app) => {
    setApps((all) => all.map((a) => a.id === app.id ? { ...a, status: 'ACTIVE' } : a))
    if (app.role === 'Vendor') {
      setStalls((all) => all.map((s) => s.id === app.stall ? { ...s, status: 'occupied', vendor: app.name, paid: true } : s))
      ping(`${app.name} approved. Vendor profile created. Activation email sent.`)
    } else {
      ping(`${app.name} approved as ${app.role}. Permissions assigned. Activation email sent.`)
    }
  }
  const reject = (app) => {
    setApps((all) => all.map((a) => a.id === app.id ? { ...a, status: 'REJECTED', reason } : a))
    ping(`Status REJECTED. Rejection email sent to ${app.name}.`)
  }

  return (
    <>
      <Kpis />
      <div className="card">
        <h2>Applications queue</h2>
        <p className="muted">Supervisor reviews ID and credentials. Approved vendors get a profile; staff get scopes.</p>
        <div className="grid">
          {pending.map((a) => (
            <div key={a.id} className="row space" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <strong>{a.name}</strong>
                <div className="tiny muted">{a.id} · {a.role} · Stall {a.stall} · {a.docs.join(', ')}</div>
              </div>
              <div className="row">
                <button className="btn primary" onClick={() => approve(a)}>Approve</button>
                <button className="btn danger" onClick={() => reject(a)}>Reject</button>
              </div>
            </div>
          ))}
          {!pending.length && <p className="muted">No pending applications.</p>}
        </div>
        <label style={{ marginTop: 16, maxWidth: 420 }}>Rejection reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </div>
    </>
  )
}

function Leases() {
  const { leases, setLeases, stalls, setStalls, ping } = useApp()
  const [mode, setMode] = useState('create')
  const [form, setForm] = useState({ vendor: '', stall: 'A-05', start: '2026-10-09', end: '2027-10-08' })
  const [term, setTerm] = useState({ trigger: 'Voluntary', leaseId: 'L-218', damaged: false, inspect: false })
  const vacant = stalls.filter((s) => s.status === 'vacant')

  const createLease = () => {
    if (!form.vendor || !vacant.find((s) => s.id === form.stall)) {
      ping('Need a vendor name and a vacant stall')
      return
    }
    const id = `L-${200 + leases.length}`
    setLeases((all) => [{ id, vendor: form.vendor, stall: form.stall, start: form.start, end: form.end, status: 'ACTIVE', arrears: 0 }, ...all])
    setStalls((all) => all.map((s) => s.id === form.stall ? { ...s, status: 'occupied', vendor: form.vendor, paid: true } : s))
    ping(`Lease ${id} created`)
  }

  const openLeases = leases.filter((l) => l.status !== 'TERMINATED')
  const selected = openLeases.find((l) => l.id === term.leaseId) || openLeases[0]
  const hasArrears = (selected?.arrears || 0) > 0

  const terminate = () => {
    if (!selected) return
    if (!term.inspect) {
      ping('Conduct final stall inspection first')
      return
    }
    const stallStatus = term.damaged ? 'maintenance' : 'vacant'
    const nextId = openLeases.find((l) => l.id !== selected.id)?.id || ''
    setLeases((all) => all.map((l) => l.id === selected.id ? { ...l, status: 'TERMINATED' } : l))
    setStalls((all) => all.map((s) => s.id === selected.stall ? { ...s, status: stallStatus, vendor: null, paid: true } : s))
    setTerm((t) => ({ ...t, leaseId: nextId, inspect: false, damaged: false }))
    ping(`Lease terminated. Stall ${selected.stall} → ${stallStatus.toUpperCase()}. Clearance certificate generated. Access revoked.`)
  }

  return (
    <>
      <Kpis />
      <div className="row" style={{ marginBottom: 14 }}>
        {['create', 'renew', 'terminate'].map((m) => (
          <button key={m} className={`btn ${mode === m ? 'primary' : 'ghost'}`} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>
      {mode === 'create' && (
        <div className="grid cols-2">
          <div className="card">
            <h2>Create lease</h2>
            <div className="form">
              <label>Vendor name<input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></label>
              <label>Vacant stall
                <select value={form.stall} onChange={(e) => setForm({ ...form, stall: e.target.value })}>
                  {vacant.map((s) => <option key={s.id}>{s.id}</option>)}
                </select>
              </label>
              <label>Start<input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
              <label>End<input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
              <button className="btn primary" onClick={createLease}>Issue contract</button>
            </div>
          </div>
          <div className="card">
            <h2>Active contracts</h2>
            <table>
              <thead><tr><th>ID</th><th>Vendor</th><th>Stall</th><th>Status</th></tr></thead>
              <tbody>
                {leases.map((l) => (
                  <tr key={l.id}><td>{l.id}</td><td>{l.vendor}</td><td>{l.stall}</td><td><span className={`badge ${l.status === 'ACTIVE' ? 'active' : l.status === 'TERMINATED' ? 'terminated' : 'delinquent'}`}>{l.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {mode === 'renew' && (
        <div className="card">
          <h2>Renewal desk</h2>
          {leases.filter((l) => l.status !== 'TERMINATED').map((l) => (
            <div className="row space" key={l.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>{l.id} · {l.vendor} · {l.stall} · ends {l.end}</div>
              <button className="btn gold" onClick={() => {
                setLeases((all) => all.map((x) => x.id === l.id ? { ...x, end: '2027-12-31', status: 'ACTIVE' } : x))
                ping(`${l.id} renewed through 2027`)
              }}>Renew 12 months</button>
            </div>
          ))}
        </div>
      )}
      {mode === 'terminate' && (
        <div className="card">
          <h2>Lease termination</h2>
          <div className="steps">
            {['Trigger', 'Ledger review', 'Arrears', 'Inspection', 'Clearance'].map((s, i) => (
              <span className={`step ${i < 4 ? 'on' : ''}`} key={s}>{s}</span>
            ))}
          </div>
          <div className="form">
            <label>Termination trigger
              <select value={term.trigger} onChange={(e) => setTerm({ ...term, trigger: e.target.value })}>
                <option>Voluntary</option>
                <option>Expiration</option>
                <option>Delinquency / Violation</option>
              </select>
            </label>
            <label>Lease
              <select value={selected?.id || ''} onChange={(e) => setTerm({ ...term, leaseId: e.target.value })}>
                {openLeases.map((l) => (
                  <option key={l.id} value={l.id}>{l.id} · {l.vendor} · ₱{l.arrears} arrears</option>
                ))}
              </select>
            </label>
            {hasArrears && (
              <p className="badge delinquent">Unpaid balance ₱{selected.arrears}. Issue final notice / deduct from security deposit before clearance.</p>
            )}
            <label className="row" style={{ fontWeight: 450 }}>
              <input type="checkbox" checked={term.inspect} onChange={(e) => setTerm({ ...term, inspect: e.target.checked })} />
              Final stall inspection completed
            </label>
            <label className="row" style={{ fontWeight: 450 }}>
              <input type="checkbox" checked={term.damaged} onChange={(e) => setTerm({ ...term, damaged: e.target.checked })} />
              Stall damaged — assess repair charges
            </label>
            <button className="btn clay" onClick={terminate}>Generate clearance & terminate</button>
          </div>
        </div>
      )}
    </>
  )
}

function Reports() {
  const rows = useMemo(() => ([
    { zone: 'Wet Market A', collectors: 'Paolo Villar', cash: 62400, ewallet: 18100 },
    { zone: 'Dry Goods B', collectors: 'Mina Lopez', cash: 31200, ewallet: 9800 },
    { zone: 'Food Court C', collectors: 'Paolo Villar', cash: 18800, ewallet: 4900 },
  ]), [])
  return (
    <>
      <Kpis />
      <div className="grid cols-2">
        <div className="card">
          <h2>October ledger by zone</h2>
          <table>
            <thead><tr><th>Zone</th><th>Collector</th><th>Cash</th><th>e-Wallet</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.zone}><td>{r.zone}</td><td>{r.collectors}</td><td>₱{r.cash.toLocaleString()}</td><td>₱{r.ewallet.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Collector logs</h2>
          <p>Paolo Villar · Wet Market A · 8 monthly receipts · remittance pending ₱18,000</p>
          <p>Mina Lopez · Dry Goods B · 5 monthly receipts · remitted ₱31,200 at 16:10</p>
          <p className="tiny muted">Audit trail is append-only. Voided ORs require supervisor PIN in production.</p>
        </div>
      </div>
    </>
  )
}

function Enforcement() {
  const { notices, setNotices, stalls, setStalls, ping } = useApp()
  const unpaid = stalls.filter((s) => s.status === 'occupied' && !s.paid)

  return (
    <>
      <Kpis />
      <div className="grid cols-2">
        <div className="card">
          <h2>Delinquency queue</h2>
          {unpaid.map((s) => (
            <div className="row space" key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>{s.id} · {s.vendor} · ₱{s.rate.toLocaleString()} / month</div>
              <button className="btn clay" onClick={() => {
                setNotices((n) => [{ id: `N-${80 + n.length}`, stall: s.id, vendor: s.vendor, type: 'Delinquency', days: 1 }, ...n])
                ping(`Non-compliance notice issued to ${s.vendor}`)
              }}>Issue notice</button>
            </div>
          ))}
        </div>
        <div className="card">
          <h2>Notices & lockouts</h2>
          {notices.map((n) => (
            <div className="row space" key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div><strong>{n.id}</strong> {n.type} · {n.stall} · {n.vendor} · {n.days}d</div>
              <button className="btn danger" onClick={() => {
                setStalls((all) => all.map((s) => s.id === n.stall ? { ...s, status: 'maintenance' } : s))
                ping(`Lockout recorded for ${n.stall}. Access to stall revoked pending settlement.`)
              }}>Lockout</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Supervisor() {
  return (
    <Shell
      title="Supervisor desk"
      subtitle="Bayanihan Public Market"
      chips={['October collections ₱145,200', 'Occupancy 92%', 'Unpaid this month 12']}
      nav={NAV}
    >
      <Routes>
        <Route index element={<Stalls />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="leases" element={<Leases />} />
        <Route path="reports" element={<Reports />} />
        <Route path="enforcement" element={<Enforcement />} />
        <Route path="utilities" element={<SupervisorUtilities />} />
        <Route path="notices" element={<SupervisorNotices />} />
        <Route path="*" element={<Navigate to="/supervisor" />} />
      </Routes>
    </Shell>
  )
}
