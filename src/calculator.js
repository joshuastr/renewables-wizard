const solarState = { location: 'us-sw', monthlyBill: 200, systemType: 'solar-storage', roofArea: 500 }
const evState = { vehicles: 20, kmPerDay: 120, dwellHours: 10, evEfficiency: 0.20, chargerPower: 11.5 }
let currentDomain = 'solar'
let currentSettings = { country: 'US', currency: 'USD', cadRate: 1.37 }

const irradianceMap = {
    'us-sw': { label: 'US Southwest (AZ, NV, NM)', factor: 5.7, rate: 0.13, country: 'US' },
    'us-se': { label: 'US Southeast (FL, GA, SC)', factor: 4.8, rate: 0.13, country: 'US' },
    'us-ne': { label: 'US Northeast (NY, MA, CT)', factor: 4.0, rate: 0.22, country: 'US' },
    'us-mw': { label: 'US Midwest (IL, OH, MI)', factor: 4.2, rate: 0.14, country: 'US' },
    'us-w': { label: 'US West Coast (CA, OR, WA)', factor: 4.9, rate: 0.25, country: 'US' },
    'us-tx': { label: 'US Texas', factor: 5.2, rate: 0.12, country: 'US' },
    'ca-ab': { label: 'Canada Alberta', factor: 4.1, rate: 0.14, country: 'CA' },
    'ca-bc': { label: 'Canada British Columbia', factor: 3.5, rate: 0.11, country: 'CA' },
    'ca-on': { label: 'Canada Ontario', factor: 3.8, rate: 0.13, country: 'CA' },
    'ca-qc': { label: 'Canada Quebec', factor: 3.9, rate: 0.07, country: 'CA' },
    'ca-sk': { label: 'Canada Saskatchewan', factor: 4.3, rate: 0.15, country: 'CA' },
    'ca-mb': { label: 'Canada Manitoba', factor: 4.0, rate: 0.09, country: 'CA' },
    'ca-ns': { label: 'Canada Nova Scotia', factor: 3.5, rate: 0.17, country: 'CA' },
    'ca-nb': { label: 'Canada New Brunswick', factor: 3.4, rate: 0.13, country: 'CA' },
    'ca-nl': { label: 'Canada Newfoundland & Labrador', factor: 3.2, rate: 0.13, country: 'CA' },
    'ca-pe': { label: 'Canada Prince Edward Island', factor: 3.5, rate: 0.17, country: 'CA' }
}

export function initCalculator(domain, settings) {
    currentDomain = domain
    if (settings) currentSettings = settings
    renderCalculator(domain, settings)
}

export function renderCalculator(domain, settings) {
    currentDomain = domain
    if (settings) currentSettings = settings
    const container = document.getElementById('calculatorContainer')
    if (!container) return
    if (domain === 'ev') {
        renderEvCalculator(container)
    } else {
        renderSolarCalculator(container)
    }
}

function fmtCurrency(n) {
    const isCAD = currentSettings.currency === 'CAD'
    if (isCAD) n = n * currentSettings.cadRate
    const symbol = isCAD ? 'C$' : '$'
    return `${symbol}${Math.round(n).toLocaleString('en')}`
}

function getFilteredLocations() {
    return Object.entries(irradianceMap).filter(([, v]) => v.country === currentSettings.country)
}

