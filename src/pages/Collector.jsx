import React, { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { useApp, PENALTY_RATE_PER_DAY, PAYMENT_MODES, meterCharges } from '../store.jsx'
import { CollectorUtilities } from './Utilities.jsx'

const NAV = [
  { to: '/collector', end: true, label: '1. Quick Collection POS', hint: 'Auto-calc fees, scan QR, search' },
  { to: '/collector/pay', label: '2. Payment modes', hint: 'Cash, OTC, Bank, GCash, Maya' },
  { to: '/collector/receipt', label: '3. Thermal receipt', hint: 'Bluetooth e-OR print' },
  { to: '/collector/matrix', label: '4. Stall status matrix', hint: 'Paid / unpaid grid' },
  { to: '/collector/remit', label: '5. End-of-day remittance', hint: 'Turnover to treasurer' },
  { to: '/collector/utilities', label: '6. Collect utilities', hint: 'Water and power bills' },
]

function Pos() {
  const { stalls, setStalls, setReceipts, setCollected, ping, meters, addLedgerEntry, addNotification } = useApp()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(stalls.find((s) => !s.paid && s.status === 'occupied') || stalls[0])
  const [collectWhat, setCollectWhat] = useState('rent')

  const list = stalls.filter((s) => s.zone.includes('Wet') && (`${s.id} ${s.vendor || ''}`.toLowerCase().includes(q.toLowerCase())))
  const meter = meters.find(m => m.stall === sel.id)
  const mc = meter ? meterCharges(meter) : { waterBill: 0, powerBill: 0 }

  const items = {
    rent: {
      label: 'Monthly Rent',
      amount: sel.rate,
      paid: sel.paid,
      type: 'Monthly Rent',
      breakdown: [
        { label: 'Monthly rent (stall)', amount: sel.rate },
      ]
    },
    utilities: {
      label: 'Water + Power',
      amount: mc.waterBill + mc.powerBill,
      paid: meter?.waterPaid && meter?.powerPaid,
      type: 'Utilities',
      breakdown: [
        { label: `Water (${mc.waterBill > 0 ? (meter ? (meter.waterCurr - meter.waterPrev).toFixed(1) : 0) : 0} m³)`, amount: mc.waterBill },
        { label: `Power (${mc.powerBill > 0 ? (meter ? (meter.powerCurr - meter.powerPrev).toFixed(1) : 0) : 0} kWh)`, amount: mc.powerBill },
      ]
    },
    all: {
      label: 'Full Settlement',
      amount: (sel.paid ? 0 : sel.rate) + (meter?.waterPaid ? 0 : mc.waterBill) + (meter?.powerPaid ? 0 : mc.powerBill),
      paid: false,
      type: 'Full Settlement',
      breakdown: [
        { label: 'Monthly rent', amount: sel.paid ? 0 : sel.rate },
        { label: 'Water', amount: meter?.waterPaid ? 0 : mc.waterBill },
        { label: 'Power', amount: meter?.powerPaid ? 0 : mc.powerBill },
      ]
    },
  }
  const current = items[collectWhat]
  const subtotal = current.breakdown.reduce((a, b) => a + b.amount, 0)
  const penalty = (collectWhat === 'rent' || collectWhat === 'all') && !sel.paid ? Math.round(sel.rate * PENALTY_RATE_PER_DAY * 4) : 0
  const total = subtotal + penalty

  const collect = (mode) => {
    if (sel.status !== 'occupied') return ping('Stall is not occupied')
    if (!total) return ping('Nothing to collect — all items already paid.')
    const or = `eOR-${88422 + Math.floor(Math.random() * 80)}`
    const modeLabel = PAYMENT_MODES.find(p => p.id === mode)?.label || mode

    if (collectWhat === 'rent' || collectWhat === 'all') {
      setStalls((all) => all.map((s) => s.id === sel.id ? { ...s, paid: true } : s))
      addLedgerEntry({
        stall: sel.id, vendor: sel.vendor, type: 'Monthly Rent', period: 'October 2026',
        debit: 0, credit: sel.rate, balance: 0, or, mode,
      })
    }
    if (collectWhat === 'utilities' || collectWhat === 'all') {
      if (meter && !meter.waterPaid) {
        addLedgerEntry({
          stall: sel.id, vendor: sel.vendor, type: 'Water Bill', period: 'October 2026',
          debit: 0, credit: mc.waterBill, balance: 0, or, mode,
        })
      }
      if (meter && !meter.powerPaid) {
        addLedgerEntry({
          stall: sel.id, vendor: sel.vendor, type: 'Power Bill', period: 'October 2026',
          debit: 0, credit: mc.powerBill, balance: 0, or, mode,
        })
      }
    }

    setReceipts((r) => [{ or, date: '2026-10-09', amount: total, mode, stall: sel.id, period: `${current.type} — October 2026`, type: current.type }, ...r])
    setCollected((n) => n + total)
    addNotification({
      stall: sel.id, vendor: sel.vendor, type: 'Payment Confirmation', channel: mode === 'Cash' || mode === 'OTC' ? 'SMS' : 'SMS',
      message: `Your payment of ₱${total.toLocaleString()} (${current.type}) via ${modeLabel} has been posted. OR# ${or}. Thank you!`,
    })
    ping(`${modeLabel} ₱${total.toLocaleString()} posted. ${or} queued for thermal print · Confirmation SMS sent.`)
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
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(items).map(([k, v]) => (
            <button key={k} className={`btn ${collectWhat === k ? 'primary' : 'ghost'}`} style={{ fontSize: 13 }} onClick={() => setCollectWhat(k)}>
              {k === 'rent' ? 'Rent' : k === 'utilities' ? 'Utilities' : 'All'}
            </button>
          ))}
        </div>
        <div className="card" style={{ padding: 12, background: 'var(--paper)', margin: '12px 0', color: 'var(--ink)' }}>
          <p className="row space" style={{ margin: '2px 0' }}><span>Stall / Vendor</span><strong>{sel.id} · {sel.vendor || 'Vacant'}</strong></p>
          <p className="row space" style={{ margin: '2px 0' }}><span>Item</span><strong>{current.label}</strong></p>
          <hr style={{ margin: '8px 0' }} />
          {current.breakdown.map((b, i) => (
            <p key={i} className={`row space ${!b.amount ? 'muted' : ''}`} style={{ margin: '2px 0' }}>
              <span className="tiny">{b.label}</span>
              <strong className="tiny">{b.amount ? `₱${b.amount.toLocaleString()}` : 'PAID'}</strong>
            </p>
          ))}
          <hr style={{ margin: '8px 0' }} />
          {penalty > 0 && (
            <p className="row space" style={{ margin: '2px 0', color: 'var(--rose)' }}>
              <span className="tiny">Penalty (4 days @ {(PENALTY_RATE_PER_DAY * 100)}%)</span>
              <strong className="tiny">₱{penalty.toLocaleString()}</strong>
            </p>
          )}
          <p className="row space" style={{ margin: '4px 0' }}>
            <span><strong>TOTAL</strong></span>
            <span className="display" style={{ fontSize: 28 }}>₱{total.toLocaleString()}</span>
          </p>
        </div>
        <p className="tiny">{current.label} · {sel.id} · {sel.paid && collectWhat === 'rent' ? 'RENT PAID' : collectWhat === 'rent' ? 'DUE THIS MONTH' : ''}</p>
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <button className="btn gold" onClick={() => collect('Cash')}>Cash</button>
          <button className="btn clay" onClick={() => collect('Bank')}>Bank</button>
          <button className="btn gold" onClick={() => collect('GCash')} style={{ background: '#0075ff', color: 'white' }}>GCash</button>
          <button className="btn primary" onClick={() => collect('Maya')}>Maya</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Nearby stalls</h2>
        {list.slice(0, 8).map((s) => {
          const sm = meters.find(m => m.stall === s.id)
          const openUtils = sm && (!sm.waterPaid || !sm.powerPaid)
          return (
            <button key={s.id} className="btn ghost" style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => setSel(s)}>
              {s.id} · {s.vendor || s.status} · {s.status !== 'occupied' ? s.status : s.paid ? 'Rent paid' : 'Rent unpaid'}{openUtils ? ' · Utils open' : ''}
            </button>
          )
        })}
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
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {PAYMENT_MODES.map((m) => (
            <button key={m.id} className={`btn ${mode === m.id ? 'primary' : 'ghost'}`} onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
        </div>
        {mode === 'Cash' && (
          <div className="card" style={{ padding: 14, background: 'var(--paper)', marginTop: 16 }}>
            <h3 style={{ margin: 0 }}>Collector Cash Protocol</h3>
            <ol className="tiny" style={{ paddingLeft: 18 }}>
              <li>Count tender in front of the vendor.</li>
              <li>Confirm change on the POS screen.</li>
              <li>Tap "Post collection" — e-OR is generated instantly.</li>
              <li>Optionally print via Bluetooth thermal printer.</li>
              <li>Cash stays sealed in the collector pouch until end-of-day remittance.</li>
            </ol>
          </div>
        )}
        {mode === 'Bank' && (
          <div className="card" style={{ padding: 14, background: 'var(--paper)', marginTop: 16 }}>
            <h3 style={{ margin: 0 }}>Bank Transfer Details</h3>
            <p className="tiny muted">Account Name: <strong>BAYANIHAN PUBLIC MARKET TRUST FUND</strong></p>
            <ul className="tiny" style={{ paddingLeft: 18 }}>
              <li>BDO: 001234567890</li>
              <li>BPI: 109876543210</li>
              <li>Landbank: 1890-1234-5678</li>
              <li>PNB: 1200-8765-4321</li>
            </ul>
            <p className="tiny muted">Vendor must email deposit slip to <strong>treasury@bayanihan-market.gov.ph</strong> with stall number and OR reference.</p>
          </div>
        )}
        {(mode === 'GCash' || mode === 'Maya') && (
          <div className="upload" style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28 }}>QR · {mode}</div>
            <p className="muted">Vendor scans the stall QR or collector QR. Settlement posts when the wallet callback succeeds. Auto-retry on timeout.</p>
            <div style={{ width: 160, height: 160, margin: '12px auto', background: 'repeating-conic-gradient(#14241c 0% 25%, #f4eee3 0% 50%)', backgroundSize: '16px 16px', border: '1px solid var(--line)' }} />
            <p className="tiny muted">For Maya: Merchant ID MKT-BAYANIHAN-001</p>
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
        <p>{last.or}<br />{last.date}<br />Stall {last.stall}<br />Period: {last.period || 'October 2026'}<br />Mode: {last.mode}<br /><strong>{(last.type || 'MONTHLY RENT').toUpperCase()} ₱{Number(last.amount).toLocaleString()}.00</strong></p>
        <p className="tiny">This is a system-generated receipt. Valid with collector log {last.or}.</p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary" style={{ width: '100%' }} onClick={() => ping('Sent to Bluetooth thermal printer IMP002')}>Print</button>
          <button className="btn ghost" style={{ width: '100%' }} onClick={() => ping('SMS copy sent to vendor mobile')}>SMS copy</button>
        </div>
      </div>
    </div>
  )
}

function Matrix() {
  const { stalls, meters } = useApp()
  const zone = stalls.filter((s) => s.zone.includes('Wet'))
  return (
    <div className="field-shell">
      <div className="card">
        <h2>Wet Market A · October 2026</h2>
        <p className="tiny muted">Green = paid · Red = unpaid · Gray = vacant/maintenance · Dot = open utilities</p>
        <div className="matrix">
          {zone.map((s) => {
            const m = meters.find(mm => mm.stall === s.id)
            const utilsOpen = m && (!m.waterPaid || !m.powerPaid)
            return (
              <div key={s.id} className={`cell ${s.status !== 'occupied' ? 'partial' : s.paid ? 'paid' : 'unpaid'}`} style={{ position: 'relative' }}>
                {s.id}<br />{s.status !== 'occupied' ? s.status : s.paid ? 'PAID' : 'DUE'}
                {utilsOpen && <span style={{ position: 'absolute', top: 2, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Remit() {
  const { collected, ping, receipts, ledger } = useApp()
  const cash = receipts.filter((r) => r.mode === 'Cash' && r.date === '2026-10-09').reduce((a, r) => a + r.amount, 0)
  const bank = receipts.filter((r) => r.mode === 'Bank' && r.date === '2026-10-09').reduce((a, r) => a + r.amount, 0)
  const ewallet = receipts.filter((r) => (r.mode === 'GCash' || r.mode === 'Maya') && r.date === '2026-10-09').reduce((a, r) => a + r.amount, 0)
  const orCount = receipts.filter(r => r.date === '2026-10-09').length
  const rentCount = ledger.filter(l => l.date.startsWith('2026-10') && l.type === 'Monthly Rent' && l.credit > 0).length

  return (
    <div className="field-shell">
      <div className="card">
        <h2>End-of-day remittance · Oct 9 2026</h2>
        <p className="display" style={{ fontSize: 36, margin: '8px 0' }}>₱{collected.toLocaleString()}</p>
        <div className="grid cols-2" style={{ marginTop: 12 }}>
          <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
            <p className="tiny muted">Cash in pouch</p>
            <p className="display" style={{ fontSize: 22, margin: 0 }}>₱{(cash || 18000).toLocaleString()}</p>
          </div>
          <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
            <p className="tiny muted">Bank transfers today</p>
            <p className="display" style={{ fontSize: 22, margin: 0 }}>₱{bank.toLocaleString()}</p>
          </div>
          <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
            <p className="tiny muted">e-Wallet (auto-settled)</p>
            <p className="display" style={{ fontSize: 22, margin: 0 }}>₱{ewallet.toLocaleString()}</p>
          </div>
          <div className="card" style={{ padding: 14, background: 'var(--paper)' }}>
            <p className="tiny muted">Official receipts issued</p>
            <p className="display" style={{ fontSize: 22, margin: 0 }}>{orCount} ORs · {rentCount} rent</p>
          </div>
        </div>
        <p style={{ marginTop: 12 }}>Paolo Villar · Wet Market A · {orCount} receipts today · Cash in pouch ₱{(cash || 18000).toLocaleString()} · e-Wallet + Bank already in city treasury account</p>
        <button className="btn gold" style={{ marginTop: 16, width: '100%' }} onClick={() => ping('Remittance bag sealed. Treasurer acknowledgement pending. Control slip #R-1009 attached.')}>
          Seal remittance bag & submit to treasurer
        </button>
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
