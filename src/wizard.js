let treeData = null
let wizardState = {}
let currentCountry = 'US'

const svgIcons = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  building: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 3v15M9 9h1M9 13h1M9 17h1M17 9h1M17 13h1"/></svg>',
  barn: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  city: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V9h4v12M11 21V5h4v16M17 21V11h4v10"/></svg>',
  mountain: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 21l4-10 4 10"/><path d="M2 21l7-14 3 6"/><path d="M22 21l-7-14"/></svg>',
  dollar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  battery: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>',
  chart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  leaf: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 21c3-3 4-7 4-12 4 0 8 1 11 4-1 5-5 9-11 9-2 0-3-1-4-1z"/><path d="M7 20c2-3 4-6 9-9"/></svg>',
  grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/><line x1="5" y1="16" x2="19" y2="16"/></svg>',
  sun: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>',
  'sun-battery': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="7" r="3.5"/><line x1="9" y1="1" x2="9" y2="2.5"/><line x1="4" y1="3" x2="5.1" y2="4.1"/><line x1="14" y1="3" x2="12.9" y2="4.1"/><line x1="2" y1="7" x2="3.5" y2="7"/><rect x="6" y="14" width="14" height="8" rx="1.5"/><line x1="22" y1="17" x2="22" y2="19"/></svg>',
  'battery-full': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/><rect x="4" y="9" width="12" height="6" fill="currentColor" opacity="0.2"/></svg>',
  network: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><line x1="12" y1="7.5" x2="5" y2="16.5"/><line x1="12" y1="7.5" x2="19" y2="16.5"/><line x1="7.5" y1="19" x2="16.5" y2="19"/></svg>',
  'roof-pitch': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V12l9-9 9 9v9"/><path d="M6 14l6-6 6 6"/></svg>',
  'roof-flat': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="8" width="18" height="13"/><line x1="3" y1="8" x2="21" y2="8"/><rect x="6" y="4" width="12" height="4"/></svg>',
  'roof-metal': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V10l9-7 9 7v11"/><path d="M7 10v11M11 6v15M15 10v11M19 10v11"/></svg>',
  ground: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 17l4-8h12l4 8"/><line x1="6" y1="17" x2="8" y2="9"/><line x1="18" y1="17" x2="16" y2="9"/><line x1="2" y1="21" x2="22" y2="21"/><line x1="2" y1="17" x2="22" y2="17"/></svg>',
  carport: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10l10-6 10 6"/><line x1="4" y1="10" x2="4" y2="20"/><line x1="20" y1="10" x2="20" y2="20"/><line x1="2" y1="20" x2="22" y2="20"/><rect x="8" y="15" width="8" height="3" rx="1"/></svg>',
  truck: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  store: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9v12h18V9"/><path d="M3 9c0 1.5 1.5 3 3 3s3-1.5 3-3c0 1.5 1.5 3 3 3s3-1.5 3-3c0 1.5 1.5 3 3 3s3-1.5 3-3"/><path d="M9 21v-6h6v6"/></svg>',
  hotel: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16"/><path d="M7 8h2M7 12h2M7 16h2M15 8h2M15 12h2M15 16h2M11 8h2M11 12h2"/><path d="M10 21v-4h4v4"/></svg>',
  road: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19L8 5h8l4 14"/><path d="M12 5v3M12 11v3M12 17v3"/></svg>',
  car: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17h14v-5l-2-5H7L5 12v5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 12h14"/></svg>',
  van: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 6h15v11H1z"/><path d="M16 9h4l3 3v5h-7V9z"/><circle cx="5" cy="18.5" r="2"/><circle cx="18" cy="18.5" r="2"/></svg>',
  bus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="16" rx="2"/><path d="M3 12h18M7 19v2M17 19v2"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/></svg>',
  refresh: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  zap: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  tool: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  default: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
}

function getIcon(name) {
  return svgIcons[name] || svgIcons.default
}

export function resetWizard() {
  wizardState = {}
}

export function initWizard(data, domain) {
  treeData = data
  wizardState = {}
  renderWizard(domain)
}

