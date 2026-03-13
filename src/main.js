import { initWizard, renderWizard } from './wizard.js'
import { initKnowledge, renderKnowledge } from './knowledge.js'
import { initCalculator, renderCalculator } from './calculator.js'
import { initComparison, renderComparison } from './comparison.js'
import { initIncentives, renderIncentives } from './incentives.js'

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

function initTabs() {
    const tabs = document.querySelectorAll('.tool-tab')
    const panels = document.querySelectorAll('.tab-panel')
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false') })
            tab.classList.add('active')
            tab.setAttribute('aria-selected', 'true')
            panels.forEach(p => p.classList.remove('active'))
            const panel = document.getElementById(target + 'Panel')
            if (panel) panel.classList.add('active')
        })
    })
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
    renderWizard(activeDomain)
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
    const [treeData, faqData, solarData, bessData, evData, incentiveData] = await Promise.all([
        loadJSON(`${BASE}data/decision-tree.json`),
        loadJSON(`${BASE}data/faq.json`),
        loadJSON(`${BASE}data/products-solar.json`),
        loadJSON(`${BASE}data/products-bess.json`),
        loadJSON(`${BASE}data/products-ev.json`),
        loadJSON(`${BASE}data/incentives.json`),
    ])
    const settings = getSettings()
    initWizard(treeData, activeDomain)
    initKnowledge(faqData, activeDomain)
    initCalculator(activeDomain, settings)
    initComparison({ solar: solarData, bess: bessData, ev: evData }, activeDomain)
    initIncentives(incentiveData, activeDomain, settings)
})
