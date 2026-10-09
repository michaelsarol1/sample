(function () {
  var KEY = 'merkado-stalls'
  var LAT0 = 14.61982
  var LNG0 = 121.05312
  var MLAT = 1 / 111320
  var MLNG = 1 / (111320 * Math.cos(LAT0 * Math.PI / 180))

  var COLORS = {
    vacant: '#22a45a',
    occupied: '#d12b2b',
    reserved: '#e6b422',
    maintenance: '#8a8a8a'
  }

  var ZONES = [
    {
      id: 'wet',
      name: 'Wet Market',
      hint: 'Fish, poultry, pork, beef',
      color: '#1d6ea5',
      bounds: box(38, 4, 38, 42)
    },
    {
      id: 'produce',
      name: 'Produce',
      hint: 'Fruits and vegetables',
      color: '#3d8c4a',
      bounds: box(38, 48, 38, 40)
    },
    {
      id: 'dry',
      name: 'Dry Goods',
      hint: 'Clothes, footwear, household wares',
      color: '#b56a1a',
      bounds: box(4, 4, 30, 42)
    },
    {
      id: 'food',
      name: 'Eatery / Food Court',
      hint: 'Cooked food and refreshment stalls',
      color: '#9b2d4a',
      bounds: box(4, 48, 30, 40)
    }
  ]

  var STALLS = [
    stall('A-01', 'wet', 'Fish', 44, 8, 'occupied', 'Rosa Dela Cruz', '2026-01-15', '2026-12-31', true, 4500, '3m × 2m'),
    stall('A-02', 'wet', 'Fish', 44, 13, 'occupied', 'Jun Santos', '2025-06-01', '2026-12-31', false, 4500, '3m × 2m'),
    stall('A-03', 'wet', 'Pork', 44, 18, 'occupied', 'Lina Mercado', '2026-02-01', '2027-01-31', true, 5400, '3m × 2.5m'),
    stall('A-04', 'wet', 'Fish', 44, 23, 'occupied', 'Rosa Dela Cruz', '2026-01-15', '2026-12-31', true, 4500, '3m × 2m'),
    stall('A-05', 'wet', 'Poultry', 44, 28, 'reserved', 'Maricel Bautista', '—', '—', false, 4800, '3m × 2m'),
    stall('A-06', 'wet', 'Beef', 50, 8, 'occupied', 'Ben Cruz', '2025-11-01', '2026-10-31', false, 5400, '3m × 2.5m'),
    stall('A-07', 'wet', 'Pork', 50, 13, 'maintenance', null, null, null, 5400, '3m × 2.5m'),
    stall('A-08', 'wet', 'Fish', 50, 18, 'occupied', 'Ana Reyes', '2026-03-01', '2027-02-28', true, 4500, '3m × 2m'),
    stall('A-09', 'wet', 'Poultry', 50, 23, 'vacant', null, null, null, 4800, '3m × 2m'),
    stall('A-10', 'wet', 'Beef', 50, 28, 'occupied', 'Tomas Villanueva', '2026-04-01', '2027-03-31', true, 5400, '3m × 2.5m'),
    stall('A-11', 'wet', 'Fish', 56, 8, 'vacant', null, null, null, 4500, '3m × 2m'),
    stall('A-12', 'wet', 'Pork', 56, 13, 'reserved', 'Rico Paloma', '—', '—', false, 5400, '3m × 2.5m'),

    stall('P-01', 'produce', 'Vegetables', 44, 52, 'occupied', 'Aling Nena', '2026-01-10', '2026-12-31', true, 3600, '3m × 2m'),
    stall('P-02', 'produce', 'Fruits', 44, 57, 'occupied', 'Helen Co', '2026-05-01', '2027-04-30', true, 3600, '3m × 2m'),
    stall('P-03', 'produce', 'Vegetables', 44, 62, 'vacant', null, null, null, 3600, '3m × 2m'),
    stall('P-04', 'produce', 'Fruits', 50, 52, 'occupied', 'Boyet Ramos', '2025-09-01', '2026-08-31', false, 3900, '3m × 2m'),
    stall('P-05', 'produce', 'Vegetables', 50, 57, 'reserved', 'Ivy Gomez', '—', '—', false, 3600, '3m × 2m'),
    stall('P-06', 'produce', 'Fruits', 50, 62, 'maintenance', null, null, null, 3600, '3m × 2m'),
    stall('P-07', 'produce', 'Vegetables', 56, 52, 'vacant', null, null, null, 3600, '3m × 2m'),
    stall('P-08', 'produce', 'Fruits', 56, 57, 'occupied', 'Tess Villanueva', '2026-02-14', '2027-02-13', true, 3900, '3m × 2m'),

    stall('B-01', 'dry', 'Clothes', 10, 8, 'occupied', 'Mila Tan', '2026-01-01', '2026-12-31', true, 6600, '3m × 2.5m'),
    stall('B-02', 'dry', 'Housewares', 10, 14, 'occupied', 'Carlo Uy', '2025-03-01', '2026-11-30', false, 6000, '3m × 2.5m'),
    stall('B-03', 'dry', 'Clothes', 10, 20, 'vacant', null, null, null, 6600, '3m × 2.5m'),
    stall('B-04', 'dry', 'Footwear', 10, 26, 'occupied', 'Ivy Gomez', '2026-06-01', '2027-05-31', true, 6300, '3m × 2.5m'),
    stall('B-05', 'dry', 'Housewares', 16, 8, 'reserved', 'Helen Co', '—', '—', false, 6000, '3m × 2.5m'),
    stall('B-06', 'dry', 'Clothes', 16, 14, 'occupied', 'Mina Lopez', '2026-03-15', '2027-03-14', true, 6600, '3m × 2.5m'),
    stall('B-07', 'dry', 'Footwear', 16, 20, 'vacant', null, null, null, 6300, '3m × 2.5m'),
    stall('B-08', 'dry', 'Housewares', 16, 26, 'maintenance', null, null, null, 6000, '3m × 2.5m'),
    stall('B-09', 'dry', 'Clothes', 22, 8, 'occupied', 'Jun Santos', '2026-07-01', '2027-06-30', true, 6600, '3m × 2.5m'),
    stall('B-10', 'dry', 'Footwear', 22, 14, 'vacant', null, null, null, 6300, '3m × 2.5m'),

    stall('C-01', 'food', 'Carinderia', 10, 52, 'occupied', 'Aling Nena', '2026-01-05', '2026-12-31', true, 9000, '4m × 3m'),
    stall('C-02', 'food', 'Carinderia', 10, 58, 'occupied', 'Kuya Boy', '2025-08-01', '2026-12-31', false, 9000, '4m × 3m'),
    stall('C-03', 'food', 'Drinks', 10, 64, 'occupied', 'Tess Villanueva', '2026-04-01', '2027-03-31', true, 5400, '3m × 2m'),
    stall('C-04', 'food', 'Snacks', 10, 70, 'vacant', null, null, null, 4800, '3m × 2m'),
    stall('C-05', 'food', 'Carinderia', 16, 52, 'reserved', 'Rico Paloma', '—', '—', false, 9000, '4m × 3m'),
    stall('C-06', 'food', 'Drinks', 16, 58, 'maintenance', null, null, null, 5400, '3m × 2m'),
    stall('C-07', 'food', 'Snacks', 16, 64, 'occupied', 'Lina Mercado', '2026-02-20', '2027-02-19', true, 4800, '3m × 2m'),
    stall('C-08', 'food', 'Carinderia', 16, 70, 'vacant', null, null, null, 9000, '4m × 3m')
  ]

  function xy(northM, eastM) {
    return [LAT0 + northM * MLAT, LNG0 + eastM * MLNG]
  }

  function box(south, west, height, width) {
    var sw = xy(south, west)
    var ne = xy(south + height, west + width)
    return [sw, ne]
  }

  function stall(id, zone, type, south, west, status, vendor, start, end, paid, rate, size) {
    var w = size.indexOf('4m') === 0 ? 4 : 3
    var h = size.indexOf('3m') > 2 ? 3 : 2
    return {
      id: id, zone: zone, type: type, status: status, vendor: vendor,
      start: start, end: end, paid: paid, rate: rate, size: size,
      bounds: box(south, west, h, w)
    }
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (!saved) return STALLS.slice()
      return STALLS.map(function (s) {
        var patch = saved[s.id]
        return patch ? Object.assign({}, s, patch) : s
      })
    } catch (e) {
      return STALLS.slice()
    }
  }

  function persist(list) {
    var slim = {}
    list.forEach(function (s) {
      slim[s.id] = { status: s.status, vendor: s.vendor, paid: s.paid, start: s.start, end: s.end }
    })
    localStorage.setItem(KEY, JSON.stringify(slim))
  }

  function zoneName(id) {
    var z = ZONES.filter(function (x) { return x.id === id })[0]
    return z ? z.name : id
  }

  function daily(rate) {
    return Math.round(rate / 30)
  }

  function popupHtml(s) {
    var statusLabel = s.status.charAt(0).toUpperCase() + s.status.slice(1)
    var vendorBlock = ''
    if (s.status === 'occupied' && s.vendor) {
      vendorBlock =
        '<p><strong>Vendor:</strong> ' + s.vendor +
        '<br><strong>Contract:</strong> ' + s.start + ' → ' + s.end +
        '<br><strong>Payment status:</strong> ' + (s.paid ? '<span class="badge paid">PAID this month</span>' : '<span class="badge unpaid">UNPAID</span>') +
        '</p>'
    } else if (s.status === 'reserved' && s.vendor) {
      vendorBlock = '<p><strong>On hold for:</strong> ' + s.vendor + '<br>Paperwork or payment is being processed.</p>'
    } else if (s.status === 'vacant') {
      vendorBlock = '<p class="muted">No vendor assigned. Ready to lease.</p>'
    } else {
      vendorBlock = '<p class="muted">Stall is closed for repair and cannot be assigned yet.</p>'
    }
    var assign = s.status === 'vacant'
      ? '<a class="btn gold" href="supervisor-leases.html?stall=' + s.id + '">Assign New Vendor</a>'
      : '<a class="btn ghost" href="supervisor-leases.html?stall=' + s.id + '">View lease</a>'
    return (
      '<div class="stall-popup">' +
      '<p class="tiny" style="letter-spacing:.1em;text-transform:uppercase;margin:0 0 6px">' + zoneName(s.zone) + ' · ' + statusLabel + '</p>' +
      '<h3 style="margin:0 0 8px">Stall ' + s.id + '</h3>' +
      '<p><strong>Trade:</strong> ' + s.type +
      '<br><strong>Dimensions:</strong> ' + s.size +
      '<br><strong>Monthly rent:</strong> ₱' + s.rate.toLocaleString() +
      '<br><strong>Daily rate:</strong> ₱' + daily(s.rate).toLocaleString() + '</p>' +
      vendorBlock +
      '<div class="row" style="margin-top:10px">' +
      assign +
      '<a class="btn clay" href="supervisor-notices.html?stall=' + encodeURIComponent(s.id + ' · ' + (s.vendor || 'Vacant')) + '">Issue Notice</a>' +
      (s.status === 'maintenance'
        ? '<button type="button" class="btn ghost" data-reopen="' + s.id + '">Reopen stall</button>'
        : '<button type="button" class="btn ghost" data-maint="' + s.id + '">Mark for Maintenance</button>') +
      '</div></div>'
    )
  }

  function counts(list) {
    var c = { vacant: 0, occupied: 0, reserved: 0, maintenance: 0 }
    list.forEach(function (s) { c[s.status]++ })
    return c
  }

  function init() {
    var el = document.getElementById('market-map')
    if (!el || typeof L === 'undefined') return
    var stalls = load()
    var layers = {}

    var streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 21,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    })
    var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      attribution: 'Tiles &copy; Esri'
    })
    var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 21,
      pane: 'shadowPane'
    })

    var map = L.map('market-map', {
      center: xy(40, 44),
      zoom: 19,
      minZoom: 17,
      maxZoom: 21,
      layers: [satellite, labels]
    })
    setTimeout(function () {
      map.invalidateSize()
      map.fitBounds(box(0, 0, 82, 94), { padding: [20, 20] })
    }, 250)

    L.control.layers(
      { 'Satellite': satellite, 'Streets': streets },
      { 'Place names': labels },
      { position: 'topright' }
    ).addTo(map)

    var marketOutline = L.rectangle(box(2, 2, 78, 90), {
      color: '#0e3325',
      weight: 2,
      fill: false,
      dashArray: '6 4'
    }).addTo(map)
    marketOutline.bindTooltip('Bayanihan Public Market · Quezon City', { permanent: false })

    var zoneAnchors = {
      wet: xy(73, 24),
      produce: xy(73, 68),
      dry: xy(32, 24),
      food: xy(32, 68)
    }
    ZONES.forEach(function (z) {
      L.rectangle(z.bounds, {
        color: z.color,
        weight: 2,
        fillColor: z.color,
        fillOpacity: 0.14,
        interactive: false
      }).addTo(map)
      L.marker(zoneAnchors[z.id], {
        interactive: false,
        icon: L.divIcon({
          className: 'zone-title',
          html: '<strong>' + z.name + '</strong><span>' + z.hint + '</span>'
        })
      }).addTo(map)
    })

    function paint(s) {
      if (layers[s.id]) map.removeLayer(layers[s.id])
      var rect = L.rectangle(s.bounds, {
        color: '#14241c',
        weight: 1,
        fillColor: COLORS[s.status],
        fillOpacity: 0.82
      }).addTo(map)
      var dark = s.status === 'vacant' || s.status === 'reserved'
      rect.bindTooltip(s.id, {
        permanent: true,
        direction: 'center',
        className: 'stall-label' + (dark ? ' dark' : ''),
        opacity: 1
      })
      rect.bindPopup(popupHtml(s), { maxWidth: 340, className: 'stall-pop' })
      rect.on('popupopen', function () {
        var pop = rect.getPopup().getElement()
        if (!pop) return
        var maint = pop.querySelector('[data-maint]')
        var reopen = pop.querySelector('[data-reopen]')
        if (maint) maint.onclick = function () {
          s.status = 'maintenance'
          s.vendor = null
          persist(stalls)
          paint(s)
          refreshKpis()
          map.closePopup()
        }
        if (reopen) reopen.onclick = function () {
          s.status = 'vacant'
          persist(stalls)
          paint(s)
          refreshKpis()
          map.closePopup()
        }
      })
      layers[s.id] = rect
    }

    function refreshKpis() {
      var c = counts(stalls)
      var occ = document.getElementById('kpi-occ')
      var vac = document.getElementById('kpi-vacant')
      var unp = document.getElementById('kpi-unpaid')
      var total = stalls.length
      if (occ) occ.textContent = Math.round((c.occupied / total) * 100) + '%'
      if (vac) vac.textContent = String(c.vacant)
      if (unp) unp.textContent = String(stalls.filter(function (s) { return s.status === 'occupied' && s.paid === false }).length)
      var nVac = document.getElementById('legend-vacant')
      var nOcc = document.getElementById('legend-occupied')
      var nRes = document.getElementById('legend-reserved')
      var nMnt = document.getElementById('legend-maintenance')
      if (nVac) nVac.textContent = c.vacant
      if (nOcc) nOcc.textContent = c.occupied
      if (nRes) nRes.textContent = c.reserved
      if (nMnt) nMnt.textContent = c.maintenance
    }

    stalls.forEach(paint)
    refreshKpis()
    map.fitBounds(box(0, 0, 82, 94), { padding: [24, 24] })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
