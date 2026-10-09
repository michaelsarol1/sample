import React, { createContext, useContext, useMemo, useState } from 'react'

const AppContext = createContext(null)

export const PENALTY_RATE_PER_DAY = 0.02

const STALLS = [
  { id: 'A-01', zone: 'Wet Market A', type: 'Fish', rate: 4500, sqm: 10, ratePerSqm: 450, status: 'occupied', vendor: 'Rosa Dela Cruz', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'A-02', zone: 'Wet Market A', type: 'Fish', rate: 4500, sqm: 10, ratePerSqm: 450, status: 'vacant', vendor: null, paid: true, reservedBy: null, reservedUntil: null },
  { id: 'A-03', zone: 'Wet Market A', type: 'Meat', rate: 5400, sqm: 12, ratePerSqm: 450, status: 'occupied', vendor: 'Lina Mercado', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'A-04', zone: 'Wet Market A', type: 'Fish', rate: 4500, sqm: 10, ratePerSqm: 450, status: 'occupied', vendor: 'You', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'A-05', zone: 'Wet Market A', type: 'Produce', rate: 3600, sqm: 8, ratePerSqm: 450, status: 'reserved', vendor: null, paid: true, reservedBy: 'Maricel Bautista (APP-1042)', reservedUntil: '2026-10-15' },
  { id: 'A-06', zone: 'Wet Market A', type: 'Produce', rate: 3600, sqm: 8, ratePerSqm: 450, status: 'vacant', vendor: null, paid: true, reservedBy: null, reservedUntil: null },
  { id: 'A-07', zone: 'Wet Market A', type: 'Meat', rate: 5400, sqm: 12, ratePerSqm: 450, status: 'maintenance', vendor: null, paid: true, reservedBy: null, reservedUntil: null },
  { id: 'A-08', zone: 'Wet Market A', type: 'Fish', rate: 4500, sqm: 10, ratePerSqm: 450, status: 'occupied', vendor: 'Ana Reyes', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'B-01', zone: 'Dry Goods B', type: 'Textiles', rate: 6600, sqm: 11, ratePerSqm: 600, status: 'occupied', vendor: 'Mila Tan', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'B-02', zone: 'Dry Goods B', type: 'Housewares', rate: 6000, sqm: 10, ratePerSqm: 600, status: 'vacant', vendor: null, paid: true, reservedBy: null, reservedUntil: null },
  { id: 'B-03', zone: 'Dry Goods B', type: 'Textiles', rate: 6600, sqm: 11, ratePerSqm: 600, status: 'reserved', vendor: null, paid: true, reservedBy: 'Helen Co (APP-1038)', reservedUntil: '2026-10-18' },
  { id: 'B-04', zone: 'Dry Goods B', type: 'Footwear', rate: 6300, sqm: 10.5, ratePerSqm: 600, status: 'occupied', vendor: 'Ivy Gomez', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'C-01', zone: 'Food Court C', type: 'Carinderia', rate: 9000, sqm: 15, ratePerSqm: 600, status: 'occupied', vendor: 'Aling Nena', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'C-02', zone: 'Food Court C', type: 'Carinderia', rate: 9000, sqm: 15, ratePerSqm: 600, status: 'vacant', vendor: null, paid: true, reservedBy: null, reservedUntil: null },
  { id: 'C-03', zone: 'Food Court C', type: 'Drinks', rate: 5400, sqm: 9, ratePerSqm: 600, status: 'occupied', vendor: 'Tess Villanueva', paid: true, reservedBy: null, reservedUntil: null },
  { id: 'C-04', zone: 'Food Court C', type: 'Snacks', rate: 4800, sqm: 8, ratePerSqm: 600, status: 'vacant', vendor: null, paid: true, reservedBy: null, reservedUntil: null },
]

const APPLICATIONS = [
  { id: 'APP-1042', name: 'Maricel Bautista', role: 'Vendor', stall: null, docs: ['Valid ID', 'Barangay Clearance'], status: 'PENDING', needsStallSelection: false },
  { id: 'APP-1043', name: 'Rico Paloma', role: 'Collector', stall: '-', docs: ['Employee ID', 'NBI'], status: 'PENDING', needsStallSelection: false },
  { id: 'APP-1038', name: 'Helen Co', role: 'Vendor', stall: null, docs: ['Valid ID'], status: 'PENDING', needsStallSelection: false },
]

const LEASES = [
  { id: 'L-221', vendor: 'Rosa Dela Cruz', stall: 'A-01', start: '2026-01-15', end: '2026-12-31', terms: 'Standard 12-month lease, 2-month security deposit, monthly due on or before 5th', securityDeposit: 9000, monthlyRate: 4500, sqm: 10, ratePerSqm: 450, status: 'ACTIVE', arrears: 0 },
  { id: 'L-218', vendor: 'Jun Santos', stall: 'A-02', start: '2025-06-01', end: '2026-10-09', terms: '12-month lease renewal pending. Security deposit held against arrears.', securityDeposit: 9000, monthlyRate: 4500, sqm: 10, ratePerSqm: 450, status: 'EXPIRING', arrears: 4500 },
  { id: 'L-190', vendor: 'Carlo Uy', stall: 'B-02', start: '2025-03-01', end: '2026-11-30', terms: 'Standard 12-month lease. Arrears subject to 2% daily penalty under Art. 18.', securityDeposit: 12000, monthlyRate: 6000, sqm: 10, ratePerSqm: 600, status: 'DELINQUENT', arrears: 12000 },
]

