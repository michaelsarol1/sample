(function () {
  var KEY = 'merkado-notices'
  var VIEW = 'merkado-view-stall'
  var SEEN = 'merkado-seen-notices'

  var OFFENSES = {
    'Aisle obstruction': { ordinance: 'Market Code Art. 12 §4', fine: 1500, body: 'Merchandise or equipment extends beyond stall frontage and blocks the required fire aisle.' },
    'Unsanitary stall': { ordinance: 'Market Code Art. 9 §1', fine: 1000, body: 'Stall failed sanitation inspection. Waste, wastewater, or spoilage was found on the premises.' },
    'Illegal subletting': { ordinance: 'Market Code Art. 7 §3', fine: 5000, body: 'Stall occupancy was transferred or sublet without written approval of the Market Supervisor.' },
    'Unpaid monthly rent': { ordinance: 'Market Code Art. 18 §1', fine: 1000, body: 'Monthly stall rental remains unpaid after the 5th of the billing month.' },
    'Unpaid utilities': { ordinance: 'Market Code Art. 18 §2', fine: 500, body: 'Water and/or electricity bills remain unpaid after the due date.' },
    'Meter tampering': { ordinance: 'Market Code Art. 18 §5', fine: 5000, body: 'Water or electric meter was found altered, bypassed, or with a broken seal.' },
    'Unauthorized cooking': { ordinance: 'Market Code Art. 14 §2', fine: 2000, body: 'Cooking or open flame was used outside a designated food-court stall.' },
    'After-hours operation': { ordinance: 'Market Code Art. 6 §2', fine: 800, body: 'Stall remained open after posted market hours without a night-market permit.' }
  }

  var SEED = [
    { id: 'VN-041', stall: 'B-02', vendor: 'Carlo Uy', offense: 'Aisle obstruction', ordinance: 'Market Code Art. 12 §4', fine: 1500, due: '2026-10-16', body: 'Merchandise displayed beyond the stall frontage, blocking the 1.5m fire aisle.', status: 'ISSUED', issued: '2026-10-09' },
    { id: 'VN-038', stall: 'A-02', vendor: 'Jun Santos', offense: 'Unpaid utilities', ordinance: 'Market Code Art. 18 §2', fine: 500, due: '2026-10-14', body: 'Water and electricity bills for September remain unpaid after the 5th.', status: 'ISSUED', issued: '2026-10-06' },
    { id: 'VN-029', stall: 'A-04', vendor: 'Rosa Dela Cruz', offense: 'Unsanitary stall', ordinance: 'Market Code Art. 9 §1', fine: 1000, due: '2026-09-20', body: 'Ice melt and fish waste were left in the aisle during the 12 September inspection.', status: 'SETTLED', issued: '2026-09-13' }
  ]

  function load() {
    try {
      var raw = localStorage.getItem(KEY)
      if (!raw) {
        localStorage.setItem(KEY, JSON.stringify(SEED))
        return SEED.slice()
      }
      return JSON.parse(raw)
    } catch (e) {
      return SEED.slice()
    }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list))
  }

  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN) || '[]') } catch (e) { return [] }
  }

  function markSeen(id) {
    var s = seen()
    if (s.indexOf(id) === -1) {
      s.push(id)
      localStorage.setItem(SEEN, JSON.stringify(s))
    }
  }

  function money(n) {
    return Number(n).toLocaleString()
  }

  function sheetHtml(n) {
    var badge = n.status === 'SETTLED' ? 'paid' : n.status === 'DRAFT' ? 'pending' : 'delinquent'
    return (
      '<p class="tiny" style="letter-spacing:.12em;text-transform:uppercase;text-align:center">Republic of the Philippines · Quezon City</p>' +
      '<h2 style="text-align:center;margin-bottom:4px">Bayanihan Public Market</h2>' +
      '<p style="text-align:center;margin-top:0"><strong>Notice of Violation and Penalty</strong></p>' +
      '<p class="row space"><span>No. ' + n.id + '</span><span>Date issued: ' + n.issued + '</span></p>' +
      '<hr />' +
      '<p><strong>Vendor:</strong> ' + n.vendor + '<br /><strong>Stall:</strong> ' + n.stall +
      '<br /><strong>Offense:</strong> ' + n.offense + '<br /><strong>Ordinance:</strong> ' + n.ordinance + '</p>' +
      '<p><strong>Particulars:</strong><br />' + n.body + '</p>' +
      '<p><strong>Penalty:</strong> ₱' + money(n.fine) + '.00 &nbsp; <strong>Pay on or before:</strong> ' + n.due + '</p>' +
      '<p class="tiny muted">Failure to settle may result in stall lockout, deduction from security deposit, and lease termination under Art. 18.</p>' +
      '<p style="margin-top:28px">_________________________<br /><span class="tiny">Market Supervisor</span></p>' +
      '<span class="badge ' + badge + '">' + n.status + '</span>'
    )
  }

  function parseVendor(value) {
    var parts = (value || '').split(' · ')
    return { stall: parts[0], vendor: parts.slice(1).join(' · ') }
  }

  function ensureModal() {
    if (document.getElementById('notice-modal')) return
    var wrap = document.createElement('div')
    wrap.id = 'notice-modal'
    wrap.className = 'modal-back'
    wrap.hidden = true
    wrap.innerHTML =
      '<div class="modal card notice-sheet" role="dialog" aria-label="Violation notice">' +
      '<p class="tiny" style="letter-spacing:.12em;text-transform:uppercase">New notice delivered to this stall</p>' +
      '<div id="notice-modal-body"></div>' +
      '<div class="row" style="margin-top:16px">' +
      '<a class="btn" id="notice-modal-open" href="vendor-notices.html">Open in notices</a>' +
      '<button class="btn ghost" type="button" id="notice-modal-close">I understand</button>' +
      '</div></div>'
    document.body.appendChild(wrap)
    document.getElementById('notice-modal-close').onclick = function () {
      var id = wrap.getAttribute('data-id')
      if (id) markSeen(id)
      wrap.hidden = true
    }
  }

  function showPopup(n) {
    ensureModal()
    var wrap = document.getElementById('notice-modal')
    document.getElementById('notice-modal-body').innerHTML = sheetHtml(n)
    wrap.setAttribute('data-id', n.id)
    wrap.hidden = false
  }

  function currentStall() {
    var q = new URLSearchParams(location.search).get('stall')
    if (q) {
      localStorage.setItem(VIEW, q)
      return q
    }
    return localStorage.getItem(VIEW) || 'A-04'
  }

  function forStall(stall) {
    return load().filter(function (n) { return n.stall === stall })
  }

  function newestIssued(stall) {
    var s = seen()
    return forStall(stall).filter(function (n) {
      return n.status === 'ISSUED' && s.indexOf(n.id) === -1
    })[0]
  }

  function renderSupervisor() {
    var form = document.getElementById('issue-form')
    if (!form) return
    var list = load()
    var open = list.filter(function (n) { return n.status === 'ISSUED' })
    var settled = list.filter(function (n) { return n.status === 'SETTLED' })
    var fine = open.reduce(function (a, n) { return a + Number(n.fine) }, 0)
    var k0 = document.getElementById('kpi-open')
    var k1 = document.getElementById('kpi-fines')
    var k2 = document.getElementById('kpi-settled')
    if (k0) k0.textContent = String(open.length)
    if (k1) k1.textContent = '₱' + money(fine)
    if (k2) k2.textContent = String(settled.length)

    var box = document.getElementById('issued-list')
    if (box) {
      box.innerHTML = list.map(function (n) {
        return '<button type="button" class="btn ghost full notice-pick" data-id="' + n.id + '">' +
          n.id + ' · ' + n.stall + ' · ' + n.offense + ' · ₱' + money(n.fine) + ' · ' + n.status + '</button>'
      }).join('')
      box.querySelectorAll('.notice-pick').forEach(function (btn) {
        btn.onclick = function () {
          var n = list.find(function (x) { return x.id === btn.getAttribute('data-id') })
          if (n) document.getElementById('preview-sheet').innerHTML = sheetHtml(n)
        }
      })
    }

    var offense = document.getElementById('offense')
    var facts = document.getElementById('facts')
    var fineInput = document.getElementById('fine')
    var hint = document.getElementById('offense-hint')
    if (offense) {
      offense.onchange = function () {
        var o = OFFENSES[offense.value]
        if (!o) return
        facts.value = o.body
        fineInput.value = o.fine
        hint.textContent = o.ordinance + ' · Standard fine ₱' + money(o.fine)
      }
    }

    form.onsubmit = function (e) {
      e.preventDefault()
      var who = parseVendor(document.getElementById('stall-vendor').value)
      var o = OFFENSES[offense.value] || OFFENSES['Aisle obstruction']
      var next = load()
      var id = 'VN-' + (40 + next.length)
      var notice = {
        id: id,
        stall: who.stall,
        vendor: who.vendor,
        offense: offense.value,
        ordinance: o.ordinance,
        fine: Number(fineInput.value || o.fine),
        due: document.getElementById('due').value,
        body: facts.value,
        status: 'ISSUED',
        issued: new Date().toISOString().slice(0, 10)
      }
      next.unshift(notice)
      save(next)
      localStorage.setItem(VIEW, notice.stall)
      var s = seen().filter(function (x) { return x !== notice.id })
      localStorage.setItem(SEEN, JSON.stringify(s))
      location.href = 'vendor-notices.html?stall=' + encodeURIComponent(notice.stall) + '&popup=' + encodeURIComponent(notice.id)
    }
  }

  function renderVendorNotices() {
    var listEl = document.getElementById('vendor-notice-list')
    var sheet = document.getElementById('vendor-notice-sheet')
    if (!listEl || !sheet) return
    var stall = currentStall()
    var mine = forStall(stall)
    var name = (mine[0] && mine[0].vendor) || (stall === 'A-04' ? 'Rosa Dela Cruz' : stall)
    var sub = document.getElementById('vendor-name')
    if (sub) sub.textContent = name + ' · Stall ' + stall
    if (!mine.length) {
      listEl.innerHTML = '<p class="muted">No penalty notices on stall ' + stall + '.</p>'
      sheet.innerHTML = '<p class="muted">You are in good standing.</p>'
      return
    }
    listEl.innerHTML = mine.map(function (n) {
      return '<button type="button" class="btn ghost full notice-pick" data-id="' + n.id + '">' +
        n.id + ' · ' + n.offense + ' · ₱' + money(n.fine) + ' · ' + n.status + '</button>'
    }).join('') + '<p class="tiny muted">Pay open fines at the collector POS or via GCash before the due date to avoid lockout.</p>'
    function show(id) {
      var n = mine.find(function (x) { return x.id === id }) || mine[0]
      sheet.innerHTML = sheetHtml(n)
    }
    show(mine[0].id)
    listEl.querySelectorAll('.notice-pick').forEach(function (btn) {
      btn.onclick = function () { show(btn.getAttribute('data-id')) }
    })
    var q = new URLSearchParams(location.search).get('popup')
    var pop = (q && mine.find(function (n) { return n.id === q })) || newestIssued(stall)
    if (pop) showPopup(pop)
  }

  function renderVendorPopup() {
    if (document.getElementById('vendor-notice-list')) return
    if (!/vendor/.test(location.pathname + location.href)) return
    var stall = currentStall()
    var n = newestIssued(stall)
    if (n) showPopup(n)
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderSupervisor()
    renderVendorNotices()
    renderVendorPopup()
  })
})()
