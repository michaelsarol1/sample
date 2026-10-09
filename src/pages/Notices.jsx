import React, { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'

export const OFFENSES = [
  { offense: 'Aisle obstruction', ordinance: 'Market Code Art. 12 §4', fine: 1500, body: 'Merchandise or equipment extends beyond stall frontage and blocks the required fire aisle.' },
  { offense: 'Unsanitary stall', ordinance: 'Market Code Art. 9 §1', fine: 1000, body: 'Stall failed sanitation inspection. Waste, wastewater, or spoilage was found on the premises.' },
  { offense: 'Illegal subletting', ordinance: 'Market Code Art. 7 §3', fine: 5000, body: 'Stall occupancy was transferred or sublet without written approval of the Market Supervisor.' },
  { offense: 'Unpaid monthly rent', ordinance: 'Market Code Art. 18 §1', fine: 1000, body: 'Monthly stall rental remains unpaid after the 5th of the billing month.' },
  { offense: 'Unpaid utilities', ordinance: 'Market Code Art. 18 §2', fine: 500, body: 'Water and/or electricity bills remain unpaid after the due date.' },
  { offense: 'Meter tampering', ordinance: 'Market Code Art. 18 §5', fine: 5000, body: 'Water or electric meter was found altered, bypassed, or with a broken seal.' },
  { offense: 'Unauthorized cooking', ordinance: 'Market Code Art. 14 §2', fine: 2000, body: 'Cooking or open flame was used outside a designated food-court stall.' },
  { offense: 'After-hours operation', ordinance: 'Market Code Art. 6 §2', fine: 800, body: 'Stall remained open after posted market hours without a night-market permit.' },
]

function dueDate() {
  const d = new Date('2026-10-09')
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export function SupervisorNotices() {
  const { stalls, violations, setViolations, ping } = useApp()
  const occupied = stalls.filter((s) => s.status === 'occupied' && s.vendor)
  const [form, setForm] = useState({
    stall: occupied[1]?.id || occupied[0]?.id,
    offense: OFFENSES[0].offense,
    body: OFFENSES[0].body,
    fine: OFFENSES[0].fine,
    due: dueDate(),
  })
  const [previewId, setPreviewId] = useState(violations[0]?.id || '')

  const stall = occupied.find((s) => s.id === form.stall) || occupied[0]
  const catalog = OFFENSES.find((o) => o.offense === form.offense) || OFFENSES[0]
  const draft = useMemo(() => ({
    id: 'VN-DRAFT',
    stall: stall?.id,
    vendor: stall?.vendor,
    offense: form.offense,
    ordinance: catalog.ordinance,
    fine: Number(form.fine),
    due: form.due,
    body: form.body,
    status: 'DRAFT',
    issued: '2026-10-09',
  }), [stall, form, catalog])

  const shown = violations.find((v) => v.id === previewId) || draft

  const pickOffense = (name) => {
    const o = OFFENSES.find((x) => x.offense === name)
    setForm((f) => ({ ...f, offense: name, body: o.body, fine: o.fine }))
  }

  const issue = () => {
    const id = `VN-${41 + violations.length}`
    const notice = { ...draft, id, status: 'ISSUED' }
    setViolations((all) => [notice, ...all])
    setPreviewId(id)
    ping(`${id} issued to ${notice.vendor}. Fine ₱${notice.fine.toLocaleString()} due ${notice.due}.`)
  }

  const settle = (id) => {
    setViolations((all) => all.map((v) => v.id === id ? { ...v, status: 'SETTLED' } : v))
    ping(`${id} marked settled`)
  }

  return (
    <>
      <div className="kpis">
        <div className="kpi"><div className="label">Open notices</div><div className="value">{violations.filter((v) => v.status === 'ISSUED').length}</div></div>
        <div className="kpi"><div className="label">Fines outstanding</div><div className="value">₱{violations.filter((v) => v.status === 'ISSUED').reduce((a, v) => a + v.fine, 0).toLocaleString()}</div></div>
        <div className="kpi warn"><div className="label">Settled this month</div><div className="value">{violations.filter((v) => v.status === 'SETTLED').length}</div></div>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <h2>Generate notice</h2>
          <p className="muted">Pick stall, ordinance, and facts. Preview prints as an official penalty notice.</p>
          <div className="form" style={{ marginTop: 12 }}>
            <label>Stall / vendor
              <select value={form.stall} onChange={(e) => setForm({ ...form, stall: e.target.value })}>
                {occupied.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.vendor}</option>)}
              </select>
            </label>
            <label>Violation
              <select value={form.offense} onChange={(e) => pickOffense(e.target.value)}>
                {OFFENSES.map((o) => <option key={o.offense}>{o.offense}</option>)}
              </select>
            </label>
            <p className="tiny muted">{catalog.ordinance} · Standard fine ₱{catalog.fine.toLocaleString()}</p>
            <label>Facts / particulars
              <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </label>
            <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <label>Penalty (₱)
                <input type="number" value={form.fine} onChange={(e) => setForm({ ...form, fine: e.target.value })} />
              </label>
              <label>Pay by
                <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
              </label>
            </div>
            <div className="row">
              <button className="btn clay" onClick={issue}>Issue notice</button>
              <button className="btn ghost" onClick={() => window.print()}>Print preview</button>
            </div>
          </div>
          <h2 style={{ marginTop: 22 }}>Issued notices</h2>
          {violations.map((v) => (
            <button key={v.id} className={`btn ghost ${previewId === v.id ? 'primary' : ''}`} style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => setPreviewId(v.id)}>
              {v.id} · {v.stall} · {v.offense} · ₱{v.fine.toLocaleString()} · {v.status}
            </button>
          ))}
        </div>
        <NoticeSheet notice={shown} onSettle={shown.status === 'ISSUED' ? () => settle(shown.id) : null} />
      </div>
    </>
  )
}