export const WATER_RATE = 45
export const POWER_RATE = 12.5

const METERS = [
  { stall: 'A-01', vendor: 'Rosa Dela Cruz', waterId: 'W-A01', powerId: 'E-A01', waterPrev: 210.2, waterCurr: 224.8, powerPrev: 3310, powerCurr: 3482, waterPaid: true, powerPaid: true },
  { stall: 'A-02', vendor: 'Jun Santos', waterId: 'W-A02', powerId: 'E-A02', waterPrev: 188.0, waterCurr: 206.4, powerPrev: 2901, powerCurr: 3120, waterPaid: false, powerPaid: false },
  { stall: 'A-04', vendor: 'Rosa Dela Cruz', waterId: 'W-A04', powerId: 'E-A04', waterPrev: 128.4, waterCurr: 141.2, powerPrev: 4520, powerCurr: 4688, waterPaid: false, powerPaid: true },
  { stall: 'A-06', vendor: 'Ben Cruz', waterId: 'W-A06', powerId: 'E-A06', waterPrev: 96.1, waterCurr: 108.0, powerPrev: 2104, powerCurr: 2210, waterPaid: false, powerPaid: false },
  { stall: 'B-02', vendor: 'Carlo Uy', waterId: 'W-B02', powerId: 'E-B02', waterPrev: 70.0, waterCurr: 81.5, powerPrev: 1800, powerCurr: 2014, waterPaid: false, powerPaid: false },
  { stall: 'C-01', vendor: 'Aling Nena', waterId: 'W-C01', powerId: 'E-C01', waterPrev: 340.0, waterCurr: 392.6, powerPrev: 6100, powerCurr: 6488, waterPaid: true, powerPaid: false },
]

export function meterCharges(m) {
  const waterM3 = Math.max(0, +(m.waterCurr - m.waterPrev).toFixed(1))
  const powerKwh = Math.max(0, +(m.powerCurr - m.powerPrev).toFixed(1))
  const waterBill = Math.round(waterM3 * WATER_RATE)
  const powerBill = Math.round(powerKwh * POWER_RATE)
  return { waterM3, powerKwh, waterBill, powerBill, total: waterBill + powerBill }
}

export function calculateMonthlyBill(stall, meter) {
  const rent = stall.rate || 0
  const mc = meter ? meterCharges(meter) : { waterBill: 0, powerBill: 0 }
  return {
    rent,
    water: mc.waterBill,
    power: mc.powerBill,
    subtotal: rent + mc.waterBill + mc.powerBill,
    penalty: 0,
    total: rent + mc.waterBill + mc.powerBill,
  }
}

const LEDGER_ENTRIES = [
  { id: 'LED-001', stall: 'A-04', vendor: 'You', date: '2026-10-01', type: 'Monthly Rent', period: 'October 2026', debit: 0, credit: 4500, balance: 0, or: 'eOR-88421', mode: 'GCash' },
  { id: 'LED-002', stall: 'A-04', vendor: 'You', date: '2026-10-05', type: 'Water Bill', period: 'October 2026', debit: 576, credit: 0, balance: 576, or: null, mode: null },
  { id: 'LED-003', stall: 'A-02', vendor: 'Jun Santos', date: '2026-10-01', type: 'Monthly Rent', period: 'October 2026', debit: 4500, credit: 0, balance: 4500, or: null, mode: null },
  { id: 'LED-004', stall: 'A-02', vendor: 'Jun Santos', date: '2026-10-06', type: 'Penalty (1 day @ 2%)', period: 'October 2026', debit: 90, credit: 0, balance: 4590, or: null, mode: null },
  { id: 'LED-005', stall: 'B-02', vendor: 'Carlo Uy', date: '2026-09-01', type: 'Monthly Rent', period: 'September 2026', debit: 6000, credit: 0, balance: 6000, or: null, mode: null },
  { id: 'LED-006', stall: 'B-02', vendor: 'Carlo Uy', date: '2026-10-01', type: 'Monthly Rent', period: 'October 2026', debit: 6000, credit: 0, balance: 12000, or: null, mode: null },
]

