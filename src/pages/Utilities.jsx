import React, { useState } from 'react'
import { meterCharges, POWER_RATE, WATER_RATE, useApp } from '../store.jsx'

export function SupervisorUtilities() {
  const { meters, setMeters, ping } = useApp()
  const [sel, setSel] = useState(meters[0].stall)
  const meter = meters.find((m) => m.stall === sel) || meters[0]
  const [form, setForm] = useState({ waterCurr: meter.waterCurr, powerCurr: meter.powerCurr })
  const pick = (id) => {
    const m = meters.find((x) => x.stall === id)
    setSel(id)
    setForm({ waterCurr: m.waterCurr, powerCurr: m.powerCurr })
  }
  const ch = meterCharges({ ...meter, ...form })
  const unpaid = meters.filter((m) => !m.waterPaid || !m.powerPaid).length

  const save = () => {
    if (Number(form.waterCurr) < meter.waterPrev || Number(form.powerCurr) < meter.powerPrev) {
      ping('Current reading cannot be lower than the previous reading')
      return
    }
    setMeters((all) => all.map((m) => m.stall === meter.stall
      ? { ...m, waterCurr: Number(form.waterCurr), powerCurr: Number(form.powerCurr), waterPaid: false, powerPaid: false }
      : m))
    ping(`October readings saved for ${meter.stall}. Bills generated.`)
  }

  return (
    <>
      <div className="kpis">
        <div className="kpi"><div className="label">Water rate</div><div className="value">₱{WATER_RATE}<span className="tiny"> /m³</span></div></div>
        <div className="kpi"><div className="label">Power rate</div><div className="value">₱{POWER_RATE}<span className="tiny"> /kWh</span></div></div>
        <div className="kpi warn"><div className="label">Stalls with unpaid utilities</div><div className="value">{unpaid}</div></div>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <h2>Meter roll · October 2026</h2>
          <p className="muted tiny">Previous reading is last month’s close. Current reading posts this month’s consumption.</p>
          {meters.map((m) => {
            const c = meterCharges(m)
            const ok = m.waterPaid && m.powerPaid
            return (
              <button key={m.stall} className={`btn ghost ${sel === m.stall ? 'primary' : ''}`} style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => pick(m.stall)}>
                {m.stall} · {m.vendor} · ₱{c.total.toLocaleString()} · {ok ? 'SETTLED' : 'OPEN'}
              </button>
            )
          })}
        </div>
        <div className="card">
          <h2>{meter.stall} meters</h2>
          <p className="tiny muted">Water {meter.waterId} · Power {meter.powerId}</p>
          <div className="grid cols-2" style={{ marginTop: 12 }}>
            <label>Water current (m³)
              <input type="number" step="0.1" value={form.waterCurr} onChange={(e) => setForm({ ...form, waterCurr: e.target.value })} />
              <span className="tiny muted">Previous {meter.waterPrev} · Use {ch.waterM3} m³ · ₱{ch.waterBill.toLocaleString()}</span>
            </label>
            <label>Power current (kWh)
              <input type="number" step="0.1" value={form.powerCurr} onChange={(e) => setForm({ ...form, powerCurr: e.target.value })} />
              <span className="tiny muted">Previous {meter.powerPrev} · Use {ch.powerKwh} kWh · ₱{ch.powerBill.toLocaleString()}</span>
            </label>
          </div>
          <div className="meter-bar" style={{ marginTop: 16 }}>
            <div className="fill water" style={{ width: `${Math.min(100, ch.waterM3 * 4)}%` }} />
          </div>
          <p className="tiny">Water use this month</p>
          <div className="meter-bar">
            <div className="fill power" style={{ width: `${Math.min(100, ch.powerKwh / 4)}%` }} />
          </div>
          <p className="tiny">Power use this month</p>
          <p className="display" style={{ fontSize: 28, margin: '12px 0' }}>Bill ₱{ch.total.toLocaleString()}</p>
          <button className="btn primary" onClick={save}>Post readings & generate bill</button>
        </div>
      </div>
    </>
  )
}

