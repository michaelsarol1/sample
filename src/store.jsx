import React, { createContext, useContext, useMemo, useState } from 'react'

const AppContext = createContext(null)

const STALLS = [
  { id: 'A-01', zone: 'Wet Market A', type: 'Fish', rate: 4500, status: 'occupied', vendor: 'Rosa Dela Cruz', paid: true },
  { id: 'A-02', zone: 'Wet Market A', type: 'Fish', rate: 4500, status: 'occupied', vendor: 'Jun Santos', paid: false },
  { id: 'A-03', zone: 'Wet Market A', type: 'Meat', rate: 5400, status: 'occupied', vendor: 'Lina Mercado', paid: true },
  { id: 'A-04', zone: 'Wet Market A', type: 'Fish', rate: 4500, status: 'occupied', vendor: 'You', paid: true },
  { id: 'A-05', zone: 'Wet Market A', type: 'Produce', rate: 3600, status: 'vacant', vendor: null, paid: true },
  { id: 'A-06', zone: 'Wet Market A', type: 'Produce', rate: 3600, status: 'occupied', vendor: 'Ben Cruz', paid: false },
  { id: 'A-07', zone: 'Wet Market A', type: 'Meat', rate: 5400, status: 'maintenance', vendor: null, paid: true },
  { id: 'A-08', zone: 'Wet Market A', type: 'Fish', rate: 4500, status: 'occupied', vendor: 'Ana Reyes', paid: true },
  { id: 'B-01', zone: 'Dry Goods B', type: 'Textiles', rate: 6600, status: 'occupied', vendor: 'Mila Tan', paid: true },
  { id: 'B-02', zone: 'Dry Goods B', type: 'Housewares', rate: 6000, status: 'occupied', vendor: 'Carlo Uy', paid: false },
  { id: 'B-03', zone: 'Dry Goods B', type: 'Textiles', rate: 6600, status: 'vacant', vendor: null, paid: true },
  { id: 'B-04', zone: 'Dry Goods B', type: 'Footwear', rate: 6300, status: 'occupied', vendor: 'Ivy Gomez', paid: true },
  { id: 'C-01', zone: 'Food Court C', type: 'Carinderia', rate: 9000, status: 'occupied', vendor: 'Aling Nena', paid: true },
  { id: 'C-02', zone: 'Food Court C', type: 'Carinderia', rate: 9000, status: 'occupied', vendor: 'Kuya Boy', paid: false },
  { id: 'C-03', zone: 'Food Court C', type: 'Drinks', rate: 5400, status: 'occupied', vendor: 'Tess Villanueva', paid: true },
  { id: 'C-04', zone: 'Food Court C', type: 'Snacks', rate: 4800, status: 'vacant', vendor: null, paid: true },
]

const APPLICATIONS = [
  { id: 'APP-1042', name: 'Maricel Bautista', role: 'Vendor', stall: 'A-05', docs: ['Valid ID', 'Barangay Clearance'], status: 'PENDING' },
  { id: 'APP-1043', name: 'Rico Paloma', role: 'Collector', stall: '—', docs: ['Employee ID', 'NBI'], status: 'PENDING' },
  { id: 'APP-1038', name: 'Helen Co', role: 'Vendor', stall: 'B-03', docs: ['Valid ID'], status: 'PENDING' },
]

const LEASES = [
  { id: 'L-221', vendor: 'Rosa Dela Cruz', stall: 'A-01', start: '2026-01-15', end: '2026-12-31', status: 'ACTIVE', arrears: 0 },
  { id: 'L-218', vendor: 'Jun Santos', stall: 'A-02', start: '2025-06-01', end: '2026-10-09', status: 'EXPIRING', arrears: 4500 },
  { id: 'L-190', vendor: 'Carlo Uy', stall: 'B-02', start: '2025-03-01', end: '2026-11-30', status: 'DELINQUENT', arrears: 12000 },
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

const VIOLATIONS = [
  { id: 'VN-041', stall: 'B-02', vendor: 'Carlo Uy', offense: 'Aisle obstruction', ordinance: 'Market Code Art. 12 §4', fine: 1500, due: '2026-10-16', body: 'Merchandise displayed beyond the stall frontage, blocking the 1.5m fire aisle.', status: 'ISSUED', issued: '2026-10-09' },
  { id: 'VN-038', stall: 'A-02', vendor: 'Jun Santos', offense: 'Unpaid utilities', ordinance: 'Market Code Art. 18 §2', fine: 500, due: '2026-10-14', body: 'Water and electricity bills for September remain unpaid after the 5th.', status: 'ISSUED', issued: '2026-10-06' },
  { id: 'VN-029', stall: 'A-04', vendor: 'Rosa Dela Cruz', offense: 'Unsanitary stall', ordinance: 'Market Code Art. 9 §1', fine: 1000, due: '2026-09-20', body: 'Ice melt and fish waste were left in the aisle during the 12 September inspection.', status: 'SETTLED', issued: '2026-09-13' },
]

const RECEIPTS = [
  { or: 'eOR-88421', date: '2026-10-01', amount: 4500, mode: 'GCash', stall: 'A-04', period: 'October 2026' },
  { or: 'eOR-87210', date: '2026-09-01', amount: 4500, mode: 'Maya', stall: 'A-04', period: 'September 2026' },
  { or: 'eOR-86102', date: '2026-08-03', amount: 4500, mode: 'Cash', stall: 'A-04', period: 'August 2026' },
]

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
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

  const ping = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const value = useMemo(() => ({
    session, setSession, toast, ping, apps, setApps, stalls, setStalls,
    leases, setLeases, receipts, setReceipts, tickets, setTickets,
    collected, setCollected, notices, setNotices, meters, setMeters, violations, setViolations,
  }), [session, toast, apps, stalls, leases, receipts, tickets, collected, notices, meters, violations])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