export function renderWizard(domain, settings) {
  if (settings && settings.country) currentCountry = settings.country === 'CA' ? 'CA' : 'US'
  const container = document.getElementById('wizardContainer')
  if (!container || !treeData) return
  const steps = treeData.steps.filter(s => s.domain.includes(domain))
  const visible = getVisibleSteps(steps)
  const allAnswered = visible.length > 0 && visible.every(s => wizardState[s.id] !== undefined)

  let html = `<div class="section-intro">
        <h2>${getDomainTitle(domain)} Advisor</h2>
        <p>Answer a few questions about your project and we will provide tailored recommendations, expert tips, and relevant comparisons.</p>
    </div>`

  visible.forEach((step, i) => {
    html += renderStep(step, i)
  })

  const answeredCount = visible.filter(s => wizardState[s.id] !== undefined).length

  if (allAnswered) {
    html += renderResults(domain, steps)
  } else if (visible.length > 0) {
    html += `<div class="wizard-progress"><span>${answeredCount} of ${visible.length} answered</span></div>`
  }

  container.innerHTML = html

  container.querySelectorAll('.wizard-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const stepId = opt.dataset.step
      const value = opt.dataset.value
      const step = steps.find(s => s.id === stepId)
      if (step && step.type === 'multi-select') {
        const current = wizardState[stepId] || []
        if (current.includes(value)) {
          wizardState[stepId] = current.filter(v => v !== value)
          if (wizardState[stepId].length === 0) delete wizardState[stepId]
        } else {
          wizardState[stepId] = [...current, value]
        }
      } else {
        wizardState[stepId] = value
      }
      renderWizard(domain)
    })
  })

  const resetBtn = container.querySelector('#wizardReset')
  if (resetBtn) resetBtn.addEventListener('click', () => { wizardState = {}; renderWizard(domain) })
}

function getDomainTitle(domain) {
  const titles = { solar: 'Solar PV', storage: 'Battery Storage', ev: 'EV Charging', microgrid: 'Microgrid' }
  return titles[domain] || 'Renewables'
}

function getVisibleSteps(steps) {
  return steps.filter(step => {
    if (!step.showWhen) return true
    return Object.entries(step.showWhen).every(([key, vals]) => {
      const answer = wizardState[key]
      return answer && vals.includes(answer)
    })
  })
}

function renderStep(step, idx) {
  const selected = wizardState[step.id]
  const isMulti = step.type === 'multi-select'
  return `<div class="wizard-step">
        <div class="wizard-step-header">
            <span class="wizard-step-number">${idx + 1}</span>
            <div><div class="wizard-step-question">${step.question}</div>
            <div class="wizard-step-desc">${step.description}</div></div>
        </div>
        <div class="wizard-options">${step.options.map(opt => {
    const isSelected = isMulti ? (selected || []).includes(opt.value) : selected === opt.value
    return `<button class="wizard-option${isSelected ? ' selected' : ''}" data-step="${step.id}" data-value="${opt.value}">
                <span class="wizard-option-icon">${opt.icon ? getIcon(opt.icon) : ''}</span>
                <span class="wizard-option-label">${opt.label}</span>
                ${opt.description ? `<span class="wizard-option-desc">${opt.description}</span>` : ''}
            </button>`
  }).join('')}</div>
    </div>`
}

function renderResults(domain, steps) {
  const countryCode = currentCountry === 'CA' ? 'CA' : 'US'
  const rules = treeData.rules.filter(r => r.domain.includes(domain)).filter(r => {
    if (!r.country) return true
    return r.country === countryCode || r.country === 'all'
  })
  const match = findMatchingRule(rules)
  if (!match) return ''
  return `<div class="wizard-results">
        <div class="wizard-results-header">
            <div class="result-section-title">${match.name}</div>
            <button class="btn btn-ghost" id="wizardReset">Start Over</button>
        </div>
        <div class="wizard-reasoning">${match.reasoning}</div>
        ${match.tips ? `<div class="wizard-tips-title">Expert Tips</div>
        <ul class="wizard-tips">${match.tips.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
        ${match.recommendedCategories ? `<div class="wizard-rec-cats">
            <span class="wizard-rec-label">Recommended categories:</span>
            ${match.recommendedCategories.map(c => `<span class="wizard-rec-tag">${c}</span>`).join('')}
        </div>` : ''}
    </div>`
}

function findMatchingRule(rules) {
  const specific = rules.filter(r => Object.keys(r.conditions).length > 0)
  const general = rules.filter(r => Object.keys(r.conditions).length === 0)
  for (const rule of specific.sort((a, b) => Object.keys(b.conditions).length - Object.keys(a.conditions).length)) {
    const matches = Object.entries(rule.conditions).every(([key, val]) => wizardState[key] === val)
    if (matches) return rule
  }
  return general[0] || null
}
