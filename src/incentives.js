let incentiveData = null
let currentSettings = { country: 'US', currency: 'USD', location: '' }
let filterCountry = ''
let filterState = ''
let filterType = ''

export function initIncentives(data, domain, settings) {
  incentiveData = data
  filterCountry = ''
  filterState = ''
  filterType = ''
  if (settings) currentSettings = settings
  renderIncentives(domain, settings)
}

export function renderIncentives(domain, settings) {
  const container = document.getElementById('incentivesContainer')
  if (!container || !incentiveData) return
  if (settings) {
    currentSettings = settings
    // Auto-sync filter with settings bar country toggle
    if (settings.country === 'CA' && filterCountry !== 'CA') {
      filterCountry = 'CA'
      filterState = settings.location || ''
    } else if (settings.country === 'US' && filterCountry === 'CA') {
      filterCountry = 'US'
      filterState = settings.location || ''
    }
  }

  // Start from all programs that match this domain
  const programs = incentiveData.programs.filter(p => p.applies.includes(domain))

  // Derive filter options BEFORE applying filters (so dropdowns always show all possible options)
  const countries = [...new Set(programs.map(p => p.country))].sort()

  // If country selected, narrow for state extraction
  let countryFiltered = programs
  if (filterCountry) {
    countryFiltered = programs.filter(p => p.country === filterCountry)
  }

  // Get states/provinces for the selected country (or all if none selected)
  const statesRaw = [...new Set(countryFiltered.filter(p => p.state).map(p => p.state))].sort()

  // Get incentive types from the domain-filtered set
  const types = [...new Set(programs.map(p => p.type))].sort()

  // Now apply all filters for the result set
  let filtered = programs
  if (filterCountry) {
    filtered = filtered.filter(p => p.country === filterCountry)
  }
  if (filterState) {
    // Show federal (state === null) + matching state
    filtered = filtered.filter(p => p.state === null || p.state === filterState)
  }
  if (filterType) {
    filtered = filtered.filter(p => p.type === filterType)
  }

  // Count summary
  const federalCount = filtered.filter(p => p.state === null).length
  const localCount = filtered.filter(p => p.state !== null).length

  const selectStyle = `min-width:150px; padding:9px 32px 9px 14px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); font-size:13px; color:var(--ink); appearance:none; -webkit-appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="%23475569" stroke-width="2"><path d="M4 6l3 3 3-3"/></svg>'); background-repeat:no-repeat; background-position:right 10px center; cursor:pointer;`

  let html = `<div class="section-intro">
        <h2>Incentive Finder</h2>
        <p>Discover rebates, tax credits, grants, and financing programs. ${filtered.length} program${filtered.length !== 1 ? 's' : ''} found.</p>
    </div>
    <div class="incentive-filter-bar" style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; align-items:center;">
        <select id="incCountry" style="${selectStyle}">
            <option value="">All Countries</option>
            ${countries.map(c => `<option value="${c}" ${filterCountry === c ? 'selected' : ''}>${c === 'US' ? 'United States' : 'Canada'}</option>`).join('')}
        </select>
        <select id="incState" style="${selectStyle}" ${!filterCountry ? 'disabled' : ''}>
            <option value="">${filterCountry === 'CA' ? 'All Provinces' : 'All States'}</option>
            ${statesRaw.map(s => `<option value="${s}" ${filterState === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <select id="incType" style="${selectStyle}">
            <option value="">All Types</option>
            ${types.map(t => `<option value="${t}" ${filterType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        ${(filterCountry || filterState || filterType) ? `<button id="incClear" style="padding:9px 16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); font-size:13px; color:var(--ink-3); cursor:pointer; transition:all var(--transition);">Clear filters</button>` : ''}
    </div>
    <div class="incentive-summary-bar">
        <div class="incentive-summary-stat">
            <span class="incentive-summary-count">${federalCount}</span>
            <span class="incentive-summary-label">Federal</span>
        </div>
        <div class="incentive-summary-stat">
            <span class="incentive-summary-count">${localCount}</span>
            <span class="incentive-summary-label">${filterCountry === 'CA' ? 'Provincial' : filterCountry === 'US' ? 'State' : 'State/Prov'}</span>
        </div>
        <div class="incentive-summary-stat">
            <span class="incentive-summary-count">${filtered.length}</span>
            <span class="incentive-summary-label">Total</span>
        </div>
    </div>
    <div class="incentive-list">${filtered.map(p => `
        <div class="incentive-item">
            <div class="incentive-item-header">
                <div class="incentive-name">${p.name}</div>
                <div class="incentive-meta">
                    <span class="incentive-type">${p.type}</span>
                    <span class="incentive-region">${p.state || (p.country === 'US' ? 'Federal' : 'Federal')}</span>
                </div>
                <div class="incentive-right">
                    <span class="incentive-amount">${p.amount}</span>
                    <span class="incentive-expand-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                </div>
            </div>
            <div class="incentive-body">
                <div class="incentive-desc">${p.description}</div>
                ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="incentive-link">
                    Learn more
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </a>` : ''}
            </div>
        </div>
    `).join('')}</div>`

  if (filtered.length === 0) {
    html += '<p class="knowledge-empty" style="text-align:center; padding:40px 0;">No incentive programs match your filters. Try adjusting your selections.</p>'
  }

  container.innerHTML = html

  // Bind filter events
  const countryEl = container.querySelector('#incCountry')
  if (countryEl) countryEl.addEventListener('change', e => {
    filterCountry = e.target.value
    filterState = '' // reset state when country changes
    renderIncentives(domain, currentSettings)
  })

  const stateEl = container.querySelector('#incState')
  if (stateEl) stateEl.addEventListener('change', e => {
    filterState = e.target.value
    renderIncentives(domain, currentSettings)
  })

  const typeEl = container.querySelector('#incType')
  if (typeEl) typeEl.addEventListener('change', e => {
    filterType = e.target.value
    renderIncentives(domain, currentSettings)
  })

  const clearBtn = container.querySelector('#incClear')
  if (clearBtn) clearBtn.addEventListener('click', () => {
    filterCountry = ''
    filterState = ''
    filterType = ''
    renderIncentives(domain, currentSettings)
  })

  // Expand/collapse logic
  container.querySelectorAll('.incentive-item-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.incentive-item')
      item.classList.toggle('expanded')
    })
  })
}