export function NoticeSheet({ notice, onSettle }) {
  if (!notice) return null
  return (
    <div className="card notice-sheet">
      <p className="tiny" style={{ letterSpacing: '.12em', textTransform: 'uppercase', textAlign: 'center' }}>Republic of the Philippines · Quezon City</p>
      <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Bayanihan Public Market</h2>
      <p style={{ textAlign: 'center', marginTop: 0 }}><strong>Notice of Violation and Penalty</strong></p>
      <p className="row space"><span>No. {notice.id}</span><span>Date issued: {notice.issued}</span></p>
      <hr />
      <p><strong>Vendor:</strong> {notice.vendor}<br /><strong>Stall:</strong> {notice.stall}<br /><strong>Offense:</strong> {notice.offense}<br /><strong>Ordinance:</strong> {notice.ordinance}</p>
      <p><strong>Particulars:</strong><br />{notice.body}</p>
      <p><strong>Penalty:</strong> ₱{Number(notice.fine).toLocaleString()}.00 &nbsp; <strong>Pay on or before:</strong> {notice.due}</p>
      <p className="tiny muted">Failure to settle may result in stall lockout, deduction from security deposit, and lease termination under Art. 18.</p>
      <p style={{ marginTop: 28 }}>_________________________<br /><span className="tiny">Market Supervisor</span></p>
      <span className={`badge ${notice.status === 'SETTLED' ? 'paid' : notice.status === 'DRAFT' ? 'pending' : 'delinquent'}`}>{notice.status}</span>
      <div className="row no-print" style={{ marginTop: 12 }}>
        {onSettle && <button className="btn primary" onClick={onSettle}>Mark penalty paid</button>}
        <button className="btn ghost" onClick={() => window.print()}>Print</button>
      </div>
    </div>
  )
}

export function VendorNotices() {
  const { violations, ping } = useApp()
  const mine = violations.filter((v) => v.stall === 'A-04' || v.vendor === 'Rosa Dela Cruz')
  const [id, setId] = useState(mine[0]?.id || '')
  const shown = mine.find((v) => v.id === id) || mine[0]
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Your violation notices</h2>
        {!mine.length && <p className="muted">No penalty notices on stall A-04.</p>}
        {mine.map((v) => (
          <button key={v.id} className="btn ghost" style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => setId(v.id)}>
            {v.id} · {v.offense} · ₱{v.fine.toLocaleString()} · {v.status}
          </button>
        ))}
        <p className="tiny muted">Pay the fine at the collector’s POS or via GCash before the due date to avoid lockout.</p>
        {shown && shown.status === 'ISSUED' && (
          <button className="btn gold" onClick={() => ping('Penalty payment is posted by a collector or treasurer. Bring this notice number.')}>How to pay</button>
        )}
      </div>
      {shown ? <NoticeSheet notice={shown} /> : <div className="card"><p className="muted">You are in good standing.</p></div>}
    </div>
  )
}
