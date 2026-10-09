import React, { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { useApp } from '../store.jsx'
import { VendorUtilities } from './Utilities.jsx'
import { VendorNotices } from './Notices.jsx'

const NAV = [
  { to: '/vendor', end: true, label: '1. Ledger & receipts', hint: 'Download past e-ORs' },
  { to: '/vendor/pay', label: '2. Self-payment', hint: 'Pay monthly rent' },
  { to: '/vendor/contract', label: '3. Contract vault', hint: 'Lease terms & renewal' },
  { to: '/vendor/support', label: '4. Support desk', hint: 'Plumbing, electrical, stall' },
  { to: '/vendor/profile', label: '5. Profile & contacts', hint: 'ID and emergency numbers' },
  { to: '/vendor/utilities', label: '6. Water & electricity', hint: 'Metered bills this month' },
  { to: '/vendor/notices', label: '7. Penalty notices', hint: 'Violations and fines' },
]

function Ledger() {
  const { receipts, ping } = useApp()
  const mine = receipts.filter((r) => r.stall === 'A-04')
  return (
    <div className="card">
      <h2>Payment history · Stall A-04</h2>
      <div className="table-wrap">
      <table>
        <thead><tr><th>OR</th><th>Period</th><th>Paid</th><th>Mode</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {mine.map((r) => (
            <tr key={r.or}>
              <td>{r.or}</td><td>{r.period || '—'}</td><td>{r.date}</td><td>{r.mode}</td><td>₱{Number(r.amount).toLocaleString()}.00</td>
              <td><button className="btn ghost" onClick={() => ping(`${r.or} downloaded as PDF`)}>Download</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

function Pay() {
  const { stalls, setStalls, setReceipts, ping } = useApp()
  const stall = stalls.find((s) => s.id === 'A-04')
  const amount = stall.rate
  const pay = (mode) => {
    if (stall.paid) return ping('October 2026 is already paid.')
    setStalls((all) => all.map((s) => s.id === 'A-04' ? { ...s, paid: true } : s))
    setReceipts((r) => [{ or: `eOR-${89000 + Math.floor(Math.random() * 99)}`, date: '2026-10-09', amount, mode, stall: 'A-04', period: 'October 2026' }, ...r])
    ping(`${mode} monthly rent of ₱${amount.toLocaleString()} posted for October 2026.`)
  }
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Pay October 2026 rent</h2>
        <p className="muted">One payment covers the full calendar month. Due on or before the 5th.</p>
        <p className="display" style={{ fontSize: 40 }}>₱{amount.toLocaleString()}</p>
        <div className="row">
          <button className="btn gold" onClick={() => pay('GCash')} disabled={stall.paid}>GCash</button>
          <button className="btn primary" onClick={() => pay('Maya')} disabled={stall.paid}>Maya</button>
          <button className="btn ghost" onClick={() => pay('Bank')} disabled={stall.paid}>Bank transfer</button>
        </div>
      </div>
      <div className="card">
        <h2>This month</h2>
        <p><span className={`badge ${stall.paid ? 'paid' : 'unpaid'}`}>{stall.paid ? 'PAID · OCT 2026' : 'UNPAID · OCT 2026'}</span></p>
        <p className="muted">Next due ₱{amount.toLocaleString()} on 1 November 2026 for November rent.</p>
      </div>
    </div>
  )
}

function Contract() {
  const [surrender, setSurrender] = useState(false)
  const { ping } = useApp()
  return (
    <div className="card">
      <h2>Lease L-204 · Wet Market A-04</h2>
      <p>Vendor Rosa Dela Cruz · Fish stall · ₱4,500 / month · Security deposit ₱9,000 (2 months)</p>
      <p>Term 15 Jan 2026 – 31 Dec 2026 · <strong>83 days to renewal</strong></p>
      <p className="muted">Keep the stall dry, pay monthly rent on or before the 5th, and report damage within 24 hours.</p>
      {!surrender ? (
        <button className="btn clay" onClick={() => setSurrender(true)}>Submit surrender request</button>
      ) : (
        <div className="form">
          <p>Voluntary termination starts a supervisor review of your ledger and stall condition.</p>
          <button className="btn primary" onClick={() => ping('Surrender request sent. Supervisor will inspect and check arrears.')}>Confirm surrender</button>
        </div>
      )}
    </div>
  )
}

function Support() {
  const { tickets, setTickets, ping } = useApp()
  const [issue, setIssue] = useState('Plumbing')
  const [note, setNote] = useState('')
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Report a stall issue</h2>
        <div className="form">
          <label>Type
            <select value={issue} onChange={(e) => setIssue(e.target.value)}>
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>Stall structure</option>
              <option>Pest / sanitation</option>
            </select>
          </label>
          <label>Details<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} /></label>
          <button className="btn primary" onClick={() => {
            setTickets((t) => [{ id: `TK-${20 + t.length}`, issue: `${issue}${note ? ': ' + note : ''}`, stall: 'A-04', status: 'Open' }, ...t])
            ping('Ticket filed. Facilities will see it on the supervisor desk.')
            setNote('')
          }}>Send ticket</button>
        </div>
      </div>
      <div className="card">
        <h2>Your tickets</h2>
        {tickets.map((t) => (
          <p key={t.id}><strong>{t.id}</strong> · {t.issue} · {t.status}</p>
        ))}
      </div>
    </div>
  )
}

function Profile() {
  const { session, ping } = useApp()
  const [phone, setPhone] = useState('0917 555 0144')
  const [ice, setIce] = useState('Pedro Dela Cruz · 0918 222 0099')
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Profile</h2>
      <div className="form">
        <label>Legal name<input defaultValue={session.name} /></label>
        <label>Email<input defaultValue={session.email} /></label>
        <label>Mobile<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label>Emergency contact<input value={ice} onChange={(e) => setIce(e.target.value)} /></label>
        <button className="btn primary" onClick={() => ping('Profile saved. ID changes still need supervisor re-verification.')}>Save</button>
      </div>
    </div>
  )
}

export default function Vendor() {
  const { stalls } = useApp()
  const stall = stalls.find((s) => s.id === 'A-04')
  return (
    <Shell
      title="Vendor portal"
      subtitle="Rosa Dela Cruz"
      chips={[`Stall: Wet Market A-04`, `October: ${stall.paid ? 'PAID' : 'UNPAID'}`, 'Next due: ₱4,500 on Nov 1']}
      nav={NAV}
    >
      <Routes>
        <Route index element={<Ledger />} />
        <Route path="pay" element={<Pay />} />
        <Route path="contract" element={<Contract />} />
        <Route path="support" element={<Support />} />
        <Route path="profile" element={<Profile />} />
        <Route path="utilities" element={<VendorUtilities />} />
        <Route path="notices" element={<VendorNotices />} />
        <Route path="*" element={<Navigate to="/vendor" />} />
      </Routes>
    </Shell>
  )
}
