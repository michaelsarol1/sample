import React, { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { useApp, PENALTY_RATE_PER_DAY, PAYMENT_MODES, meterCharges } from '../store.jsx'
import { SupervisorUtilities } from './Utilities.jsx'
import { SupervisorNotices } from './Notices.jsx'

const NAV = [
  { to: '/supervisor', end: true, label: '1. Stall Mapping & Allocation', hint: 'Interactive visual map & registry' },
  { to: '/supervisor/onboarding', label: '2. Vendor Onboarding', hint: 'Approve applications & docs' },
  { to: '/supervisor/leases', label: '3. Lease Lifecycle', hint: 'Create, renew, terminate' },
  { to: '/supervisor/reports', label: '4. Financial & Audit', hint: 'Ledgers, zones, collector logs, notifications' },
  { to: '/supervisor/enforcement', label: '5. Enforcement', hint: 'Delinquency, notices, lockouts' },
  { to: '/supervisor/utilities', label: '6. Utility meters', hint: 'Water & electricity billing' },
  { to: '/supervisor/notices', label: '7. Penalty notices', hint: 'Violation notice generator' },
]

function Kpis({ showCollections = false, stallView = false }) {
  const { stalls, ledger, violations } = useApp()
  const occ = stalls.filter((s) => s.status === 'occupied').length
  const rate = Math.round((occ / stalls.length) * 100)
  const vacant = stalls.filter((s) => s.status === 'vacant').length
  const delq = stalls.filter((s) => s.status === 'occupied' && !s.paid).length
  const octoberCollected = ledger.filter(l => l.date.startsWith('2026-10')).reduce((a, l) => a + (l.credit || 0), 0)
  const octoberBilled = ledger.filter(l => l.date.startsWith('2026-10')).reduce((a, l) => a + (l.debit || 0), 0)
  const openFines = violations.filter(v => v.status === 'ISSUED').reduce((a, v) => a + v.fine, 0)

  if (stallView) {
    return (
      <div className="kpis">
        <div className="kpi"><div className="label">Occupancy</div><div className="value">{rate}%</div></div>
        <div className="kpi"><div className="label">Vacant stalls</div><div className="value">{vacant}</div></div>
        <div className="kpi warn"><div className="label">Unpaid this month</div><div className="value">{delq}</div></div>
      </div>
    )
  }

  return (
    <div className="kpis">
      {showCollections ? (
        <>
          <div className="kpi"><div className="label">October collections</div><div className="value">₱{octoberCollected.toLocaleString()}</div></div>
          <div className="kpi"><div className="label">October billed</div><div className="value">₱{octoberBilled.toLocaleString()}</div></div>
          <div className="kpi"><div className="label">Occupancy rate</div><div className="value">{rate}%</div></div>
          <div className="kpi warn"><div className="label">Unpaid this month</div><div className="value">{delq}</div></div>
          <div className="kpi warn"><div className="label">Open fines</div><div className="value">₱{openFines.toLocaleString()}</div></div>
        </>
      ) : (
        <>
          <div className="kpi"><div className="label">Occupancy rate</div><div className="value">{rate}%</div></div>
          <div className="kpi warn"><div className="label">Unpaid this month</div><div className="value">{delq}</div></div>
          <div className="kpi"><div className="label">Total stalls</div><div className="value">{stalls.length}</div></div>
        </>
      )}
    </div>
  )
}

function Stalls() {
  const { stalls, setStalls, ping } = useApp()
  const [sel, setSel] = useState(stalls[0])
  const [rate, setRate] = useState(sel.rate)
  const [ratePerSqm, setRatePerSqm] = useState(sel.ratePerSqm)
  const [sectionFilter, setSectionFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [newStatus, setNewStatus] = useState(sel.status)

  const sections = useMemo(() => {
    const s = {}
    stalls.forEach(st => {
      if (!s[st.zone]) s[st.zone] = []
      s[st.zone].push(st)
    })
    return s
  }, [stalls])

  const counts = useMemo(() => ({
    vacant: stalls.filter(s => s.status === 'vacant').length,
    occupied: stalls.filter(s => s.status === 'occupied').length,
    reserved: stalls.filter(s => s.status === 'reserved').length,
    maintenance: stalls.filter(s => s.status === 'maintenance').length,
  }), [stalls])

  const sectionColors = {
    'Wet Market A': { bg: '#e3f2fd', border: '#1976d2', label: '🐟 Wet Market A' },
    'Dry Goods B': { bg: '#fff3e0', border: '#e65100', label: '👕 Dry Goods B' },
    'Food Court C': { bg: '#f3e5f5', border: '#7b1fa2', label: '🍽️ Food Court C' },
  }

  const pick = (s) => {
    setSel(s)
    setRate(s.rate)
    setRatePerSqm(s.ratePerSqm)
    setNewStatus(s.status)
  }

  const saveRate = () => {
    const newSqmRate = sel.sqm ? Math.round(Number(rate) / sel.sqm) : ratePerSqm
    setStalls((all) => all.map((s) => s.id === sel.id ? { ...s, rate: Number(rate), ratePerSqm: newSqmRate } : s))
    ping(`Pricing schedule updated for ${sel.id} — ₱${rate}/mo (₱${newSqmRate}/sqm)`)
  }

  const updateStatus = () => {
    if (newStatus === sel.status) return
    setStalls((all) => all.map((s) => {
      if (s.id !== sel.id) return s
      const updated = { ...s, status: newStatus }
      if (newStatus !== 'occupied') { updated.vendor = newStatus === 'reserved' ? s.vendor : null }
      if (newStatus === 'vacant' || newStatus === 'maintenance') { updated.paid = true }
      return updated
    }))
    ping(`Stall ${sel.id} status updated → ${newStatus.toUpperCase()}`)
    pick({ ...sel, status: newStatus })
  }

  const filteredStalls = (sectionStalls) => {
    return sectionStalls.filter(s => {
      if (sectionFilter !== 'ALL' && s.zone !== sectionFilter) return false
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
      return true
    })
  }

  return (
    <>
      <Kpis stallView={true} />
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div className="row space" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Live market map</h2>
            <p className="tiny muted" style={{ margin: '4px 0 0' }}>Cubao, Quezon City · Interactive stall registry. Click a stall block for details and actions.</p>
          </div>
          <div className="stall-legend">
            <span className="legend-item"><span className="legend-dot vacant"></span>Vacant {counts.vacant}</span>
            <span className="legend-item"><span className="legend-dot occupied"></span>Occupied {counts.occupied}</span>
            <span className="legend-item"><span className="legend-dot reserved"></span>Reserved {counts.reserved}</span>
            <span className="legend-item"><span className="legend-dot maintenance"></span>Maintenance {counts.maintenance}</span>
          </div>
        </div>
        <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <label className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Section:
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }}>
              <option value="ALL">All sections</option>
              {Object.keys(sections).map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
          <label className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Status:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }}>
              <option value="ALL">All statuses</option>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="row space" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Stall allocation by section</h2>
            <span className="tiny muted">{stalls.length} total stalls</span>
          </div>

          {Object.entries(sections).map(([zone, zoneStalls]) => {
            const visible = filteredStalls(zoneStalls)
            if (sectionFilter !== 'ALL' && sectionFilter !== zone) return null
            if (visible.length === 0) return null
            const sc = sectionColors[zone] || { bg: '#f5f5f5', border: '#999', label: zone }
            const zoneCounts = {
              vacant: visible.filter(s => s.status === 'vacant').length,
              occupied: visible.filter(s => s.status === 'occupied').length,
              reserved: visible.filter(s => s.status === 'reserved').length,
              maintenance: visible.filter(s => s.status === 'maintenance').length,
            }
            return (
              <div key={zone} className="stall-section" style={{ marginBottom: 26 }}>
                <div className="row space" style={{ marginBottom: 10 }}>
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: 10,
                    background: sc.bg,
                    border: `2px solid ${sc.border}`,
                    display: 'inline-block'
                  }}>
                    <strong style={{ fontSize: 15, color: sc.border }}>{sc.label}</strong>
                  </div>
                  <div className="tiny muted">
                    <span className="legend-dot vacant" style={{ width: 10, height: 10, marginRight: 3 }}></span>{zoneCounts.vacant} ·
                    <span className="legend-dot occupied" style={{ width: 10, height: 10, margin: '0 3px 0 8px' }}></span>{zoneCounts.occupied} ·
                    <span className="legend-dot reserved" style={{ width: 10, height: 10, margin: '0 3px 0 8px' }}></span>{zoneCounts.reserved} ·
                    <span className="legend-dot maintenance" style={{ width: 10, height: 10, margin: '0 3px 0 8px' }}></span>{zoneCounts.maintenance}
                  </div>
                </div>
                <div className="stall-map" style={{
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  padding: 14,
                  background: sc.bg,
                  borderRadius: 14,
                  border: `1px dashed ${sc.border}40`
                }}>
                  {visible.map((s) => (
                    <button
                      key={s.id}
                      className={`stall ${s.status === 'occupied' && !s.paid ? 'unpaid' : s.status} ${sel.id === s.id ? 'selected' : ''}`}
                      onClick={() => pick(s)}
                      title={`${s.id} · ${s.type} · ${s.status}${s.vendor ? ' · ' + s.vendor : ''}`}
                    >
                      <strong style={{ fontSize: 14 }}>{s.id}</strong>
                      <span style={{ fontSize: 10, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.type}</span>
                      {!s.paid && s.status === 'occupied' && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#b42318', background: '#fff', borderRadius: 4, padding: '1px 4px' }}>UNPAID</span>
                      )}
                      {s.status === 'reserved' && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#5c4304', background: '#fff', borderRadius: 4, padding: '1px 4px' }}>HOLD</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="row space" style={{ marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Stall {sel.id}</h2>
            <span className={`badge ${sel.status}`}>{sel.status.toUpperCase()}</span>
          </div>
          <div className="card" style={{ padding: 14, background: 'var(--paper)', marginBottom: 14 }}>
            <p style={{ margin: '0 0 6px' }}><strong>{sel.zone}</strong> · {sel.type} · {sel.sqm} sqm</p>
            <p style={{ margin: 0 }} className="muted">
              Vendor: {sel.vendor || '-'}
              {sel.status === 'occupied' && <span> · {sel.paid ? <span style={{ color: 'var(--leaf)' }}>✓ PAID Oct 2026</span> : <span style={{ color: 'var(--clay)' }}>⚠ UNPAID Oct 2026</span>}</span>}
            </p>
            {sel.status === 'reserved' && sel.reservedBy && (
              <p style={{ margin: '6px 0 0' }} className="tiny muted">
                <span style={{ color: '#5c4304', fontWeight: 650 }}>🔒 Reserved by:</span> {sel.reservedBy}
                {sel.reservedUntil && <> · Until {sel.reservedUntil}</>}
              </p>
            )}
          </div>

          <div className="form" style={{ marginBottom: 16 }}>
            <label>Status allocation
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="vacant">🟢 Vacant — available for lease</option>
                <option value="occupied">🔴 Occupied — vendor assigned</option>
                <option value="reserved">🟡 Reserved — hold for applicant</option>
                <option value="maintenance">⚫ Maintenance — under repair / lockout</option>
              </select>
            </label>
            <button className={`btn ${newStatus === sel.status ? 'ghost' : 'gold'}`} onClick={updateStatus} disabled={newStatus === sel.status}>
              {newStatus === sel.status ? '✓ Status unchanged' : `Update status → ${newStatus.toUpperCase()}`}
            </button>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />

          <h3 style={{ fontFamily: 'Fraunces, serif', margin: '0 0 12px', fontSize: 18 }}>Pricing configuration</h3>
          <div className="form">
            <label>Monthly rent (₱)
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </label>
            <label>Rate per sqm (₱) — auto
              <input type="number" value={sel.sqm ? Math.round(Number(rate) / sel.sqm) : ratePerSqm} onChange={(e) => setRatePerSqm(e.target.value)} readOnly={!!sel.sqm} />
              <span className="tiny muted">Calculated from {sel.sqm} sqm floor area</span>
            </label>
            <div className="card" style={{ padding: 12, background: 'var(--paper)' }}>
              <p className="tiny muted" style={{ margin: '0 0 6px' }}>Monthly bill estimate</p>
              <p style={{ margin: 0 }}><strong>Rent:</strong> ₱{Number(rate).toLocaleString()}</p>
              <p className="tiny muted" style={{ margin: '6px 0 0' }}>Utilities (water & electricity) billed separately based on actual consumption.</p>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn primary" onClick={saveRate}>Save pricing</button>
            </div>
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
  const needsStall = apps.filter((a) => a.status === 'ACTIVE' && a.role === 'Vendor' && !a.stall)

  const approve = (app) => {
    setApps((all) => all.map((a) => a.id === app.id ? { ...a, status: 'ACTIVE', needsStallSelection: a.role === 'Vendor', stall: null } : a))
    if (app.role === 'Vendor') {
      ping(`${app.name} approved. Vendor profile created — they will select their preferred stall from the available vacant stalls. Activation email sent.`)
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
      {needsStall.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #fce8c4, #fff3dc)', border: '2px solid #c08400' }}>
          <div className="row space">
            <div>
              <h2 style={{ margin: 0, color: '#5c4304' }}>⚠ Awaiting vendor stall selection</h2>
              <p className="tiny" style={{ margin: '4px 0 0', color: '#5c4304' }}>{needsStall.length} approved vendor{needsStall.length !== 1 ? 's' : ''} need{needsStall.length === 1 ? 's' : ''} to choose their preferred stall.</p>
            </div>
            <div>
              {needsStall.map(a => (
                <span key={a.id} className="badge reserved" style={{ marginLeft: 6 }}>{a.name} ({a.id})</span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <h2>Applications queue</h2>
        <p className="muted">Supervisor reviews ID and credentials. Approved vendors get a profile and can log in to select their preferred stall from available vacant ones.</p>
        <div className="grid">
          {pending.map((a) => (
            <div key={a.id} className="row space" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <strong>{a.name}</strong>
                <div className="tiny muted">{a.id} · {a.role} · {a.docs.join(', ')}</div>
                {a.stall && <div className="tiny">Preferred stall: {a.stall}</div>}
                {!a.stall && a.role === 'Vendor' && <div className="tiny">🎯 Will select stall after approval</div>}
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
  const { leases, setLeases, stalls, setStalls, ping, addNotification, addLedgerEntry } = useApp()
  const [mode, setMode] = useState('create')
  const vacant = stalls.filter((s) => s.status === 'vacant')
  const [form, setForm] = useState({
    vendor: '',
    stall: vacant[0]?.id || 'A-05',
    start: '2026-10-09',
    end: '2027-10-08',
    terms: 'Standard 12-month lease. 2-month security deposit required. Monthly due on or before 5th. Penalty 2%/day on arrears.',
    securityDeposit: '',
    ratePerSqm: '',
  })
  const [term, setTerm] = useState({ trigger: 'Voluntary', leaseId: leases[0]?.id || 'L-218', damaged: false, inspect: false })

  const pickedStall = stalls.find(s => s.id === form.stall)
  const computedDeposit = pickedStall ? pickedStall.rate * 2 : 0
  const computedSqmRate = pickedStall ? pickedStall.ratePerSqm : 0

  const createLease = () => {
    if (!form.vendor || !vacant.find((s) => s.id === form.stall)) {
      ping('Need a vendor name and a vacant stall')
      return
    }
    const id = `L-${200 + leases.length}`
    const deposit = Number(form.securityDeposit) || computedDeposit
    const sqmRate = Number(form.ratePerSqm) || computedSqmRate
    const newLease = {
      id,
      vendor: form.vendor,
      stall: form.stall,
      start: form.start,
      end: form.end,
      terms: form.terms,
      securityDeposit: deposit,
      monthlyRate: pickedStall?.rate || 0,
      sqm: pickedStall?.sqm || 0,
      ratePerSqm: sqmRate,
      status: 'ACTIVE',
      arrears: 0,
    }
    setLeases((all) => [newLease, ...all])
    setStalls((all) => all.map((s) => s.id === form.stall ? { ...s, status: 'occupied', vendor: form.vendor, paid: true } : s))
    addLedgerEntry({
      stall: form.stall, vendor: form.vendor, type: 'Security Deposit', period: `${form.start} - ${form.end}`,
      debit: 0, credit: deposit, balance: 0, or: `eOR-${88500 + leases.length}`, mode: 'OTC',
    })
    addNotification({
      stall: form.stall, vendor: form.vendor, type: 'Lease Created', channel: 'Email',
      message: `Lease ${id} created. Stall ${form.stall}. Deposit ₱${deposit.toLocaleString()} received. Monthly rate ₱${pickedStall?.rate?.toLocaleString()}.`,
    })
    ping(`Lease ${id} created · ₱${deposit.toLocaleString()} deposit posted`)
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
    addNotification({
      stall: selected.stall, vendor: selected.vendor, type: 'Lease Terminated', channel: 'Email',
      message: `Lease ${selected.id} terminated via ${term.trigger}. Clearance certificate generated. Security deposit disposition pending inspection.`,
    })
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
            <h2>Create lease contract</h2>
            <div className="form">
              <label>Vendor name<input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></label>
              <label>Vacant stall
                <select value={form.stall} onChange={(e) => setForm({ ...form, stall: e.target.value })}>
                  {vacant.map((s) => <option key={s.id}>{s.id} · {s.type} · {s.sqm}sqm · ₱{s.rate}/mo</option>)}
                </select>
              </label>
              {pickedStall && (
                <div className="card" style={{ padding: 12, background: 'var(--paper)' }}>
                  <p className="tiny muted">Stall details</p>
                  <p><strong>{pickedStall.id}</strong> · {pickedStall.zone} · {pickedStall.sqm} sqm</p>
                  <p>₱{pickedStall.rate.toLocaleString()}/mo · ₱{pickedStall.ratePerSqm.toLocaleString()}/sqm</p>
                </div>
              )}
              <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <label>Start date<input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
                <label>End date<input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
              </div>
              <label>Security deposit (2 months ₱)<input type="number" value={form.securityDeposit || computedDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} /></label>
              <label>Rate per sqm (₱)<input type="number" value={form.ratePerSqm || computedSqmRate} onChange={(e) => setForm({ ...form, ratePerSqm: e.target.value })} /></label>
              <label>Contract terms & conditions
                <textarea rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
              </label>
              <button className="btn primary" onClick={createLease}>Issue digital contract</button>
            </div>
          </div>
          <div className="card">
            <h2>Active contracts</h2>
            <table>
              <thead><tr><th>ID</th><th>Vendor</th><th>Stall</th><th>Deposit</th><th>Rate/sqm</th><th>Status</th></tr></thead>
              <tbody>
                {leases.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.vendor}</td>
                    <td>{l.stall}</td>
                    <td>₱{l.securityDeposit?.toLocaleString() || '0'}</td>
                    <td>₱{l.ratePerSqm?.toLocaleString() || '0'}</td>
                    <td><span className={`badge ${l.status === 'ACTIVE' ? 'active' : l.status === 'TERMINATED' ? 'terminated' : 'delinquent'}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 style={{ marginTop: 20 }}>Sample contract preview</h2>
            {leases[0] && (
              <div className="notice-sheet" style={{ padding: 18, background: 'var(--paper)', fontSize: 14 }}>
                <p className="tiny" style={{ letterSpacing: '.12em', textTransform: 'uppercase', textAlign: 'center' }}>Republic of the Philippines · Quezon City</p>
                <h3 style={{ textAlign: 'center' }}>LEASE AGREEMENT</h3>
                <p className="tiny" style={{ textAlign: 'center' }}>Contract No. {leases[0].id}</p>
                <hr />
                <p><strong>Lessor:</strong> Bayanihan Public Market Authority</p>
                <p><strong>Lessee:</strong> {leases[0].vendor}</p>
                <p><strong>Premises:</strong> Stall {leases[0].stall} · {leases[0].sqm} sqm</p>
                <p><strong>Term:</strong> {leases[0].start} to {leases[0].end}</p>
                <p><strong>Monthly Rent:</strong> ₱{leases[0].monthlyRate?.toLocaleString()} (₱{leases[0].ratePerSqm?.toLocaleString()}/sqm)</p>
                <p><strong>Security Deposit:</strong> ₱{leases[0].securityDeposit?.toLocaleString()} (2 months)</p>
                <p><strong>Penalty on Arrears:</strong> {(PENALTY_RATE_PER_DAY * 100)}% per day</p>
                <p className="tiny muted" style={{ marginTop: 10 }}>Terms: {leases[0].terms}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {mode === 'renew' && (
        <div className="card">
          <h2>Renewal desk</h2>
          <p className="muted">Review lease terms, current deposit, and rate per sqm before renewal.</p>
          {leases.filter((l) => l.status !== 'TERMINATED').map((l) => (
            <div className="row space" key={l.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <strong>{l.id}</strong> · {l.vendor} · {l.stall}<br />
                <span className="tiny muted">Ends {l.end} · ₱{l.securityDeposit?.toLocaleString()} deposit · ₱{l.ratePerSqm?.toLocaleString()}/sqm · Arrears ₱{l.arrears?.toLocaleString()}</span>
              </div>
              <button className="btn gold" onClick={() => {
                setLeases((all) => all.map((x) => x.id === l.id ? { ...x, end: '2027-12-31', status: 'ACTIVE' } : x))
                addNotification({
                  stall: l.stall, vendor: l.vendor, type: 'Lease Renewed', channel: 'Email',
                  message: `Lease ${l.id} renewed through December 31, 2027. Updated contract available in Contract Vault.`,
                })
                ping(`${l.id} renewed through 2027 · Renewal notice sent`)
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
                  <option key={l.id} value={l.id}>{l.id} · {l.vendor} · ₱{l.securityDeposit?.toLocaleString()} deposit · ₱{l.arrears} arrears</option>
                ))}
              </select>
            </label>
            {selected && (
              <div className="card" style={{ padding: 12, background: 'var(--paper)', margin: '12px 0' }}>
                <p className="tiny muted">Lease details</p>
                <p><strong>{selected.id}</strong> · {selected.stall} · until {selected.end}</p>
                <p>Security deposit: ₱{selected.securityDeposit?.toLocaleString()} · Monthly rate: ₱{selected.monthlyRate?.toLocaleString()}</p>
              </div>
            )}
            {hasArrears && (
              <p className="badge delinquent">Unpaid balance ₱{selected.arrears}. Issue final notice / deduct from security deposit (₱{selected.securityDeposit?.toLocaleString()}) before clearance.</p>
            )}
            <label className="row" style={{ fontWeight: 450 }}>
              <input type="checkbox" checked={term.inspect} onChange={(e) => setTerm({ ...term, inspect: e.target.checked })} />
              Final stall inspection completed
            </label>
            <label className="row" style={{ fontWeight: 450 }}>
              <input type="checkbox" checked={term.damaged} onChange={(e) => setTerm({ ...term, damaged: e.target.checked })} />
              Stall damaged — assess repair charges against deposit
            </label>
            <button className="btn clay" onClick={terminate}>Generate clearance & terminate</button>
          </div>
        </div>
      )}
    </>
  )
}

function Reports() {
  const { ledger, stalls, notifications, setNotifications, ping, receipts, violations, meters } = useApp()
  const [ledgerFilter, setLedgerFilter] = useState('ALL')
  const [notifFilter, setNotifFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('ledger')

  const zoneRows = useMemo(() => ([
    { zone: 'Wet Market A', collectors: 'Paolo Villar', rent: 31500, utilities: 18300, fines: 2500, total: 52300 },
    { zone: 'Dry Goods B', collectors: 'Mina Lopez', rent: 24900, utilities: 9200, fines: 0, total: 34100 },
    { zone: 'Food Court C', collectors: 'Paolo Villar', rent: 23400, utilities: 12000, fines: 1500, total: 36900 },
  ]), [])

  const octoberTotal = zoneRows.reduce((a, z) => a + z.total, 0)
  const filteredLedger = ledgerFilter === 'ALL' ? ledger : ledger.filter(l => l.stall === ledgerFilter)
  const filteredNotifs = notifications.filter(n => {
    if (notifFilter === 'ALL') return true
    if (notifFilter === 'UNREAD') return !n.read
    return n.type === notifFilter
  })

  const vendorArrears = useMemo(() => {
    const byStall = {}
    ledger.forEach(l => {
      byStall[l.stall] = byStall[l.stall] || { stall: l.stall, vendor: l.vendor, debit: 0, credit: 0, balance: 0 }
      byStall[l.stall].debit += l.debit || 0
      byStall[l.stall].credit += l.credit || 0
      byStall[l.stall].balance = byStall[l.stall].debit - byStall[l.stall].credit
    })
    return Object.values(byStall).filter(v => v.balance > 0).sort((a, b) => b.balance - a.balance)
  }, [ledger])

  const billingRecords = useMemo(() => {
    return stalls.filter(s => s.status === 'occupied').map(s => {
      const m = meters.find(mm => mm.stall === s.id)
      const mc = m ? meterCharges(m) : { waterBill: 0, powerBill: 0 }
      return {
        stall: s.id,
        vendor: s.vendor,
        rent: s.rate,
        water: mc.waterBill,
        power: mc.powerBill,
        subtotal: s.rate + mc.waterBill + mc.powerBill,
        penalty: s.paid ? 0 : Math.round(s.rate * PENALTY_RATE_PER_DAY * 4),
        total: s.rate + mc.waterBill + mc.powerBill + (s.paid ? 0 : Math.round(s.rate * PENALTY_RATE_PER_DAY * 4)),
        status: s.paid ? 'PAID' : 'UNPAID',
      }
    })
  }, [stalls, meters])

  return (
    <>
      <Kpis showCollections={true} />
      <div className="row" style={{ marginBottom: 14 }}>
        {['ledger', 'billing', 'arrears', 'zones', 'notifications'].map(m => (
          <button key={m} className={`btn ${viewMode === m ? 'primary' : 'ghost'}`} onClick={() => setViewMode(m)}>
            {m === 'ledger' ? 'Real-time Ledger' : m === 'billing' ? 'Billing Records' : m === 'arrears' ? 'Arrears & Penalties' : m === 'zones' ? 'Zone Collections' : 'Notifications Center'}
          </button>
        ))}
      </div>

      {viewMode === 'ledger' && (
        <div className="grid cols-2">
          <div className="card">
            <h2>Real-time ledger</h2>
            <label className="tiny">Filter by stall
              <select value={ledgerFilter} onChange={(e) => setLedgerFilter(e.target.value)}>
                <option value="ALL">All stalls</option>
                {stalls.map(s => <option key={s.id} value={s.id}>{s.id} · {s.vendor || 'vacant'}</option>)}
              </select>
            </label>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead><tr><th>Date</th><th>Stall</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th><th>OR</th></tr></thead>
                <tbody>
                  {filteredLedger.map(l => (
                    <tr key={l.id}>
                      <td>{l.date}</td>
                      <td>{l.stall}</td>
                      <td className="tiny">{l.type}<br /><span className="muted">{l.period}</span></td>
                      <td style={{ color: 'var(--rose)' }}>{l.debit ? `₱${l.debit.toLocaleString()}` : '-'}</td>
                      <td style={{ color: 'var(--olive)' }}>{l.credit ? `₱${l.credit.toLocaleString()}` : '-'}</td>
                      <td><strong>{l.balance > 0 ? `₱${l.balance.toLocaleString()}` : '₱0'}</strong></td>
                      <td className="tiny">{l.or || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>Append-only audit trail · {filteredLedger.length} entries</p>
          </div>
          <div className="card">
            <h2>Payment modes breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {PAYMENT_MODES.map(pm => {
                const total = receipts.filter(r => r.mode === (pm.id === 'Collector Cash' ? 'Cash' : pm.id)).reduce((a, r) => a + r.amount, 0)
                const count = receipts.filter(r => r.mode === (pm.id === 'Collector Cash' ? 'Cash' : pm.id)).length
                return (
                  <div key={pm.id} className="card" style={{ padding: 14, background: 'var(--paper)' }}>
                    <p className="tiny muted">{pm.icon} {pm.label}</p>
                    <p className="display" style={{ fontSize: 24 }}>₱{total.toLocaleString()}</p>
                    <p className="tiny">{count} receipts · {pm.hint}</p>
                  </div>
                )
              })}
            </div>
            <h2 style={{ marginTop: 20 }}>Collector logs</h2>
            <p>Paolo Villar · Wet Market A · 8 monthly receipts · remittance pending ₱18,000</p>
            <p>Mina Lopez · Dry Goods B · 5 monthly receipts · remitted ₱31,200 at 16:10</p>
            <p className="tiny muted">Audit trail is append-only. Voided ORs require supervisor PIN in production.</p>
          </div>
        </div>
      )}

      {viewMode === 'billing' && (
        <div className="card">
          <h2>Automated billing records — October 2026</h2>
          <p className="muted">Monthly rent + utilities (water & electricity based on actual consumption) + penalties (auto 2%/day on arrears.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stall</th><th>Vendor</th><th>Rent</th>
                  <th>Water</th><th>Power</th><th>Penalty</th><th>Total</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {billingRecords.map(b => (
                  <tr key={b.stall}>
                    <td><strong>{b.stall}</strong></td>
                    <td>{b.vendor}</td>
                    <td>₱{b.rent.toLocaleString()}</td>
                    <td>₱{b.water.toLocaleString()}</td>
                    <td>₱{b.power.toLocaleString()}</td>
                    <td style={{ color: b.penalty ? 'var(--rose)' : 'inherit' }}>{b.penalty ? `₱${b.penalty.toLocaleString()}` : '-'}</td>
                    <td><strong>₱{b.total.toLocaleString()}</strong></td>
                    <td><span className={`badge ${b.status === 'PAID' ? 'paid' : 'unpaid'}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'arrears' && (
        <div className="grid cols-2">
          <div className="card">
            <h2>Outstanding balances per vendor</h2>
            <p className="muted">Penalties auto-applied at {(PENALTY_RATE_PER_DAY * 100)}% per day on arrears.</p>
            {vendorArrears.length === 0 && <p>No outstanding balances.</p>}
            {vendorArrears.map(v => (
              <div className="row space" key={v.stall} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <strong>{v.stall}</strong> · {v.vendor}<br />
                  <span className="tiny muted">Billed ₱{v.debit.toLocaleString()} · Paid ₱{v.credit.toLocaleString()}</span>
                </div>
                <div>
                  <p className="display" style={{ fontSize: 22, color: 'var(--rose)', margin: 0 }}>₱{v.balance.toLocaleString()}</p>
                  <p className="tiny muted">+₱{Math.round(v.balance * PENALTY_RATE_PER_DAY).toLocaleString()}/day</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Open violation fines</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>VN</th><th>Vendor</th><th>Offense</th><th>Fine</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {violations.map(v => (
                    <tr key={v.id}>
                      <td>{v.id}</td><td>{v.vendor}</td><td>{v.offense}</td>
                      <td>₱{v.fine.toLocaleString()}</td><td>{v.due}</td>
                      <td><span className={`badge ${v.status === 'SETTLED' ? 'paid' : 'unpaid'}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'zones' && (
        <div className="card">
          <h2>October collections by zone — Total ₱{octoberTotal.toLocaleString()}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zone</th><th>Collector</th><th>Rent</th>
                  <th>Utilities</th><th>Fines</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {zoneRows.map((r) => (
                  <tr key={r.zone}>
                    <td><strong>{r.zone}</strong></td><td>{r.collectors}</td>
                    <td>₱{r.rent.toLocaleString()}</td>
                    <td>₱{r.utilities.toLocaleString()}</td>
                    <td>₱{r.fines.toLocaleString()}</td>
                    <td><strong>₱{r.total.toLocaleString()}</strong></td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: 'var(--paper)' }}>
                  <td colSpan="2">TOTAL</td>
                  <td>₱{zoneRows.reduce((a,z)=>a+z.rent,0).toLocaleString()}</td>
                  <td>₱{zoneRows.reduce((a,z)=>a+z.utilities,0).toLocaleString()}</td>
                  <td>₱{zoneRows.reduce((a,z)=>a+z.fines,0).toLocaleString()}</td>
                  <td>₱{octoberTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'notifications' && (
        <div className="grid cols-2">
          <div className="card">
            <div className="row space">
              <h2>Automated notifications center</h2>
              <span className="chip">{filteredNotifs.filter(n => !n.read).length} unread</span>
            </div>
            <label className="tiny">Filter
              <select value={notifFilter} onChange={(e) => setNotifFilter(e.target.value)}>
                <option value="ALL">All types</option>
                <option value="UNREAD">Unread only</option>
                <option value="Payment Confirmation">Payment Confirmation</option>
                <option value="Due Date Alert">Due Date Alerts</option>
                <option value="Delinquency Notice">Delinquency</option>
                <option value="Violation Notice">Violation</option>
                <option value="Lease Created">Lease Created</option>
                <option value="Lease Renewed">Lease Renewed</option>
                <option value="Lease Renewal">Lease Renewal Reminder</option>
                <option value="Lease Terminated">Lease Terminated</option>
              </select>
            </label>
            <div style={{ marginTop: 12 }}>
              {filteredNotifs.map(n => (
                <div key={n.id} className="row space" style={{ padding: '12px', background: n.read ? 'transparent' : 'var(--paper)', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }} onClick={() => {
                  setNotifications((all) => all.map(x => x.id === n.id ? { ...x, read: true } : x))
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0 }}><strong>{n.type}</strong> <span className="badge" style={{ background: n.channel === 'SMS' ? 'var(--gold)' : 'var(--olive)' }}>{n.channel}</span></p>
                    <p className="tiny" style={{ margin: '4px 0' }}>{n.stall} · {n.vendor} · {n.sent}</p>
                    <p className="tiny muted" style={{ margin: 0 }}>{n.message}</p>
                  </div>
                  {!n.read && <span className="badge unpaid" style={{ width: 10, height: 10, borderRadius: '50%' }} />}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2>Send automated alert</h2>
            <p className="muted">System automatically sends due-date (T-3 days), payment-confirmation, delinquency, and violation alerts.</p>
            <div className="form">
              <label>Alert type
                <select>
                  <option>Due date reminder — T-3 days</option>
                  <option>Payment confirmation — instant</option>
                  <option>Delinquency — 1 day overdue</option>
                  <option>Violation — on issuance</option>
                  <option>Lease renewal — 90 days before expiry</option>
                </select>
              </label>
              <label>Channel
                <select>
                  <option>SMS + Email</option>
                  <option>SMS only</option>
                  <option>Email only</option>
                </select>
              </label>
              <label>Target vendor / stall
                <select>
                  {stalls.filter(s => s.status === 'occupied').map(s => <option key={s.id}>{s.id} · {s.vendor}</option>)}
                </select>
              </label>
              <button className="btn primary" onClick={() => ping('Alert queued. SMS via Globe API, email via SES.')}>Queue alert broadcast</button>
            </div>
            <h2 style={{ marginTop: 20 }}>Notification log sample</h2>
            <p className="tiny muted">Automated schedule (production):</p>
            <ul className="tiny" style={{ paddingLeft: 18 }}>
              <li>Due-date reminder: every 2nd of the month at 8:00 AM (SMS + Email)</li>
              <li>Delinquency notice: every 6th at 9:00 AM for unpaid</li>
              <li>Payment confirmation: on e-OR generation (instant)</li>
              <li>Lease renewal: 90, 60, 30 days before expiry (Email)</li>
              <li>Violation: on notice issuance (SMS + Email)</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

function Enforcement() {
  const { notices, setNotices, stalls, setStalls, ping, addNotification } = useApp()
  const unpaid = stalls.filter((s) => s.status === 'occupied' && !s.paid)

  return (
    <>
      <Kpis />
      <div className="grid cols-2">
        <div className="card">
          <h2>Delinquency queue</h2>
          {unpaid.map((s) => (
            <div className="row space" key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                {s.id} · {s.vendor} · ₱{s.rate.toLocaleString()} / month<br />
                <span className="tiny muted">Penalty accruing {(PENALTY_RATE_PER_DAY * 100)}%/day = ₱{Math.round(s.rate * PENALTY_RATE_PER_DAY)}/day</span>
              </div>
              <button className="btn clay" onClick={() => {
                const noticeId = `N-${80 + notices.length}`
                setNotices((n) => [{ id: noticeId, stall: s.id, vendor: s.vendor, type: 'Delinquency', days: 1 }, ...n])
                addNotification({
                  stall: s.id, vendor: s.vendor, type: 'Delinquency Notice', channel: 'SMS',
                  message: `Non-compliance notice ${noticeId}: Your October rent (₱${s.rate.toLocaleString()}) is overdue. Pay within 3 days or face stall lockout.`,
                })
                ping(`Non-compliance notice issued to ${s.vendor} · SMS + Email sent`)
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
                addNotification({
                  stall: n.stall, vendor: n.vendor, type: 'Violation Notice', channel: 'SMS',
                  message: `LOCKOUT NOTICE: Stall ${n.stall} access revoked pending settlement of ₱${notices.find(x => x.id === n.id)?.days || 0}. Contact supervisor to arrange payment.`,
                })
                ping(`Lockout recorded for ${n.stall}. Access revoked · alert sent`)
              }}>Lockout</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Supervisor() {
  const { stalls, ledger } = useApp()
  const occ = stalls.filter(s => s.status === 'occupied').length
  const rate = Math.round((occ / stalls.length) * 100)
  const octCollected = ledger.filter(l => l.date.startsWith('2026-10')).reduce((a, l) => a + (l.credit || 0), 0)
  return (
    <Shell
      title="Supervisor desk"
      subtitle="Bayanihan Public Market"
      chips={[`October collections ₱${octCollected.toLocaleString()}`]}
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
