import { initWizard, renderWizard, resetWizard } from './wizard.js'
import { initKnowledge, renderKnowledge } from './knowledge.js'
import { initCalculator, renderCalculator } from './calculator.js'
import { initComparison, renderComparison } from './comparison.js'
import { initIncentives, renderIncentives } from './incentives.js'
import { initOCPP, renderOCPP } from './ocpp.js'

let activeDomain = 'solar'
let activeCountry = 'US'
let activeCurrency = 'USD'
let activeLocation = ''

const CAD_RATE = 1.37

export function getSettings() {
    return { country: activeCountry, currency: activeCurrency, location: activeLocation, cadRate: CAD_RATE }
}

export function formatCurrency(amount) {
    const symbol = activeCurrency === 'CAD' ? 'C$' : '$'
    if (activeCurrency === 'CAD') amount = amount * CAD_RATE
    return `${symbol}${Math.round(amount).toLocaleString('en')}`
}

const domainNames = { solar: 'Solar PV', storage: 'Battery Storage', ev: 'EV Charging', microgrid: 'Microgrids' }
const tabContexts = {
    advisor: { suffix: 'Advisor', desc: 'Walk through your project details step by step and get tailored product recommendations with expert tips.' },
    knowledge: { suffix: 'Knowledge Base', desc: 'Browse FAQs and reference guides organized by topic. Search for specific questions.' },
    calculator: { suffix: 'Calculators', desc: 'Adjust sliders to estimate system sizing, energy output, costs, and payback for your project.' },
    compare: { suffix: 'Product Comparison', desc: 'Filter by manufacturer and type, then select up to 3 products to compare specs side by side.' },
    incentives: { suffix: 'Incentives', desc: 'Browse available rebates, tax credits, and grants filtered by your region.' },
    ocpp: { suffix: 'OCPP Software', desc: 'Compare EV charging management platforms that support the Open Charge Point Protocol.' }
}
let activeTab = 'advisor'

function updateContextBar() {
    const contextTitle = document.getElementById('domainContextTitle')
    const contextDesc = document.getElementById('domainContextDesc')
    const domain = domainNames[activeDomain] || 'Renewables'
    const tab = tabContexts[activeTab] || tabContexts.advisor
    if (contextTitle) contextTitle.textContent = `${domain} ${tab.suffix}`
    if (contextDesc) contextDesc.textContent = tab.desc
}

function initTabs() {
    const tabs = document.querySelectorAll('.tool-tab')
    const panels = document.querySelectorAll('.tab-panel')
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab
            activeTab = target
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false') })
            tab.classList.add('active')
            tab.setAttribute('aria-selected', 'true')
            panels.forEach(p => p.classList.remove('active'))
            const panel = document.getElementById(target + 'Panel')
            if (panel) panel.classList.add('active')
            updateContextBar()
        })
    })
}

function updateDomainTabs() {
    const ocppTab = document.querySelector('.tool-tab[data-tab="ocpp"]')
    if (ocppTab) {
        ocppTab.style.display = activeDomain === 'ev' ? '' : 'none'
    }
    if (activeDomain !== 'ev' && activeTab === 'ocpp') {
        activeTab = 'advisor'
        document.querySelectorAll('.tool-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false') })
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        const advisorTab = document.querySelector('.tool-tab[data-tab="advisor"]')
        const advisorPanel = document.getElementById('advisorPanel')
        if (advisorTab) { advisorTab.classList.add('active'); advisorTab.setAttribute('aria-selected', 'true') }
        if (advisorPanel) advisorPanel.classList.add('active')
        updateContextBar()
    }
}

function initDomainSelector() {
    const btns = document.querySelectorAll('.domain-btn')
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const domain = btn.dataset.domain
            if (domain === activeDomain) return
            activeDomain = domain
            btns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            document.body.dataset.domain = domain
            resetWizard()
            updateContextBar()
            updateDomainTabs()
            refreshAllModules()
        })
    })
    document.body.dataset.domain = activeDomain
}

function initSettingsBar() {
    const countryBtns = document.querySelectorAll('.country-btn')
    const locationSelect = document.getElementById('locationSelect')
    const currencyDisplay = document.getElementById('currencyDisplay')

    const locationOptions = {
        US: [
            { value: '', label: 'All US' },
            { value: 'CA', label: 'California' },
            { value: 'NY', label: 'New York' },
            { value: 'TX', label: 'Texas' },
            { value: 'FL', label: 'Florida' },
            { value: 'IL', label: 'Illinois' },
            { value: 'MA', label: 'Massachusetts' },
            { value: 'CO', label: 'Colorado' },
            { value: 'AZ', label: 'Arizona' },
            { value: 'NJ', label: 'New Jersey' },
        ],
        CA: [
            { value: '', label: 'All Canada' },
            { value: 'ON', label: 'Ontario' },
            { value: 'BC', label: 'British Columbia' },
            { value: 'QC', label: 'Quebec' },
            { value: 'AB', label: 'Alberta' },
            { value: 'SK', label: 'Saskatchewan' },
            { value: 'MB', label: 'Manitoba' },
            { value: 'NS', label: 'Nova Scotia' },
            { value: 'NB', label: 'New Brunswick' },
        ]
    }

    function rebuildLocationDropdown(country) {
        if (!locationSelect) return
        const opts = locationOptions[country] || locationOptions.US
        locationSelect.innerHTML = opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('')
    }

    countryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.dataset.country
            if (country === activeCountry) return
            activeCountry = country
            activeCurrency = country === 'CA' ? 'CAD' : 'USD'
            activeLocation = ''

            countryBtns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')

            if (currencyDisplay) currencyDisplay.textContent = activeCurrency
            rebuildLocationDropdown(country)
            refreshAllModules()
        })
    })

    if (locationSelect) {
        locationSelect.addEventListener('change', () => {
            activeLocation = locationSelect.value
            refreshAllModules()
        })
    }

    // Initialize with US options
    rebuildLocationDropdown('US')
}

function refreshAllModules() {
    const settings = getSettings()
    renderWizard(activeDomain, settings)
    renderKnowledge(activeDomain)
    renderCalculator(activeDomain, settings)
    renderComparison(activeDomain)
    renderIncentives(activeDomain, settings)
}

const BASE = import.meta.env.BASE_URL

async function loadJSON(path) {
    const res = await fetch(path)
    return res.json()
}

document.addEventListener('DOMContentLoaded', async () => {
    initTabs()
    initDomainSelector()
    initSettingsBar()
    updateDomainTabs()
    const [treeData, faqData, solarData, bessData, evData, incentiveData, microgridData, ocppData] = await Promise.all([
        loadJSON(`${BASE}data/decision-tree.json`),
        loadJSON(`${BASE}data/faq.json`),
        loadJSON(`${BASE}data/products-solar.json`),
        loadJSON(`${BASE}data/products-bess.json`),
        loadJSON(`${BASE}data/products-ev.json`),
        loadJSON(`${BASE}data/incentives.json`),
        loadJSON(`${BASE}data/products-microgrid.json`),
        loadJSON(`${BASE}data/ocpp-providers.json`),
    ])
    const settings = getSettings()
    initWizard(treeData, activeDomain)
    initKnowledge(faqData, activeDomain)
    initCalculator(activeDomain, settings)
    initComparison({ solar: solarData, bess: bessData, ev: evData, microgrid: microgridData }, activeDomain)
    initIncentives(incentiveData, activeDomain, settings)
    initOCPP(ocppData)
})
