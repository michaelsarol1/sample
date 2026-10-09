import React, { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { useApp, PENALTY_RATE_PER_DAY, PAYMENT_MODES, meterCharges } from '../store.jsx'
import { VendorUtilities } from './Utilities.jsx'
import { VendorNotices } from './Notices.jsx'

const NAV = [
  { to: '/vendor', end: true, label: '1. Ledger & Billing', hint: 'Real-time ledger, e-ORs, charges' },
  { to: '/vendor/pay', label: '2. Payments', hint: 'Rent, water, electricity, Bank' },
  { to: '/vendor/notifications', label: '3. Alerts', hint: 'Due dates, confirmations, notices' },
  { to: '/vendor/contract', label: '4. Contract Vault', hint: 'Lease terms, security deposit' },
  { to: '/vendor/support', label: '5. Support desk', hint: 'Plumbing, electrical, stall' },
  { to: '/vendor/profile', label: '6. Profile & contacts', hint: 'ID and emergency numbers' },
  { to: '/vendor/utilities', label: '7. Water & electricity', hint: 'Metered bills this month' },
  { to: '/vendor/notices', label: '8. Penalty notices', hint: 'Violations and fines' },
]

function StallSelection() {
  const { stalls, setStalls, apps, setApps, session, setSession, ping, addNotification } = useApp()
  const [sectionFilter, setSectionFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)

  const sections = useMemo(() => {
    const s = {}
    stalls.forEach(st => {
      if (st.status !== 'vacant') return
      if (!s[st.zone]) s[st.zone] = []
      s[st.zone].push(st)
    })
    return s
  }, [stalls])

  const sectionColors = {
    'Wet Market A': { bg: '#e3f2fd', border: '#1976d2', label: 'Wet Market A' },
    'Dry Goods B': { bg: '#fff3e0', border: '#e65100', label: 'Dry Goods B' },
    'Food Court C': { bg: '#f3e5f5', border: '#7b1fa2', label: 'Food Court C' },
  }

  const filtered = (zoneStalls) => sectionFilter === 'ALL' ? zoneStalls : zoneStalls.filter(s => s.zone === sectionFilter)

  const confirmSelection = () => {
    if (!selected) return
    setStalls((all) => all.map((s) => s.id === selected.id ? { ...s, status: 'occupied', vendor: session.name, paid: true } : s))
    setApps((all) => all.map((a) => a.name === session.name ? { ...a, stall: selected.id } : a))
    setSession((s) => ({ ...s, stall: selected.id, needsStallSelection: false }))
    addNotification({
      stall: selected.id, vendor: session.name, type: 'Lease Created', channel: 'Email',
      message: `Stall ${selected.id} (${selected.zone} · ${selected.type} · ${selected.sqm}sqm) has been assigned to you. Monthly rate ₱${selected.rate.toLocaleString()}. Visit Contract Vault to review and sign your lease.`,
    })
    ping(`Stall ${selected.id} (${selected.zone}) assigned to ${session.name}. Welcome to Bayanihan Public Market!`)
  }

  const vacantCount = stalls.filter(s => s.status === 'vacant').length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #d7efe3, #eaf7ef)', border: '2px solid #2f7a55', marginBottom: 16 }}>
        <div className="row space">
          <div>
            <h1 style={{ margin: 0, color: '#0e3325', fontFamily: 'Fraunces, serif', fontSize: 28 }}>Select your preferred stall</h1>
            <p style={{ margin: '6px 0 0', color: '#164a36' }}>Your account is approved! Choose from <strong>{vacantCount} vacant stalls</strong> across all sections. Once selected, your stall is reserved and your lease will be generated.</p>
          </div>
          {selected && (
            <div className="card" style={{ padding: 14, background: '#fff', border: '2px solid #164a36', borderRadius: 14 }}>
              <p className="tiny muted" style={{ margin: 0 }}>Selected:</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#164a36', fontFamily: 'Fraunces, serif' }}>{selected.id}</p>
              <p className="tiny" style={{ margin: 0 }}>{selected.zone} · {selected.type}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div className="row space" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Available stalls map</h2>
            <p className="tiny muted" style={{ margin: '4px 0 0' }}>Only vacant stalls are shown. Click to select.</p>
          </div>
          <div className="stall-legend">
            <span className="legend-item"><span className="legend-dot vacant"></span>Available — click to select</span>
          </div>
        </div>
        <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <label className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Filter by section:
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }}>
              <option value="ALL">All sections</option>
              {Object.keys(sections).map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="row space" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Stalls by section</h2>
            <span className="tiny muted">{vacantCount} total available</span>
          </div>

          {Object.entries(sections).map(([zone, zoneStalls]) => {
            const visible = filtered(zoneStalls)
            if (visible.length === 0) return null
            const sc = sectionColors[zone] || { bg: '#f5f5f5', border: '#999', label: zone }
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
                  <span className="tiny muted">{visible.length} available</span>
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
                      className={`stall vacant ${selected?.id === s.id ? 'selected' : ''}`}
                      onClick={() => setSelected(s)}
                      style={{ borderWidth: selected?.id === s.id ? '3px' : '2px' }}
                    >
                      <strong style={{ fontSize: 14 }}>{s.id}</strong>
                      <span style={{ fontSize: 10, opacity: 0.85 }}>{s.type}</span>
                      <span style={{ fontSize: 10, fontWeight: 650 }}>{s.sqm}sqm · ₱{s.rate.toLocaleString()}/mo</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          {!selected ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 64 }}>[ ]</div>
              <h2 style={{ margin: '10px 0 6px' }}>Select a stall to view details</h2>
              <p className="muted">Browse the available stalls in the map and click one that fits your business.</p>
            </div>
          ) : (
            <>
              <div className="row space" style={{ marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>Stall {selected.id}</h2>
                <span className="badge vacant">AVAILABLE</span>
              </div>
              <div className="card" style={{ padding: 14, background: 'var(--paper)', marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px' }}><strong>{selected.zone}</strong> · {selected.type} · {selected.sqm} sqm</p>
                <p style={{ margin: 0 }} className="muted">Monthly rate: <strong style={{ color: 'var(--forest-2)' }}>₱{selected.rate.toLocaleString()}</strong> (₱{selected.ratePerSqm}/sqm)</p>
              </div>

              <h3 style={{ fontFamily: 'Fraunces, serif', margin: '0 0 12px', fontSize: 18 }}>Estimated monthly costs</h3>
              <div className="card" style={{ padding: 12, background: 'var(--paper)', marginBottom: 16 }}>
                <div className="row space"><span>Monthly rent</span><strong>₱{selected.rate.toLocaleString()}</strong></div>
                <hr style={{ margin: '8px 0', border: 0, borderTop: '1px solid var(--line)' }} />
                <div className="row space"><strong>TOTAL est.</strong><strong className="display" style={{ fontSize: 22 }}>₱{selected.rate.toLocaleString()}/mo</strong></div>
                <p className="tiny muted" style={{ marginTop: 6 }}>Utilities (water & electricity) billed separately based on actual consumption.</p>
              </div>

              <div className="form">
                <button className="btn gold" onClick={confirmSelection} style={{ fontSize: 16, padding: '14px' }}>
                  Confirm & reserve Stall {selected.id}
                </button>
                <p className="tiny muted" style={{ textAlign: 'center', margin: 0 }}>By confirming, you agree to the standard market lease terms. Your stall will be reserved and a supervisor will finalize your contract.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Ledger({ stallId = 'A-04', vendorName = 'You' }) {
  const { receipts, ledger, ping, stalls, meters } = useApp()
  const mine = receipts.filter((r) => r.stall === stallId)
  const myLedger = ledger.filter(l => l.stall === stallId)
  const stall = stalls.find(s => s.id === stallId)
  const meter = meters.find(m => m.stall === stallId)
  const mc = meter ? meterCharges(meter) : { waterBill: 0, powerBill: 0 }

  const outstanding = myLedger.reduce((a, l) => a + (l.debit || 0) - (l.credit || 0), 0)
  const stallRate = stall?.rate || 4500

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="row space">
          <h2>Real-time ledger · Stall {stallId}</h2>
          {outstanding > 0
            ? <span className="badge unpaid">Balance ₱{outstanding.toLocaleString()}</span>
            : <span className="badge paid">Settled</span>}
        </div>
        <div className="card" style={{ padding: 14, background: 'var(--paper)', marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 10px' }}>October 2026 Billing Breakdown</h3>
          <div className="row space"><span>Monthly rent</span><strong>₱{stallRate.toLocaleString()}</strong></div>
          <div className="row space"><span>Water (consumption)</span><strong>₱{mc.waterBill.toLocaleString()}</strong></div>
          <div className="row space"><span>Electricity (consumption)</span><strong>₱{mc.powerBill.toLocaleString()}</strong></div>
          <hr style={{ margin: '8px 0' }} />
          <div className="row space"><strong>TOTAL</strong><strong className="display" style={{ fontSize: 24 }}>₱{(stallRate + mc.waterBill + mc.powerBill).toLocaleString()}</strong></div>
          {outstanding > 0 && (
            <p className="tiny" style={{ color: 'var(--rose)', marginTop: 8 }}>
              Penalty accruing at {(PENALTY_RATE_PER_DAY * 100)}%/day = ₱{Math.round(outstanding * PENALTY_RATE_PER_DAY).toLocaleString()}/day
            </p>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th><th>OR</th></tr></thead>
            <tbody>
              {myLedger.map(l => (
                <tr key={l.id}>
                  <td>{l.date}</td>
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
        <h2 style={{ marginTop: 20 }}>Payment history (e-ORs)</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>OR</th><th>Period</th><th>Paid</th><th>Mode</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r.or}>
                  <td>{r.or}</td><td>{r.period || '-'}</td><td>{r.date}</td><td>{r.mode}</td>
                  <td>₱{Number(r.amount).toLocaleString()}.00</td>
                  <td><button className="btn ghost" onClick={() => ping(`${r.or} downloaded as PDF`)}>Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>Outstanding balances</h2>
        {outstanding <= 0 && <p className="badge paid" style={{ display: 'inline-block' }}>All settled — no balance due</p>}
        {outstanding > 0 && (
          <div>
            <p className="display" style={{ fontSize: 40, color: 'var(--rose)', margin: '4px 0 16px' }}>₱{outstanding.toLocaleString()}</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Description</th><th>Amount</th><th>Due</th></tr></thead>
                <tbody>
                  {!meter?.waterPaid && mc.waterBill > 0 && (
                    <tr><td>Water</td><td>{mc.waterBill > 0 ? `${mc.waterBill} m³` : 'October bill'}</td><td>₱{mc.waterBill.toLocaleString()}</td><td>Oct 15</td></tr>
                  )}
                  {!meter?.powerPaid && mc.powerBill > 0 && (
                    <tr><td>Electricity</td><td>{mc.powerBill > 0 ? `${mc.powerBill} kWh` : 'October bill'}</td><td>₱{mc.powerBill.toLocaleString()}</td><td>Oct 15</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="btn gold" style={{ marginTop: 12, width: '100%' }} onClick={() => window.location.hash = '#/vendor/pay'}>Settle outstanding balance</button>
          </div>
        )}
        <h2 style={{ marginTop: 20 }}>Security deposit</h2>
        <p className="display" style={{ fontSize: 32 }}>₱9,000</p>
        <p className="tiny muted">Held against damages and arrears · Refunded on lease termination (less deductions)</p>
      </div>
    </div>
  )
}

function Pay({ stallId = 'A-04', vendorName = 'You' }) {
  const { stalls, setStalls, setReceipts, ping, meters, setMeters, addLedgerEntry, addNotification } = useApp()
  const stall = stalls.find((s) => s.id === stallId)
  const meter = meters.find(m => m.stall === stallId)
  const mc = meter ? meterCharges(meter) : { waterBill: 0, powerBill: 0 }
  const vendor = vendorName

  const [payWhat, setPayWhat] = useState('rent')
  const [payMode, setPayMode] = useState('GCash')

  const items = {
    rent: { label: 'Monthly Rent — October 2026', amount: stall.rate, paid: stall.paid, type: 'Monthly Rent' },
    utilities: { label: 'Utilities — Water + Power', amount: mc.waterBill + mc.powerBill, paid: meter?.waterPaid && meter?.powerPaid, type: 'Utilities' },
    all: { label: 'Settle ALL outstanding', amount: (stall.paid ? 0 : stall.rate) + (meter?.waterPaid ? 0 : mc.waterBill) + (meter?.powerPaid ? 0 : mc.powerBill), paid: false, type: 'Full Settlement' },
  }
  const current = items[payWhat]

  const pay = () => {
    if (!current.amount) return ping('Nothing to pay for this item.')
    const or = `eOR-${89000 + Math.floor(Math.random() * 99)}`
    const modeLabel = PAYMENT_MODES.find(p => p.id === payMode)?.label || payMode

    if (payWhat === 'rent' || payWhat === 'all') {
      setStalls((all) => all.map((s) => s.id === stallId ? { ...s, paid: true } : s))
    }
    if (payWhat === 'utilities' || payWhat === 'all') {
      setMeters(all => all.map(m => m.stall === stallId ? { ...m, waterPaid: true, powerPaid: true } : m))
    }
    if (payWhat === 'rent' || payWhat === 'all') {
      addLedgerEntry({ stall: stallId, vendor, type: 'Monthly Rent', period: 'October 2026', debit: 0, credit: stall.rate, balance: 0, or, mode: payMode })
    }

    setReceipts((r) => [{ or, date: '2026-10-09', amount: current.amount, mode: payMode, stall: stallId, period: current.type + ' — October 2026', type: current.type }, ...r])
    addNotification({
      stall: stallId, vendor, type: 'Payment Confirmation', channel: payMode === 'Bank' ? 'Email' : 'SMS',
      message: `Your payment of ₱${current.amount.toLocaleString()} via ${modeLabel} has been posted. OR# ${or}. Thank you!`,
    })
    ping(`${modeLabel} ₱${current.amount.toLocaleString()} posted. OR# ${or}. Confirmation sent via SMS/Email.`)
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>What would you like to pay?</h2>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(items).map(([k, v]) => (
            <button key={k} className={`btn ${payWhat === k ? 'primary' : 'ghost'}`} onClick={() => setPayWhat(k)}>
              {k === 'rent' ? 'Rent' : k === 'utilities' ? 'Utilities' : 'All'}
            </button>
          ))}
        </div>
        <div className="card" style={{ padding: 16, background: 'var(--paper)', margin: '16px 0' }}>
          <p className="tiny muted">{current.label}</p>
          <p className="display" style={{ fontSize: 44, margin: '4px 0' }}>₱{current.amount.toLocaleString()}</p>
          {current.paid && <span className="badge paid">Already paid</span>}
        </div>
        <h3>Choose payment method</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PAYMENT_MODES.map(pm => (
            <label key={pm.id} className="card" style={{
              padding: 14, background: payMode === pm.id ? 'var(--olive-10)' : 'var(--paper)',
              cursor: 'pointer', border: payMode === pm.id ? '2px solid var(--olive)' : '2px solid transparent',
            }}>
              <div className="row space" style={{ alignItems: 'center' }}>
                <input type="radio" name="pmode" checked={payMode === pm.id} onChange={() => setPayMode(pm.id)} style={{ marginRight: 8 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}><strong>{pm.label}</strong></p>
                  <p className="tiny muted" style={{ margin: 0 }}>{pm.hint}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
        <button className="btn gold" style={{ marginTop: 16, width: '100%' }} onClick={pay} disabled={current.paid || !current.amount}>
          Pay ₱{current.amount.toLocaleString()} via {PAYMENT_MODES.find(p => p.id === payMode)?.label}
        </button>
      </div>
      <div className="card">
        <h2>Payment guide</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
            <p><strong>Bank Transfer</strong></p>
            <p className="tiny muted">
              Account Name: BAYANIHAN PUBLIC MARKET TRUST FUND<br />
              BDO: 001234567890 · BPI: 109876543210 · Landbank: 1890-1234-5678<br />
              Email deposit slip to treasury@bayanihan-market.gov.ph with your stall number.
            </p>
          </div>
          <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
            <p><strong>Collector Cash POS</strong></p>
            <p className="tiny muted">Field collectors circulate in Wet Market A (Paolo) and Dry Goods B (Mina) every morning from 8:00–11:00 AM. They issue thermal e-ORs via Bluetooth.</p>
          </div>
        </div>
        <h2 style={{ marginTop: 20 }}>This month's status</h2>
        <p><span className={`badge ${stall.paid ? 'paid' : 'unpaid'}`}>{stall.paid ? 'RENT PAID' : 'RENT UNPAID'}</span></p>
        <p><span className={`badge ${meter?.waterPaid ? 'paid' : 'unpaid'}`}>{meter?.waterPaid ? 'WATER PAID' : 'WATER UNPAID'}</span> · <span className={`badge ${meter?.powerPaid ? 'paid' : 'unpaid'}`}>{meter?.powerPaid ? 'POWER PAID' : 'POWER UNPAID'}</span></p>
        <p className="muted">Next due ₱{stall.rate.toLocaleString()} on 1 November 2026 for November rent.</p>
      </div>
    </div>
  )
}

function Notifications({ stallId = 'A-04', vendorName = 'You' }) {
  const { notifications, setNotifications } = useApp()
  const mine = notifications.filter(n => n.stall === stallId || n.vendor === vendorName || n.vendor === 'You')
  const unread = mine.filter(n => !n.read).length

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="row space">
          <h2>Your notifications</h2>
          <span className="chip">{unread} new</span>
        </div>
        <p className="muted tiny">Alerts are sent via SMS and/or email. A copy is stored here for your records.</p>
        <div style={{ marginTop: 12 }}>
          {mine.length === 0 && <p className="muted">No notifications yet — you're all set!</p>}
          {mine.map(n => (
            <div key={n.id} className="card" style={{
              padding: 16, marginBottom: 10, background: n.read ? 'transparent' : 'var(--paper)',
              borderLeft: n.read ? 'none' : '4px solid var(--olive)',
              cursor: 'pointer'
            }} onClick={() => {
              setNotifications(all => all.map(x => x.id === n.id ? { ...x, read: true } : x))
            }}>
              <div className="row space" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>
                    <strong>{n.type}</strong>
                    <span className="badge" style={{ background: n.channel === 'SMS' ? 'var(--gold)' : 'var(--olive-10)', marginLeft: 8 }}>{n.channel}</span>
                  </p>
                  <p className="tiny muted" style={{ margin: '4px 0 8px' }}>{n.sent}</p>
                  <p style={{ margin: 0 }}>{n.message}</p>
                </div>
                {!n.read && <span className="badge unpaid" style={{ width: 10, height: 10, borderRadius: '50%', padding: 0 }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Alert preferences</h2>
        <div className="form">
          <label className="row" style={{ fontWeight: 450 }}>
            <input type="checkbox" defaultChecked /> Send me SMS reminders 3 days before due dates
          </label>
          <label className="row" style={{ fontWeight: 450 }}>
            <input type="checkbox" defaultChecked /> Send me instant SMS + Email payment confirmations
          </label>
          <label className="row" style={{ fontWeight: 450 }}>
            <input type="checkbox" defaultChecked /> Email me violation notices with attached PDF
          </label>
          <label className="row" style={{ fontWeight: 450 }}>
            <input type="checkbox" defaultChecked /> Email lease renewal reminders at 90/60/30 days
          </label>
          <label className="row" style={{ fontWeight: 450 }}>
            <input type="checkbox" /> SMS only (disable all email notifications)
          </label>
        </div>
        <h2 style={{ marginTop: 20 }}>Schedule</h2>
        <ul style={{ paddingLeft: 18 }}>
          <li><strong>Every 2nd of the month</strong> — Due-date reminder (SMS + Email)</li>
          <li><strong>Every 6th of the month</strong> — Delinquency alert if unpaid (SMS)</li>
          <li><strong>Instant on payment</strong> — Confirmation with e-OR number</li>
          <li><strong>90/60/30 days before lease end</strong> — Renewal intent reminder</li>
        </ul>
      </div>
    </div>
  )
}

function Contract({ stallId = 'A-04', vendorName = 'You' }) {
  const [surrender, setSurrender] = useState(false)
  const { ping, addNotification, stalls, leases } = useApp()
  const stall = stalls.find(s => s.id === stallId)
  const myLease = leases.find(l => l.stall === stallId) || leases[0]
  const stallRate = stall?.rate || 4500
  const stallSqm = stall?.sqm || 10
  const stallRatePerSqm = stall?.ratePerSqm || 450
  const security = stallRate * 2
  const leaseNo = myLease?.id || 'L-204'
  const vendorDisplay = vendorName === 'You' ? (stall?.vendor || 'Rosa Dela Cruz') : vendorName
  const stallType = stall?.type || 'Fish'
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Lease {leaseNo} · {stall?.zone || 'Wet Market A'} {stallId}</h2>
        <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
          <p className="row space"><span>Vendor</span><strong>{vendorDisplay}</strong></p>
          <p className="row space"><span>Premises</span><strong>Stall {stallId} · {stallType} · {stallSqm} sqm</strong></p>
          <p className="row space"><span>Monthly rent</span><strong>₱{stallRate.toLocaleString()} (₱{stallRatePerSqm.toLocaleString()}/sqm)</strong></p>
          <p className="row space"><span>Security deposit</span><strong>₱{security.toLocaleString()} (2 months)</strong></p>
          <p className="row space"><span>Penalty on arrears</span><strong>{(PENALTY_RATE_PER_DAY * 100)}% per day</strong></p>
          <hr style={{ margin: '8px 0' }} />
          <p className="row space"><span>Term</span><strong>{myLease?.start || 'Jan 15, 2026'} – {myLease?.end || 'Dec 31, 2026'}</strong></p>
          <p className="row space"><span>Days remaining</span><strong className="display" style={{ fontSize: 22, color: 'var(--olive)' }}>83 days</strong></p>
          <p className="row space"><span>Status</span><span className="badge active">{myLease?.status || 'ACTIVE'}</span></p>
        </div>
        <h3 style={{ marginTop: 18 }}>Standard terms & conditions</h3>
        <ol style={{ paddingLeft: 20, fontSize: 14 }}>
          <li>Monthly rent is due on or before the 5th of each month.</li>
          <li>Arrears beyond the 5th are subject to {(PENALTY_RATE_PER_DAY * 100)}% daily penalty under Market Code Art. 18.</li>
          <li>Security deposit (2 months) is held against damages, repairs, and final arrears.</li>
          <li>Stall subletting requires written supervisor approval (Art. 7 §3).</li>
          <li>Utilities (water, electricity) are separately metered and billed monthly.</li>
          <li>Renewal intent must be submitted 60 days before lease end.</li>
        </ol>
      </div>
      <div className="card">
        <h2>Contract documents</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <button className="btn ghost" style={{ textAlign: 'left', width: '100%' }}>Signed Lease Agreement L-204.pdf</button>
          <button className="btn ghost" style={{ textAlign: 'left', width: '100%' }}>Security Deposit Receipt #SD-4421.pdf</button>
          <button className="btn ghost" style={{ textAlign: 'left', width: '100%' }}>Vendor ID & Barangay Clearance.pdf</button>
          <button className="btn ghost" style={{ textAlign: 'left', width: '100%' }}>Market Code of Ordinances.pdf</button>
        </div>
        <h2 style={{ marginTop: 20 }}>Renewal</h2>
        <p className="muted">Your lease expires on <strong>December 31, 2026</strong>. You may submit renewal intent starting October 31, 2026.</p>
        <div className="form">
          <label>I intend to renew for:
            <select>
              <option>12 months (standard)</option>
              <option>24 months</option>
              <option>Not renewing</option>
            </select>
          </label>
          <button className="btn gold" onClick={() => {
            addNotification({
              stall: stallId, vendor: vendorName, type: 'Lease Renewal', channel: 'Email',
              message: `Your renewal intent for Lease ${leaseNo} (12 months) has been recorded. Supervisor will review and send the new contract for signing by Nov 15.`,
            })
            ping('Renewal intent submitted. Supervisor notified. Check Alerts for updates.')
          }}>Submit renewal intent</button>
        </div>
        <hr style={{ margin: '20px 0' }} />
        {!surrender ? (
          <button className="btn clay" onClick={() => setSurrender(true)}>Submit surrender / termination request</button>
        ) : (
          <div className="form">
            <h3>Surrender lease {leaseNo}</h3>
            <p>Voluntary termination starts a supervisor review of your ledger and stall condition. Security deposit (₱{security.toLocaleString()}) is refunded less any arrears and repair costs.</p>
            <label>Reason for surrender
              <select>
                <option>Relocation to another market</option>
                <option>Retirement / closure of business</option>
                <option>Upgrade to a larger stall</option>
                <option>Other (specify below)</option>
              </select>
            </label>
            <label>Additional notes
              <textarea rows={3} placeholder="Any remarks for the supervisor..." />
            </label>
            <button className="btn primary" onClick={() => {
              addNotification({
                stall: stallId, vendor: vendorName, type: 'Lease Terminated', channel: 'Email',
                message: `Surrender request for ${leaseNo} received. Supervisor will schedule a stall inspection within 3 business days and contact you regarding deposit disposition.`,
              })
              ping('Surrender request sent. Supervisor will inspect and check arrears.')
            }}>Confirm surrender request</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Support({ stallId = 'A-04' }) {
  const { tickets, setTickets, ping } = useApp()
  const [issue, setIssue] = useState('Plumbing')
  const [note, setNote] = useState('')
  const myTickets = tickets.filter(t => t.stall === stallId)
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
            setTickets((t) => [{ id: `TK-${20 + t.length}`, issue: `${issue}${note ? ': ' + note : ''}`, stall: stallId, status: 'Open' }, ...t])
            ping('Ticket filed. Facilities will see it on the supervisor desk. Confirmation sent via SMS.')
            setNote('')
          }}>Send ticket</button>
        </div>
      </div>
      <div className="card">
        <h2>Your tickets · Stall {stallId}</h2>
        {[...myTickets, ...tickets.slice(0, Math.max(0, 2 - myTickets.length))].map((t) => (
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
  const { stalls, notifications, apps, session } = useApp()
  const myApp = apps.find(a => a.name === session?.name)
  const needsStall = session?.role === 'Vendor' && (!session?.stall || session?.needsStallSelection) && (!myApp?.stall)
  const myStallId = session?.stall || myApp?.stall
  const stall = stalls.find((s) => s.id === myStallId) || stalls.find(s => s.id === 'A-04')
  const effectiveStallId = myStallId || 'A-04'
  const unread = notifications.filter(n => (n.stall === effectiveStallId || n.vendor === session?.name || n.vendor === 'You') && !n.read).length

  if (needsStall) {
    return (
      <Shell
        title="Vendor portal"
        subtitle={session?.name || 'New Vendor'}
        chips={['Account approved', 'Select your stall to continue']}
        nav={NAV}
      >
        <StallSelection />
      </Shell>
    )
  }

  const displayStall = stall?.id || effectiveStallId
  const displayStallName = stall ? `${stall.zone} ${displayStall}` : `Stall ${displayStallId}`
  const displayVendor = session?.name || stall?.vendor || 'Rosa Dela Cruz'

  return (
    <Shell
      title="Vendor portal"
      subtitle={displayVendor}
      chips={[`Stall: ${displayStallName}`, `October: ${stall?.paid ? 'PAID' : 'UNPAID'}`, `Next due: ₱${(stall?.rate || 4500).toLocaleString()} on Nov 1`, `${unread} alert${unread !== 1 ? 's' : ''}`]}
      nav={NAV}
    >
      <Routes>
        <Route index element={<Ledger stallId={effectiveStallId} vendorName={displayVendor} />} />
        <Route path="pay" element={<Pay stallId={effectiveStallId} vendorName={displayVendor} />} />
        <Route path="notifications" element={<Notifications stallId={effectiveStallId} vendorName={displayVendor} />} />
        <Route path="contract" element={<Contract stallId={effectiveStallId} vendorName={displayVendor} />} />
        <Route path="support" element={<Support stallId={effectiveStallId} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="utilities" element={<VendorUtilities stallId={effectiveStallId} vendorName={displayVendor} />} />
        <Route path="notices" element={<VendorNotices vendorName={displayVendor} />} />
        <Route path="*" element={<Navigate to="/vendor" />} />
      </Routes>
    </Shell>
  )
}