function renderSolarCalculator(container) {
    const isUS = currentSettings.country === 'US'
    const currLabel = currentSettings.currency === 'CAD' ? 'CAD' : 'USD'
    const areaUnit = currentSettings.country === 'CA' ? 'sq m' : 'sq ft'
    const filteredLocations = getFilteredLocations()

    // Auto-select first matching location if current doesn't match country
    const currentLoc = irradianceMap[solarState.location]
    if (!currentLoc || currentLoc.country !== currentSettings.country) {
        solarState.location = filteredLocations[0]?.[0] || 'us-sw'
    }

    container.innerHTML = `
    <div class="section-intro">
        <h2>Solar & Storage Calculator</h2>
        <p>Estimate system size, production, costs, and payback period. Costs shown in ${currLabel}.</p>
    </div>
    <div class="calculator-layout">
        <div class="calc-panel">
            <div class="calc-panel-title">Your Situation</div>
            <div class="calc-group">
                <div class="calc-label"><span>Location</span></div>
                <select class="calc-select" id="calcLocation">
                    ${filteredLocations.map(([k, v]) => `<option value="${k}" ${solarState.location === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select>
            </div>
            <div class="calc-group">
                <div class="calc-label"><span>Monthly electricity bill</span><span class="calc-value" id="valBill">${fmtCurrency(solarState.monthlyBill)}/mo</span></div>
                <input type="range" class="calc-slider" id="calcBill" min="50" max="2000" step="10" value="${solarState.monthlyBill}" />
            </div>
            <div class="calc-group">
                <div class="calc-label"><span>Available roof/ground area</span><span class="calc-value" id="valArea">...</span></div>
                <input type="range" class="calc-slider" id="calcArea" min="100" max="5000" step="50" value="${solarState.roofArea}" />
            </div>
            <div class="calc-group">
                <div class="calc-label"><span>System type</span></div>
                <select class="calc-select" id="calcType">
                    <option value="solar-only" ${solarState.systemType === 'solar-only' ? 'selected' : ''}>Solar PV only</option>
                    <option value="solar-storage" ${solarState.systemType === 'solar-storage' ? 'selected' : ''}>Solar + battery storage</option>
                    <option value="microgrid" ${solarState.systemType === 'microgrid' ? 'selected' : ''}>Microgrid (solar + storage + controls)</option>
                </select>
            </div>
        </div>
        <div class="calc-panel" id="solarResultsPanel">
            <!-- Results injected here -->
        </div>
    </div>`

    const updateSolarDOM = () => {
        const areaFactor = currentSettings.country === 'CA' ? 0.093 : 1
        const displayRoof = Math.round(solarState.roofArea * areaFactor)

        // Update values
        const elBill = container.querySelector('#valBill')
        const elArea = container.querySelector('#valArea')
        if (elBill) elBill.innerText = fmtCurrency(solarState.monthlyBill) + '/mo'
        if (elArea) elArea.innerText = displayRoof + ' ' + areaUnit

        // Calculations
        const loc = irradianceMap[solarState.location]
        const annualKwh = solarState.monthlyBill / loc.rate * 12
        const systemKw = annualKwh / (loc.factor * 365)
        const panelCount = Math.ceil(systemKw * 1000 / 420)
        const roofNeeded = panelCount * 18
        const roofFit = roofNeeded <= solarState.roofArea

        const isStorage = solarState.systemType === 'solar-storage' || solarState.systemType === 'microgrid'
        const storageKwh = isStorage ? Math.max(10, Math.round(systemKw * 2.5)) : 0

        const solarCostPerW = 2.80
        const storageCostPerKwh = 650
        const solarCost = systemKw * 1000 * solarCostPerW
        const storageCost = storageKwh * storageCostPerKwh
        const totalGross = solarCost + storageCost

        const incentiveRate = isUS ? 0.30 : 0.10
        const incentiveLabel = isUS ? '30% Federal ITC' : 'Greener Homes / Provincial'
        const itcAmount = totalGross * incentiveRate
        const totalNet = totalGross - itcAmount
        const annualSavings = annualKwh * loc.rate
        const paybackYears = totalNet / annualSavings
        const displayNeeded = Math.round(roofNeeded * areaFactor)

        const resultsPanel = container.querySelector('#solarResultsPanel')
        if (resultsPanel) {
            resultsPanel.innerHTML = `
                <div class="calc-panel-title">Estimated System</div>
                <div class="calc-result-readout">
                    <div class="calc-result-label">Recommended System Size</div>
                    <div class="calc-result-value">${systemKw.toFixed(1)}<span class="calc-result-unit"> kW</span></div>
                    <div class="calc-result-subtext">${panelCount} panels | ${displayNeeded.toLocaleString()} ${areaUnit} needed</div>
                </div>
                <div class="calc-metrics">
                    <div class="calc-metric"><span class="calc-metric-label">Annual production</span><span class="calc-metric-value">${Math.round(annualKwh).toLocaleString()} kWh</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Roof/ground space</span><span class="calc-metric-value ${roofFit ? 'positive' : 'warning'}">${roofFit ? 'Fits available area' : 'Area may be tight'}</span></div>
                    ${isStorage ? `<div class="calc-metric"><span class="calc-metric-label">Recommended storage</span><span class="calc-metric-value">${storageKwh} kWh</span></div>` : ''}
                    <div class="calc-metric"><span class="calc-metric-label">Gross cost (before incentives)</span><span class="calc-metric-value">${fmtCurrency(totalGross)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">${incentiveLabel}</span><span class="calc-metric-value positive">-${fmtCurrency(itcAmount)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Net cost after incentives</span><span class="calc-metric-value">${fmtCurrency(totalNet)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Estimated annual savings</span><span class="calc-metric-value positive">${fmtCurrency(annualSavings)}/yr</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Simple payback period</span><span class="calc-metric-value">${paybackYears.toFixed(1)} years</span></div>
                </div>
            `
        }

        // Update slider tracks
        container.querySelectorAll('input[type=range]').forEach(slider => {
            const min = parseFloat(slider.min || 0)
            const max = parseFloat(slider.max || 100)
            const val = parseFloat(slider.value)
            const perc = ((val - min) / (max - min)) * 100
            slider.style.setProperty('--fill', perc + '%')
        })
    }

    const bindSlider = (id, key) => {
        const el = container.querySelector('#' + id)
        if (el) el.addEventListener('input', () => {
            solarState[key] = parseFloat(el.value)
            updateSolarDOM()
        })
    }

    bindSlider('calcBill', 'monthlyBill')
    bindSlider('calcArea', 'roofArea')

    const locEl = container.querySelector('#calcLocation')
    if (locEl) locEl.addEventListener('change', () => { solarState.location = locEl.value; renderCalculator(currentDomain, currentSettings) })

    const typeEl = container.querySelector('#calcType')
    if (typeEl) typeEl.addEventListener('change', () => { solarState.systemType = typeEl.value; updateSolarDOM() })

    updateSolarDOM()
}

let currentEvMode = 'infrastructure'

function renderEvCalculator(container) {
    const isCAD = currentSettings.currency === 'CAD'
    const distUnit = currentSettings.country === 'CA' ? 'km' : 'miles'
    const distFactor = currentSettings.country === 'CA' ? 1 : 0.621
    const effUnit = currentSettings.country === 'CA' ? 'Wh/km' : 'Wh/mi'
    const fuelUnit = currentSettings.country === 'CA' ? 'L' : 'gal'

    container.innerHTML = `
    <div class="section-intro">
        <h2>EV Fleet Calculator</h2>
        <p>Estimate charging infrastructure costs and calculate fleet electrification ROI.</p>
    </div>
    
    <div class="calculator-tabs" style="display:flex; gap:16px; margin-bottom:24px; border-bottom:1px solid var(--border);">
        <button class="tab-btn ${currentEvMode === 'infrastructure' ? 'active' : ''}" style="background:none; border:none; padding:8px 16px; font-weight:600; font-family:var(--font-heading); color:${currentEvMode === 'infrastructure' ? 'var(--accent)' : 'var(--ink-3)'}; border-bottom:${currentEvMode === 'infrastructure' ? '2px solid var(--accent)' : '2px solid transparent'}; cursor:pointer;" id="modeInfra">Infrastructure</button>
        <button class="tab-btn ${currentEvMode === 'roi' ? 'active' : ''}" style="background:none; border:none; padding:8px 16px; font-weight:600; font-family:var(--font-heading); color:${currentEvMode === 'roi' ? 'var(--accent)' : 'var(--ink-3)'}; border-bottom:${currentEvMode === 'roi' ? '2px solid var(--accent)' : '2px solid transparent'}; cursor:pointer;" id="modeRoi">Fleet ROI</button>
    </div>

    <div class="calculator-layout">
        <div class="calc-panel">
            <div class="calc-panel-title">Your Project</div>
            <div class="calc-group">
                <div class="calc-label"><span>How many vehicles need charging?</span><span class="calc-value" id="valVehicles">${evState.vehicles}</span></div>
                <input type="range" class="calc-slider" id="calcVehicles" min="1" max="200" value="${evState.vehicles}" />
            </div>
            <div class="calc-group">
                <div class="calc-label"><span>Average daily driving distance</span><span class="calc-value" id="valKm">${Math.round(evState.kmPerDay * distFactor)} ${distUnit}</span></div>
                <input type="range" class="calc-slider" id="calcKm" min="20" max="400" step="10" value="${evState.kmPerDay}" />
            </div>
            
            ${currentEvMode === 'infrastructure' ? `
            <div class="calc-group">
                <div class="calc-label"><span>Hours vehicles are parked</span><span class="calc-value" id="valDwell">${evState.dwellHours} hrs</span></div>
                <input type="range" class="calc-slider" id="calcDwell" min="2" max="16" value="${evState.dwellHours}" />
            </div>
            <div class="calc-group">
                <div class="calc-label"><span>Charger power level</span></div>
                <select class="calc-select" id="calcPower">
                    <option value="7.7" ${evState.chargerPower === 7.7 ? 'selected' : ''}>Level 2 - 32A (7.7 kW)</option>
                    <option value="11.5" ${evState.chargerPower === 11.5 ? 'selected' : ''}>Level 2 - 48A (11.5 kW)</option>
                    <option value="19.2" ${evState.chargerPower === 19.2 ? 'selected' : ''}>Level 2 - 80A (19.2 kW)</option>
                    <option value="50" ${evState.chargerPower === 50 ? 'selected' : ''}>DC Fast - 50 kW</option>
                    <option value="120" ${evState.chargerPower === 120 ? 'selected' : ''}>DC Fast - 120 kW</option>
                    <option value="150" ${evState.chargerPower === 150 ? 'selected' : ''}>DC Fast - 150 kW</option>
                    <option value="350" ${evState.chargerPower === 350 ? 'selected' : ''}>DC Fast - 350 kW</option>
                </select>
            </div>
            ` : ''}

            <div class="calc-group">
                <div class="calc-label"><span>Vehicle efficiency</span><span class="calc-value" id="valEff">${(evState.evEfficiency * 100).toFixed(0)} ${effUnit}</span></div>
                <input type="range" class="calc-slider" id="calcEff" min="0.12" max="0.50" step="0.01" value="${evState.evEfficiency}" />
            </div>
        </div>
        <div class="calc-panel" id="evResultsPanel">
            <!-- Results injected here -->
        </div>
    </div>`

    const updateEvDOM = () => {
        // Values
        const elVehicles = container.querySelector('#valVehicles')
        const elKm = container.querySelector('#valKm')
        const elDwell = container.querySelector('#valDwell')
        const elEff = container.querySelector('#valEff')

        if (elVehicles) elVehicles.innerText = evState.vehicles
        if (elKm) elKm.innerText = Math.round(evState.kmPerDay * distFactor) + ' ' + distUnit
        if (elDwell) elDwell.innerText = evState.dwellHours + ' hrs'
        if (elEff) elEff.innerText = (evState.evEfficiency * 100).toFixed(0) + ' ' + effUnit

        // Calculations
        const resultsPanel = container.querySelector('#evResultsPanel')
        if (currentEvMode === 'infrastructure') {
            const dailyKwhPerVehicle = evState.kmPerDay * evState.evEfficiency
            const totalDailyKwh = dailyKwhPerVehicle * evState.vehicles
            const kwhPerChargerPerDay = evState.chargerPower * evState.dwellHours * 0.85
            const chargersNeeded = Math.max(1, Math.ceil(totalDailyKwh / kwhPerChargerPerDay))
            const totalPeakKw = chargersNeeded * evState.chargerPower
            const serviceAmps = Math.ceil(totalPeakKw / 0.208)
            const managedServiceAmps = Math.ceil(serviceAmps * 0.55)
            const installCostLow = chargersNeeded * (evState.chargerPower > 20 ? 15000 : 1800)
            const installCostHigh = chargersNeeded * (evState.chargerPower > 20 ? 45000 : 4500)
            const upgradeNeeded = serviceAmps > 400

            resultsPanel.innerHTML = `
                <div class="calc-panel-title">Infrastructure Needed</div>
                <div class="calc-result-readout">
                    <div class="calc-result-label">Estimated Chargers</div>
                    <div class="calc-result-value">${chargersNeeded}<span class="calc-result-unit"> ports</span></div>
                    <div class="calc-result-subtext">at ${evState.chargerPower} kW each, for ${evState.vehicles} vehicles</div>
                </div>
                <div class="calc-metrics">
                    <div class="calc-metric"><span class="calc-metric-label">Total energy needed daily</span><span class="calc-metric-value">${totalDailyKwh.toFixed(0)} kWh</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Energy per vehicle per day</span><span class="calc-metric-value">${dailyKwhPerVehicle.toFixed(1)} kWh</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Total electrical load</span><span class="calc-metric-value">${totalPeakKw.toFixed(0)} kW</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Service without load management</span><span class="calc-metric-value ${upgradeNeeded ? 'warning' : ''}">${serviceAmps} Amps</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Service with load management</span><span class="calc-metric-value positive">${managedServiceAmps} Amps</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Panel upgrade needed?</span><span class="calc-metric-value ${upgradeNeeded ? 'danger' : 'positive'}">${upgradeNeeded ? 'Likely needed' : 'May fit existing panel'}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Estimated installation cost</span><span class="calc-metric-value">${fmtCurrency(installCostLow)} - ${fmtCurrency(installCostHigh)}</span></div>
                </div>
            `
        } else {
            // ROI Mode
            const annualDistPerVeh = evState.kmPerDay * 365
            const totalAnnualDist = annualDistPerVeh * evState.vehicles

            // Assumptions
            const fuelCostPerUnit = isCAD ? 1.60 : 3.50 // CAD/L or USD/gal
            const elecCostPerKwh = isCAD ? 0.14 : 0.16
            const iceEfficiency = isCAD ? 12 : 20 // 12 L/100km or 20 mi/gal

            // Fuel calculations
            let annualFuelUnits = 0
            if (isCAD) {
                annualFuelUnits = (totalAnnualDist / 100) * iceEfficiency
            } else {
                annualFuelUnits = totalAnnualDist / iceEfficiency
            }
            const annualIceCost = annualFuelUnits * fuelCostPerUnit

            // EV calculations
            const annualKwh = totalAnnualDist * evState.evEfficiency
            const annualEvCost = annualKwh * elecCostPerKwh

            // Maintenance savings (approx $0.03/km)
            const maintenanceSavings = totalAnnualDist * 0.03

            const totalSavings = (annualIceCost - annualEvCost) + maintenanceSavings

            resultsPanel.innerHTML = `
                <div class="calc-panel-title">Annual Operating Savings</div>
                <div class="calc-result-readout">
                    <div class="calc-result-label">Estimated Fleet Savings</div>
                    <div class="calc-result-value">${fmtCurrency(totalSavings)}<span class="calc-result-unit">/yr</span></div>
                    <div class="calc-result-subtext">Fuel and maintenance vs ICE fleet</div>
                </div>
                <div class="calc-metrics">
                    <div class="calc-metric"><span class="calc-metric-label">ICE annual fuel cost (${fuelUnit})</span><span class="calc-metric-value">${fmtCurrency(annualIceCost)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">EV annual charging cost (kWh)</span><span class="calc-metric-value">${fmtCurrency(annualEvCost)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Fuel savings</span><span class="calc-metric-value positive">${fmtCurrency(annualIceCost - annualEvCost)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Maintenance savings</span><span class="calc-metric-value positive">${fmtCurrency(maintenanceSavings)}</span></div>
                    <div class="calc-metric"><span class="calc-metric-label">Total annual fleet distance</span><span class="calc-metric-value">${Math.round(totalAnnualDist * distFactor).toLocaleString()} ${distUnit}</span></div>
                </div>
            `
        }

        // Update track styling
        container.querySelectorAll('input[type=range]').forEach(slider => {
            const min = parseFloat(slider.min || 0)
            const max = parseFloat(slider.max || 100)
            const val = parseFloat(slider.value)
            const perc = ((val - min) / (max - min)) * 100
            slider.style.setProperty('--fill', perc + '%')
        })
    }

    const bindSlider = (id, key) => {
        const el = container.querySelector('#' + id)
        if (el) el.addEventListener('input', () => {
            evState[key] = parseFloat(el.value)
            updateEvDOM()
        })
    }

    bindSlider('calcVehicles', 'vehicles')
    bindSlider('calcKm', 'kmPerDay')
    if (currentEvMode === 'infrastructure') bindSlider('calcDwell', 'dwellHours')
    bindSlider('calcEff', 'evEfficiency')

    const ps = container.querySelector('#calcPower')
    if (ps) ps.addEventListener('change', () => { evState.chargerPower = parseFloat(ps.value); updateEvDOM() })

    // Mode toggles
    container.querySelector('#modeInfra').addEventListener('click', () => { currentEvMode = 'infrastructure'; renderEvCalculator(container) })
    container.querySelector('#modeRoi').addEventListener('click', () => { currentEvMode = 'roi'; renderEvCalculator(container) })

    // Initial render
    updateEvDOM()
}