const NOTIFICATIONS = [
  { id: 'NOT-001', stall: 'A-04', vendor: 'You', type: 'Payment Confirmation', channel: 'SMS', message: 'Your October 2026 rent of P4,500 via GCash has been posted. OR# eOR-88421. Thank you!', sent: '2026-10-01 09:15', read: true },
  { id: 'NOT-002', stall: 'A-04', vendor: 'You', type: 'Due Date Alert', channel: 'Email', message: 'Reminder: Water bill (P576) for October 2026 is due on Oct 15. Pay on time to avoid penalties.', sent: '2026-10-08 08:00', read: false },
  { id: 'NOT-003', stall: 'A-02', vendor: 'Jun Santos', type: 'Delinquency Notice', channel: 'SMS', message: 'Your October rent is overdue. Balance: P4,590 (incl. 1-day penalty). Pay within 3 days to avoid lockout.', sent: '2026-10-07 10:00', read: false },
  { id: 'NOT-004', stall: 'B-02', vendor: 'Carlo Uy', type: 'Violation Notice', channel: 'Email', message: 'VN-041 issued: Aisle obstruction. Fine P1,500 due Oct 16. See notice for details.', sent: '2026-10-09 14:30', read: false },
  { id: 'NOT-005', stall: 'A-04', vendor: 'You', type: 'Lease Renewal', channel: 'Email', message: 'Your lease L-204 expires in 83 days (Dec 31, 2026). Visit Contract Vault to submit renewal intent.', sent: '2026-10-09 00:00', read: false },
]

const VIOLATIONS = [
  { id: 'VN-041', stall: 'B-02', vendor: 'Carlo Uy', offense: 'Aisle obstruction', ordinance: 'Market Code Art. 12 \u00a74', fine: 1500, due: '2026-10-16', body: 'Merchandise displayed beyond the stall frontage, blocking the 1.5m fire aisle.', status: 'ISSUED', issued: '2026-10-09' },
  { id: 'VN-038', stall: 'A-02', vendor: 'Jun Santos', offense: 'Unpaid utilities', ordinance: 'Market Code Art. 18 \u00a72', fine: 500, due: '2026-10-14', body: 'Water and electricity bills for September remain unpaid after the 5th.', status: 'ISSUED', issued: '2026-10-06' },
  { id: 'VN-029', stall: 'A-04', vendor: 'Rosa Dela Cruz', offense: 'Unsanitary stall', ordinance: 'Market Code Art. 9 \u00a71', fine: 1000, due: '2026-09-20', body: 'Ice melt and fish waste were left in the aisle during the 12 September inspection.', status: 'SETTLED', issued: '2026-09-13' },
]

const RECEIPTS = [
  { or: 'eOR-88421', date: '2026-10-01', amount: 4500, mode: 'GCash', stall: 'A-04', period: 'October 2026', type: 'Monthly Rent' },
  { or: 'eOR-87210', date: '2026-09-01', amount: 4500, mode: 'Maya', stall: 'A-04', period: 'September 2026', type: 'Monthly Rent' },
  { or: 'eOR-86102', date: '2026-08-03', amount: 4500, mode: 'Cash', stall: 'A-04', period: 'August 2026', type: 'Monthly Rent' },
]

export const PAYMENT_MODES = [
  { id: 'Bank', label: 'Bank Transfer', hint: 'BDO, BPI, Landbank, PNB' },
  { id: 'GCash', label: 'GCash', hint: 'Scan-to-pay via e-wallet' },
  { id: 'Maya', label: 'Maya', hint: 'Scan-to-pay via Maya wallet' },
  { id: 'Cash', label: 'Collector Cash', hint: 'Field collector POS in the aisle' },
]

export function AppProvider({ children }) {
  const [session, setSession] = useState({ name: 'Atty. Elena Ramos', role: 'Supervisor' })
  const [toast, setToast] = useState('')
  const [apps, setApps] = useState(APPLICATIONS)
  const [stalls, setStalls] = useState(STALLS)
  const [leases, setLeases] = useState(LEASES)
  const [receipts, setReceipts] = useState(RECEIPTS)
  const [tickets, setTickets] = useState([
    { id: 'TK-12', issue: 'Leaking faucet', stall: 'A-04', status: 'Open' },
  ])
  const [collected, setCollected] = useState(18000)
  const [notices, setNotices] = useState([
    { id: 'N-77', stall: 'A-02', vendor: 'Jun Santos', type: 'Delinquency', days: 3 },
    { id: 'N-78', stall: 'B-02', vendor: 'Carlo Uy', type: 'Violation', days: 5 },
  ])
  const [meters, setMeters] = useState(METERS)
  const [violations, setViolations] = useState(VIOLATIONS)
  const [ledger, setLedger] = useState(LEDGER_ENTRIES)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)

  const ping = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const addLedgerEntry = (entry) => {
    setLedger((l) => [{ id: `LED-${String(l.length + 1).padStart(3, '0')}`, ...entry, date: entry.date || '2026-10-09' }, ...l])
  }

  const addNotification = (notif) => {
    setNotifications((n) => [{ id: `NOT-${String(n.length + 1).padStart(3, '0')}`, sent: '2026-10-09 ' + new Date().toTimeString().slice(0, 5), read: false, ...notif }, ...n])
  }

  const value = useMemo(() => ({
    session, setSession, toast, ping, apps, setApps, stalls, setStalls,
    leases, setLeases, receipts, setReceipts, tickets, setTickets,
    collected, setCollected, notices, setNotices, meters, setMeters, violations, setViolations,
    ledger, setLedger, addLedgerEntry,
    notifications, setNotifications, addNotification,
  }), [session, toast, apps, stalls, leases, receipts, tickets, collected, notices, meters, violations, ledger, notifications])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
