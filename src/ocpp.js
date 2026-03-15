let allProviders = []
let searchQuery = ''
let activeDeployment = ''
let activeFocus = ''
let activeFeature = ''

export function initOCPP(data) {
    allProviders = data.providers || []
    searchQuery = ''
    activeDeployment = ''
    activeFocus = ''
    activeFeature = ''
    renderOCPP()
}

export function renderOCPP() {
    const container = document.getElementById('ocppContainer')
    if (!container) return

    const filtered = filterProviders()

    const deployments = [...new Set(allProviders.map(p => p.deployment))].sort()
    const focuses = [...new Set(allProviders.flatMap(p => p.focus))].sort()

    let html = `<div class="section-intro">
        <h2>OCPP Software Providers</h2>
        <p>Compare EV charging management platforms that support the Open Charge Point Protocol (OCPP). Filter by deployment model, market focus, and capabilities.</p>
    </div>
    <div style="margin-bottom:24px; padding:20px; background:var(--bg-secondary); border-radius:var(--radius-lg); border:1px solid var(--border);">
        <div style="font-weight:600; margin-bottom:8px; font-size:14px;">What is OCPP?</div>
        <p style="font-size:13px; color:var(--ink-3); line-height:1.6; margin:0;">The Open Charge Point Protocol (OCPP) is an open standard for communication between EV charging stations and a central management system. It enables hardware-agnostic management, meaning you can mix charger brands while using a single software platform. OCPP 1.6 is widely deployed; OCPP 2.0.1 adds enhanced security, ISO 15118 Plug & Charge, and V2G support.</p>
    </div>`

    html += `<div class="comparison-filters" style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom: 24px; align-items:center;">
        <div class="comparison-search" style="flex:1; min-width:260px; margin-bottom:0;">
            <svg class="comparison-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="ocppSearch" placeholder="Search by name, features, or notes..." value="${searchQuery}" style="width:100%; border:1px solid var(--border); border-radius:var(--radius-md); padding:10px 16px 10px 40px; font-family:var(--font-body);" />
        </div>
        <select id="ocppDeployment" style="min-width:160px; padding:10px 32px 10px 16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23475569%22 stroke-width=%222%22><path d=%22M4 6l4 4 4-4%22/></svg>'); background-repeat:no-repeat; background-position:right 12px center; cursor:pointer;">
            <option value="">All Deployments</option>
            ${deployments.map(d => `<option value="${d}" ${activeDeployment === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
        <select id="ocppFocus" style="min-width:160px; padding:10px 32px 10px 16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23475569%22 stroke-width=%222%22><path d=%22M4 6l4 4 4-4%22/></svg>'); background-repeat:no-repeat; background-position:right 12px center; cursor:pointer;">
            <option value="">All Focus Areas</option>
            ${focuses.map(f => `<option value="${f}" ${activeFocus === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
    </div>`

    // Quick filter chips
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px;">
        ${chip('White Label', 'whiteLabel')}
        ${chip('Open Source', 'openSource')}
        ${chip('ISO 15118', 'iso15118')}
        ${chip('V2G Support', 'v2g')}
        ${chip('Smart Charging', 'smartCharging')}
    </div>`

    if (filtered.length === 0) {
        html += '<p class="knowledge-empty" style="text-align:center; padding: 40px 0;">No providers match your filters. Try clearing your search or selecting different options.</p>'
    } else {
        html += `<div class="ocpp-grid">${filtered.map(p => renderCard(p)).join('')}</div>`
    }

    container.innerHTML = html

    // Bind events
    const si = container.querySelector('#ocppSearch')
    if (si) {
        si.addEventListener('input', e => { searchQuery = e.target.value; renderOCPP() })
        if (searchQuery) { si.focus(); si.setSelectionRange(si.value.length, si.value.length) }
    }

    const ds = container.querySelector('#ocppDeployment')
    if (ds) ds.addEventListener('change', e => { activeDeployment = e.target.value; renderOCPP() })

    const fs = container.querySelector('#ocppFocus')
    if (fs) fs.addEventListener('change', e => { activeFocus = e.target.value; renderOCPP() })

    container.querySelectorAll('.ocpp-chip').forEach(c => {
        c.addEventListener('click', () => {
            activeFeature = activeFeature === c.dataset.feature ? '' : c.dataset.feature
            renderOCPP()
        })
    })

    container.querySelectorAll('.ocpp-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.tagName === 'A') return
            card.classList.toggle('expanded')
        })
    })
}

function chip(label, feature) {
    const isActive = activeFeature === feature
    return `<button class="ocpp-chip ${isActive ? 'active' : ''}" data-feature="${feature}" style="
        padding:6px 14px; border-radius:20px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.15s;
        border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
        background:${isActive ? 'var(--accent)' : 'var(--bg-white)'};
        color:${isActive ? '#fff' : 'var(--ink-2)'};
    ">${label}</button>`
}

function renderCard(p) {
    const badges = []
    if (p.whiteLabel) badges.push('<span class="ocpp-badge wl">White Label</span>')
    if (p.openSource) badges.push('<span class="ocpp-badge os">Open Source</span>')
    if (p.iso15118) badges.push('<span class="ocpp-badge iso">ISO 15118</span>')
    if (p.v2g) badges.push('<span class="ocpp-badge v2g">V2G</span>')

    return `<div class="ocpp-card" style="
        background:var(--bg-white); border:1px solid var(--border); border-radius:var(--radius-lg);
        padding:20px; cursor:pointer; transition:all 0.2s;
    ">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
                <div style="font-weight:700; font-size:15px; color:var(--ink-1);">${p.name}</div>
                <div style="font-size:12px; color:var(--ink-3); margin-top:2px;">${p.hq} · Founded ${p.founded}</div>
            </div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end;">
                ${p.ocppVersions.map(v => `<span style="font-size:10px; padding:2px 6px; border-radius:4px; background:var(--bg-secondary); color:var(--ink-2); font-weight:500;">OCPP ${v}</span>`).join('')}
            </div>
        </div>
        <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:10px;">${badges.join('')}</div>
        <div style="font-size:12px; color:var(--ink-3); margin-bottom:10px;">
            <strong>Focus:</strong> ${p.focus.join(', ')} · <strong>Deployment:</strong> ${p.deployment} · <strong>Pricing:</strong> ${p.pricing}
        </div>
        <div style="font-size:13px; color:var(--ink-2); line-height:1.5;">${p.notes}</div>
        <div class="ocpp-card-details" style="display:none; margin-top:14px; padding-top:14px; border-top:1px solid var(--border);">
            <div style="font-size:12px; color:var(--ink-3); margin-bottom:8px;"><strong>Features:</strong> ${p.features.join(' · ')}</div>
            <div style="font-size:12px; color:var(--ink-3); margin-bottom:8px;"><strong>Integrations:</strong> ${p.integrations.join(' · ')}</div>
            ${p.website ? `<a href="${p.website}" target="_blank" rel="noopener" style="font-size:12px; color:var(--accent); text-decoration:none; font-weight:500;">Visit website →</a>` : ''}
        </div>
    </div>`
}

function filterProviders() {
    let result = allProviders

    if (activeDeployment) {
        result = result.filter(p => p.deployment === activeDeployment)
    }

    if (activeFocus) {
        result = result.filter(p => p.focus.includes(activeFocus))
    }

    if (activeFeature) {
        result = result.filter(p => p[activeFeature] === true)
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        result = result.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.notes.toLowerCase().includes(q) ||
            p.features.some(f => f.toLowerCase().includes(q)) ||
            p.focus.some(f => f.toLowerCase().includes(q)) ||
            p.hq.toLowerCase().includes(q)
        )
    }

    return result
}
