let allData = null
let selectedIds = []
let searchQuery = ''
let activeProductType = 'panels'
let activeManufacturer = ''
let activeCategory = ''

const domainProductTypes = {
    solar: ['panels', 'inverters'],
    storage: ['batteries'],
    ev: ['chargers'],
    microgrid: ['mg-controllers', 'mg-inverters', 'mg-ats']
}

const typeLabels = {
    panels: 'Solar Panels',
    inverters: 'Inverters',
    batteries: 'Battery Systems',
    chargers: 'EV Chargers',
    'mg-controllers': 'Microgrid Controllers',
    'mg-inverters': 'Microgrid Inverters',
    'mg-ats': 'Transfer Switches'
}

function formatCategoryLabel(str) {
    if (!str || str === 'Other') return 'Other'
    if (str === 'l2-residential') return 'Level 2 Residential'
    if (str === 'l2-commercial') return 'Level 2 Commercial'
    if (str === 'dcfc-standard') return 'DC Fast (Standard)'
    if (str === 'dcfc-high-power') return 'DC Fast (High Power)'
    if (str === 'fleet-depot') return 'Fleet & Depot'
    return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function initComparison(data, domain) {
    allData = data
    selectedIds = []
    searchQuery = ''
    activeManufacturer = ''
    activeCategory = ''
    renderComparison(domain)
}

export function renderComparison(domain) {
    const container = document.getElementById('compareContainer')
    if (!container || !allData) return

    const types = domainProductTypes[domain] || ['panels']
    if (!types.includes(activeProductType)) activeProductType = types[0]

    const products = getProductList(activeProductType)

    // Extract unique manufacturers and categories for dropdowns
    const manufacturers = [...new Set(products.map(p => p.manufacturer).filter(Boolean))].sort()
    const categories = [...new Set(products.map(p => p.category || (activeProductType === 'inverters' ? p.type : 'Other')))].sort()

    const filtered = filterProducts(products)

    let html = `<div class="section-intro">
        <h2>Product Comparison</h2>
        <p>Browse products and select up to 3 to compare side by side. All specifications are from public manufacturer data.</p>
    </div>`

    if (types.length > 1) {
        html += `<div class="compare-type-tabs">${types.map(t =>
            `<button class="compare-type-tab ${activeProductType === t ? 'active' : ''}" data-type="${t}">${typeLabels[t]}</button>`
        ).join('')}</div>`
    }

    html += `<div class="comparison-filters" style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom: 24px; align-items:center;">
        <div class="comparison-search" style="flex:1; min-width:260px; margin-bottom:0;">
            <svg class="comparison-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="compSearch" placeholder="Search by brand, model, or specs..." value="${searchQuery}" style="width:100%; border:1px solid var(--border); border-radius:var(--radius-md); padding:10px 16px 10px 40px; font-family:var(--font-body);" />
        </div>
        <select id="compManufacturer" style="min-width:180px; padding:10px 32px 10px 16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" fill=\\"none\\" stroke=\\"%23475569\\" stroke-width=\\"2\\"><path d=\\"M4 6l4 4 4-4\\"/></svg>'); background-repeat:no-repeat; background-position:right 12px center; cursor:pointer;">
            <option value="">All Manufacturers</option>
            ${manufacturers.map(m => `<option value="${m}" ${activeManufacturer === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <select id="compCategory" style="min-width:180px; padding:10px 32px 10px 16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" fill=\\"none\\" stroke=\\"%23475569\\" stroke-width=\\"2\\"><path d=\\"M4 6l4 4 4-4\\"/></svg>'); background-repeat:no-repeat; background-position:right 12px center; cursor:pointer;">
            <option value="">All Types</option>
            ${categories.map(c => `<option value="${c}" ${activeCategory === c ? 'selected' : ''}>${formatCategoryLabel(c)}</option>`).join('')}
        </select>
    </div>`

    if (selectedIds.length > 0) {
        html += `<div class="compare-selection-bar">
            <span>${selectedIds.length} of 3 selected</span>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="compareNow" ${selectedIds.length < 2 ? 'disabled' : ''}>Compare Selected</button>
                <button class="btn btn-ghost" id="clearSelection">Clear</button>
            </div>
        </div>`
    }

    html += `<div class="charger-search-results">${filtered.map(p => {
        const isSelected = selectedIds.includes(p.id || p.name)
        const displayModel = p.model || p.name || ''
        return `<div class="charger-search-card ${isSelected ? 'selected' : ''}" data-id="${p.id || p.name}">
            <div class="charger-card-mfr">${p.manufacturer}</div>
            <div class="charger-card-model">${displayModel}</div>
            <div class="charger-card-power">${getProductSubline(p, activeProductType)}</div>
            ${p.notes ? `<div style="font-size:12px;color:var(--ink-3);margin-top:8px;line-height:1.4">${truncate(p.notes, 90)}</div>` : ''}
        </div>`
    }).join('')}</div>`

    if (filtered.length === 0) {
        html += '<p class="knowledge-empty" style="text-align:center; padding: 40px 0;">No products match your filters. Try clearing your search or selecting different options.</p>'
    }

    if (selectedIds.length >= 2) html += renderCompareTable(activeProductType)

    container.innerHTML = html

    const si = container.querySelector('#compSearch')
    if (si) {
        si.addEventListener('input', e => { searchQuery = e.target.value; renderComparison(domain) })
        if (searchQuery) { si.focus(); si.setSelectionRange(si.value.length, si.value.length) }
    }

    const mSel = container.querySelector('#compManufacturer')
    if (mSel) mSel.addEventListener('change', e => { activeManufacturer = e.target.value; renderComparison(domain) })

    const cSel = container.querySelector('#compCategory')
    if (cSel) cSel.addEventListener('change', e => { activeCategory = e.target.value; renderComparison(domain) })

    container.querySelectorAll('.charger-search-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id
            if (selectedIds.includes(id)) selectedIds = selectedIds.filter(x => x !== id)
            else if (selectedIds.length < 3) selectedIds.push(id)
            renderComparison(domain)
        })
    })

    container.querySelectorAll('.compare-type-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeProductType = tab.dataset.type;
            selectedIds = [];
            searchQuery = '';
            activeManufacturer = '';
            activeCategory = '';
            renderComparison(domain)
        })
    })

    const cb = container.querySelector('#compareNow')
    if (cb) cb.addEventListener('click', () => { const t = container.querySelector('.compare-table-wrapper'); if (t) t.scrollIntoView({ behavior: 'smooth' }) })
    const cl = container.querySelector('#clearSelection')
    if (cl) cl.addEventListener('click', () => { selectedIds = []; renderComparison(domain) })
}

function getProductList(type) {
    if (type === 'panels') return allData.solar?.panels || []
    if (type === 'inverters') return allData.solar?.inverters || []
    if (type === 'batteries') return allData.bess?.systems || []
    if (type === 'chargers') return allData.ev?.chargers || []
    if (type === 'mg-controllers') return (allData.microgrid?.products || []).filter(p => p.category === 'controllers')
    if (type === 'mg-inverters') return (allData.microgrid?.products || []).filter(p => p.category === 'microgrid-inverters')
    if (type === 'mg-ats') return (allData.microgrid?.products || []).filter(p => p.category === 'ats')
    return []
}

function getProductSubline(p, type) {
    if (type === 'panels') return `${p.power} | ${p.efficiency} eff`
    if (type === 'inverters') return `${p.power} | ${p.type}`
    if (type === 'batteries') return `${p.capacity} | ${p.power}`
    if (type === 'chargers') return `${p.power} | ${p.connector}`
    if (type === 'mg-controllers') return `${p.power_rating} | ${p.islanding}`
    if (type === 'mg-inverters') return `${p.power_rating} | ${p.grid_forming ? 'Grid-Forming' : 'Grid-Following'}`
    if (type === 'mg-ats') return `${p.amperage} | ${p.transfer_time}`
    return ''
}

function filterProducts(products) {
    let result = products

    if (activeManufacturer) {
        result = result.filter(p => p.manufacturer === activeManufacturer)
    }

    if (activeCategory) {
        result = result.filter(p => (p.category || p.type || 'Other') === activeCategory)
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        result = result.filter(p =>
            (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
            (p.model && p.model.toLowerCase().includes(q)) ||
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.power && p.power.toLowerCase().includes(q)) ||
            (p.power_rating && p.power_rating.toLowerCase().includes(q)) ||
            (p.notes && p.notes.toLowerCase().includes(q))
        )
    }

    return result
}

function truncate(str, len) {
    return str.length > len ? str.substring(0, len) + '...' : str
}

function renderCompareTable(type) {
    const products = getProductList(type)
    const sel = selectedIds.map(id => products.find(p => (p.id || p.name) === id)).filter(Boolean)
    if (sel.length < 2) return ''
    const specs = getSpecs(type)
    return `<div style="margin-top:32px">
        <div class="result-section-title">Side-by-Side Comparison</div>
        <div class="compare-table-wrapper"><table class="compare-table">
            <thead><tr><th>Specification</th>${sel.map(p => `<th>${p.manufacturer} ${p.model || p.name}</th>`).join('')}</tr></thead>
            <tbody>${specs.map(s => `<tr><td class="compare-spec-label">${s.label}</td>${sel.map(p => {
        let v = p[s.key]; if (Array.isArray(v)) v = v.join(', '); return `<td>${v || '-'}</td>`
    }).join('')}</tr>`).join('')}</tbody>
        </table></div>
    </div>`
}

function getSpecs(type) {
    if (type === 'panels') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'power', label: 'Power' },
        { key: 'efficiency', label: 'Efficiency' }, { key: 'cellType', label: 'Cell Technology' },
        { key: 'dimensions', label: 'Dimensions' }, { key: 'weight', label: 'Weight' },
        { key: 'tempCoefficient', label: 'Temp Coefficient' }, { key: 'warranty', label: 'Warranty' }, { key: 'notes', label: 'Expert Notes' }
    ]
    if (type === 'inverters') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'type', label: 'Type' },
        { key: 'power', label: 'Power Rating' }, { key: 'efficiency', label: 'Efficiency' },
        { key: 'mpptChannels', label: 'MPPT Channels' }, { key: 'monitoring', label: 'Monitoring' },
        { key: 'warranty', label: 'Warranty' }, { key: 'notes', label: 'Expert Notes' }
    ]
    if (type === 'batteries') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'capacity', label: 'Capacity' },
        { key: 'power', label: 'Power' }, { key: 'chemistry', label: 'Chemistry' }, { key: 'roundTripEfficiency', label: 'Round-Trip Eff.' },
        { key: 'cycleLife', label: 'Cycle Life' }, { key: 'warranty', label: 'Warranty' },
        { key: 'application', label: 'Application' }, { key: 'notes', label: 'Expert Notes' }
    ]
    if (type === 'chargers') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'power', label: 'Power Output' },
        { key: 'amperage', label: 'Amperage' }, { key: 'voltage', label: 'Voltage' }, { key: 'connector', label: 'Connector' },
        { key: 'mounting', label: 'Mounting' }, { key: 'connectivity', label: 'Connectivity' },
        { key: 'operatingTemp', label: 'Operating Temp' }, { key: 'cableLength', label: 'Cable Length' },
        { key: 'warranty', label: 'Warranty' }, { key: 'msrp', label: 'Price (Public)' },
        { key: 'features', label: 'Features' }, { key: 'notes', label: 'Expert Notes' }
    ]
    if (type === 'mg-controllers') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'name', label: 'Product' },
        { key: 'power_rating', label: 'Power Rating' }, { key: 'der_support', label: 'DER Support' },
        { key: 'islanding', label: 'Islanding' }, { key: 'protocols', label: 'Protocols' },
        { key: 'monitoring', label: 'Monitoring' }, { key: 'pros', label: 'Strengths' }, { key: 'cons', label: 'Limitations' }
    ]
    if (type === 'mg-inverters') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'name', label: 'Product' },
        { key: 'power_rating', label: 'Power Rating' }, { key: 'type', label: 'Type' },
        { key: 'grid_forming', label: 'Grid-Forming' }, { key: 'battery_compatible', label: 'Battery Compatibility' },
        { key: 'efficiency', label: 'Efficiency' }, { key: 'pros', label: 'Strengths' }, { key: 'cons', label: 'Limitations' }
    ]
    if (type === 'mg-ats') return [
        { key: 'manufacturer', label: 'Manufacturer' }, { key: 'name', label: 'Product' },
        { key: 'amperage', label: 'Amperage Range' }, { key: 'voltage', label: 'Voltage' },
        { key: 'transfer_time', label: 'Transfer Time' }, { key: 'type', label: 'Type' },
        { key: 'pros', label: 'Strengths' }, { key: 'cons', label: 'Limitations' }
    ]
    return []
}