export function CollectorUtilities() {
  const { meters, setMeters, setReceipts, setCollected, ping } = useApp()
  const open = meters.filter((m) => !m.waterPaid || !m.powerPaid)
  const [sel, setSel] = useState(open[0]?.stall || meters[0].stall)
  const meter = meters.find((m) => m.stall === sel) || meters[0]
  const ch = meterCharges(meter)

  const take = (kind, mode) => {
    if (kind === 'water' && meter.waterPaid) return ping('Water already paid')
    if (kind === 'power' && meter.powerPaid) return ping('Power already paid')
    const amount = kind === 'water' ? ch.waterBill : ch.powerBill
    setMeters((all) => all.map((m) => m.stall === meter.stall
      ? { ...m, [kind === 'water' ? 'waterPaid' : 'powerPaid']: true }
      : m))
    setReceipts((r) => [{ or: `eOR-${89200 + Math.floor(Math.random() * 80)}`, date: '2026-10-09', amount, mode, stall: meter.stall, period: `October 2026 ${kind}` }, ...r])
    setCollected((n) => n + amount)
    ping(`${mode} ₱${amount.toLocaleString()} ${kind} for ${meter.stall}`)
  }

  return (
    <div className="field-shell">
      <div className="pos">
        <p className="tiny" style={{ opacity: 0.75 }}>UTILITIES · OCTOBER 2026</p>
        <p>{meter.stall} · {meter.vendor}</p>
        <p className="tiny">Water {meter.waterId}: {ch.waterM3} m³ · Power {meter.powerId}: {ch.powerKwh} kWh</p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn gold" disabled={meter.waterPaid} onClick={() => take('water', 'Cash')}>Water ₱{ch.waterBill.toLocaleString()}</button>
          <button className="btn primary" disabled={meter.powerPaid} onClick={() => take('power', 'Cash')}>Power ₱{ch.powerBill.toLocaleString()}</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Open utility bills</h2>
        {open.map((m) => {
          const c = meterCharges(m)
          return (
            <button key={m.stall} className="btn ghost" style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => setSel(m.stall)}>
              {m.stall} · {m.vendor} · ₱{c.total.toLocaleString()} · {!m.waterPaid ? 'water ' : ''}{!m.powerPaid ? 'power' : ''}
            </button>
          )
        })}
        {!open.length && <p className="muted">All metered bills in this roll are settled.</p>}
      </div>
    </div>
  )
}

export function VendorUtilities() {
  const { meters, setMeters, setReceipts, ping } = useApp()
  const meter = meters.find((m) => m.stall === 'A-04')
  const ch = meterCharges(meter)
  const pay = (kind, mode) => {
    if (kind === 'water' && meter.waterPaid) return ping('Water is already paid for October')
    if (kind === 'power' && meter.powerPaid) return ping('Electricity is already paid for October')
    const amount = kind === 'water' ? ch.waterBill : ch.powerBill
    setMeters((all) => all.map((m) => m.stall === 'A-04' ? { ...m, [kind === 'water' ? 'waterPaid' : 'powerPaid']: true } : m))
    setReceipts((r) => [{ or: `eOR-${89100 + Math.floor(Math.random() * 80)}`, date: '2026-10-09', amount, mode, stall: 'A-04', period: `October 2026 ${kind}` }, ...r])
    ping(`${mode} ₱${amount.toLocaleString()} posted for October ${kind}.`)
  }
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Water · {meter.waterId}</h2>
        <p>{meter.waterPrev} → {meter.waterCurr} m³ · {ch.waterM3} m³ × ₱{WATER_RATE}</p>
        <p className="display" style={{ fontSize: 36 }}>₱{ch.waterBill.toLocaleString()}</p>
        <span className={`badge ${meter.waterPaid ? 'paid' : 'unpaid'}`}>{meter.waterPaid ? 'PAID' : 'UNPAID'}</span>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn gold" disabled={meter.waterPaid} onClick={() => pay('water', 'GCash')}>Pay water</button>
        </div>
      </div>
      <div className="card">
        <h2>Electricity · {meter.powerId}</h2>
        <p>{meter.powerPrev} → {meter.powerCurr} kWh · {ch.powerKwh} kWh × ₱{POWER_RATE}</p>
        <p className="display" style={{ fontSize: 36 }}>₱{ch.powerBill.toLocaleString()}</p>
        <span className={`badge ${meter.powerPaid ? 'paid' : 'unpaid'}`}>{meter.powerPaid ? 'PAID' : 'UNPAID'}</span>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" disabled={meter.powerPaid} onClick={() => pay('power', 'Maya')}>Pay electricity</button>
        </div>
      </div>
    </div>
  )
}
