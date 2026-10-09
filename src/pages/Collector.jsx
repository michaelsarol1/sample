import React, { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { useApp } from '../store.jsx'
import { CollectorUtilities } from './Utilities.jsx'

const NAV = [
  { to: '/collector', end: true, label: '1. Quick Collection POS', hint: 'Scan QR, tap stall, search' },
  { to: '/collector/pay', label: '2. Payment modes', hint: 'Cash, GCash, Maya' },
  { to: '/collector/receipt', label: '3. Thermal receipt', hint: 'Bluetooth e-OR print' },
  { to: '/collector/matrix', label: '4. Stall status matrix', hint: 'Paid / unpaid grid' },
  { to: '/collector/remit', label: '5. End-of-day remittance', hint: 'Turnover to treasurer' },
  { to: '/collector/utilities', label: '6. Collect utilities', hint: 'Water and power bills' },
]

function Pos() {
  const { stalls, setStalls, setReceipts, setCollected, ping } = useApp()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(stalls.find((s) => !s.paid && s.status === 'occupied') || stalls[0])
  const list = stalls.filter((s) => s.zone.includes('Wet') && (`${s.id} ${s.vendor || ''}`.toLowerCase().includes(q.toLowerCase())))

  const collect = (mode) => {
    if (sel.status !== 'occupied') return ping('Stall is not occupied')
    if (sel.paid) return ping('Already paid for October 2026')
    const or = `eOR-${88422 + Math.floor(Math.random() * 80)}`
    setStalls((all) => all.map((s) => s.id === sel.id ? { ...s, paid: true } : s))
    setReceipts((r) => [{ or, date: '2026-10-09', amount: sel.rate, mode, stall: sel.id, period: 'October 2026' }, ...r])
    setCollected((n) => n + sel.rate)
    setSel({ ...sel, paid: true })
    ping(`${mode} ₱${sel.rate.toLocaleString()} posted for October. ${or} queued for thermal print.`)
  }

  return (
    <div className="field-shell">
      <div className="pos">
        <p className="tiny" style={{ opacity: 0.75 }}>WET MARKET A · TAP OR SEARCH</p>
        <input
          style={{ width: '100%', margin: '8px 0 14px' }}
          placeholder="Stall ID, vendor, or scan QR"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="amount">₱{sel.rate.toLocaleString()}</div>
        <p>October 2026 rent · {sel.id} · {sel.vendor || 'Vacant'} · {sel.paid ? 'PAID' : 'DUE THIS MONTH'}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn gold" onClick={() => collect('Cash')}>Take cash</button>
          <button className="btn primary" onClick={() => collect('GCash')}>GCash / Maya</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Nearby stalls</h2>
        {list.slice(0, 8).map((s) => (
          <button key={s.id} className="btn ghost" style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => setSel(s)}>
            {s.id} · {s.vendor || s.status} · {s.status !== 'occupied' ? s.status : s.paid ? 'Paid' : 'Unpaid'}
          </button>
        ))}
      </div>
    </div>
  )
}

function PayModes() {
  const [mode, setMode] = useState('Cash')
  return (
    <div className="field-shell">
      <div className="card">
        <h2>How the vendor is paying</h2>
        <div className="row">
          {['Cash', 'GCash', 'Maya'].map((m) => (
            <button key={m} className={`btn ${mode === m ? 'primary' : 'ghost'}`} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
        {mode === 'Cash' && <p style={{ marginTop: 16 }}>Count tender, show change, then post. Cash stays in the collector pouch until remittance.</p>}
        {mode !== 'Cash' && (
          <div className="upload" style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28 }}>QR · {mode}</div>
            <p className="muted">Vendor scans the stall QR or the collector QR. Settlement posts when the wallet callback succeeds.</p>
            <div style={{ width: 140, height: 140, margin: '12px auto', background: 'repeating-conic-gradient(#14241c 0% 25%, #f4eee3 0% 50%)', backgroundSize: '16px 16px' }} />
          </div>
        )}
      </div>
    </div>
  )
}

function Receipt() {
  const { receipts, ping } = useApp()
  const last = receipts[0]
  return (
    <div className="field-shell">
      <div className="card" style={{ fontFamily: 'ui-monospace, monospace', maxWidth: 360, margin: '0 auto' }}>
        <p style={{ textAlign: 'center' }}>BAYANIHAN PUBLIC MARKET<br />Official e-OR</p>
        <p>{last.or}<br />{last.date}<br />Stall {last.stall}<br />Period: {last.period || 'October 2026'}<br />{last.mode}<br /><strong>MONTHLY RENT ₱{Number(last.amount).toLocaleString()}.00</strong></p>
        <p className="tiny">This is a system-generated receipt. Valid with collector log {last.or}.</p>
        <button className="btn primary" style={{ width: '100%' }} onClick={() => ping('Sent to Bluetooth thermal printer IMP002')}>Print via Bluetooth</button>
      </div>
    </div>
  )
}

function Matrix() {
  const { stalls } = useApp()
  const zone = stalls.filter((s) => s.zone.includes('Wet'))
  return (
    <div className="field-shell">
      <div className="card">
        <h2>Wet Market A · October 2026</h2>
        <div className="matrix">
          {zone.map((s) => (
            <div key={s.id} className={`cell ${s.status !== 'occupied' ? 'partial' : s.paid ? 'paid' : 'unpaid'}`}>
              {s.id}<br />{s.status !== 'occupied' ? s.status : s.paid ? 'PAID' : 'DUE'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Remit() {
  const { collected, ping, receipts } = useApp()
  const cash = receipts.filter((r) => r.mode === 'Cash' && r.date === '2026-10-09').reduce((a, r) => a + r.amount, 0)
  return (
    <div className="field-shell">
      <div className="card">
        <h2>Turnover to treasurer</h2>
        <p className="display" style={{ fontSize: 36, margin: '8px 0' }}>₱{collected.toLocaleString()}</p>
        <p>Monthly rent collected today in Wet Market A · Cash in pouch ₱{(cash || 18000).toLocaleString()} · e-Wallet already in city account</p>
        <button className="btn gold" onClick={() => ping('Remittance bag sealed. Treasurer acknowledgement pending.')}>Seal and submit remittance</button>
      </div>
    </div>
  )
}

export default function Collector() {
  const { collected, stalls } = useApp()
  const pending = stalls.filter((s) => s.zone.includes('Wet') && s.status === 'occupied' && !s.paid).length
  return (
    <Shell
      title="Collector field kit"
      subtitle="Paolo Villar"
      chips={[`Zone: Wet Market A`, `Collected today ₱${collected.toLocaleString()}`, `Unpaid this month ${pending}`]}
      nav={NAV}
    >
      <Routes>
        <Route index element={<Pos />} />
        <Route path="pay" element={<PayModes />} />
        <Route path="receipt" element={<Receipt />} />
        <Route path="matrix" element={<Matrix />} />
        <Route path="remit" element={<Remit />} />
        <Route path="utilities" element={<CollectorUtilities />} />
        <Route path="*" element={<Navigate to="/collector" />} />
      </Routes>
    </Shell>
  )
}
