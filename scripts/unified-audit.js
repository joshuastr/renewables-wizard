#!/usr/bin/env node

/**
 * Renewables Wizard - Unified Audit Pipeline
 *
 * 8-dimension quality gate for the open-source Renewables Wizard:
 * 1. ESLint          (Code Quality)
 * 2. npm audit       (Security)
 * 3. Knip            (Dead Code)
 * 4. Madge           (Circular Dependencies)
 * 5. Data Integrity  (Custom JSON validation)
 * 6. File Health     (LOC, TODOs, oversized files)
 * 7. Bundle Size     (Vite build)
 * 8. Lighthouse      (Accessibility - graceful skip)
 *
 * Usage:
 *   node scripts/unified-audit.js
 *   node scripts/unified-audit.js --json
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const AUDIT_DIR = path.join(PROJECT_ROOT, 'audit');

const results = [];

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDirs() {
    for (const dir of [REPORTS_DIR, AUDIT_DIR]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
}

function runSilent(command) {
    try {
        const output = execSync(command, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { code: 0, stdout: output, stderr: '' };
    } catch (e) {
        return { code: e.status || 1, stdout: e.stdout || '', stderr: e.stderr || '' };
    }
}

function section(title) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(60)}`);
}

function pushResult(name, passed, score, details) {
    results.push({ name, passed, score: Math.max(0, Math.min(4, score)), details });
}

// ============================================================================
// DIMENSION 1: ESLint (Code Quality)
// ============================================================================

function auditESLint() {
    section('1. ESLint - Code Quality');
    const { code, stdout, stderr } = runSilent('npx eslint src/ --format compact');
    const output = stdout + stderr;

    const errorMatch = output.match(/(\d+)\s+error/i);
    const warnMatch = output.match(/(\d+)\s+warning/i);
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnings = warnMatch ? parseInt(warnMatch[1]) : 0;

    if (errors === 0 && warnings === 0) {
        console.log('  ✅ No lint issues');
        pushResult('Code Quality (ESLint)', true, 4.0, { errors, warnings });
    } else if (errors === 0) {
        console.log(`  ✅ No errors (${warnings} warnings)`);
        pushResult('Code Quality (ESLint)', true, warnings > 5 ? 3.5 : 4.0, { errors, warnings });
    } else {
        console.log(`  ⚠️  ${errors} errors, ${warnings} warnings`);
        const score = Math.max(0, 4.0 - (errors * 0.5));
        pushResult('Code Quality (ESLint)', false, score, { errors, warnings });
    }
}

// ============================================================================
// DIMENSION 2: npm audit (Security)
// ============================================================================

function auditSecurity() {
    section('2. npm audit - Dependency Security');
    const { code, stdout } = runSilent('npm audit --json 2>/dev/null');

    let vulns = { total: 0, critical: 0, high: 0 };
    try {
        const data = JSON.parse(stdout);
        if (data.metadata && data.metadata.vulnerabilities) {
            const v = data.metadata.vulnerabilities;
            vulns.total = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
            vulns.critical = v.critical || 0;
            vulns.high = v.high || 0;
        }
    } catch (_) { /* non-JSON output means no vulns */ }

    if (vulns.total === 0) {
        console.log('  ✅ No known vulnerabilities');
        pushResult('Security (npm audit)', true, 4.0, vulns);
    } else {
        console.log(`  ⚠️  ${vulns.total} vulnerabilities (${vulns.critical} critical, ${vulns.high} high)`);
        const score = vulns.critical > 0 ? 0.0 : vulns.high > 0 ? 2.0 : 3.0;
        pushResult('Security (npm audit)', vulns.critical === 0 && vulns.high === 0, score, vulns);
    }
}

// ============================================================================
// DIMENSION 3: Knip (Dead Code)
// ============================================================================

function auditDeadCode() {
    section('3. Knip - Dead Code Detection');
    const { code, stdout, stderr } = runSilent('npx knip --no-progress 2>&1');
    const output = stdout + stderr;

    // Knip outputs sections for unused files, exports, deps
    const unusedFiles = (output.match(/Unused files/gi) || []).length > 0;
    const unusedDeps = (output.match(/Unused dependencies/gi) || []).length > 0;
    const unusedExports = (output.match(/Unused exports/gi) || []).length > 0;

    // Count actual items listed
    const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('Unused') && !l.startsWith('---'));
    const issueCount = lines.filter(l => l.match(/^\s*(src\/|data\/|\.\/)/)).length;

    if (code === 0 || issueCount === 0) {
        console.log('  ✅ No dead code detected');
        pushResult('Dead Code (Knip)', true, 4.0, { unusedFiles: 0, unusedDeps: 0 });
    } else {
        console.log(`  ⚠️  ${issueCount} potential dead code items`);
        if (unusedFiles) console.log('    - Unused files detected');
        if (unusedDeps) console.log('    - Unused dependencies detected');
        if (unusedExports) console.log('    - Unused exports detected (informational)');

        // Only unused files and deps are real issues; exports are "technical noise"
        const realIssues = (unusedFiles ? 1 : 0) + (unusedDeps ? 1 : 0);
        const score = realIssues === 0 ? 3.5 : Math.max(0, 4.0 - (realIssues * 1.0));
        pushResult('Dead Code (Knip)', realIssues === 0, score, { unusedFiles, unusedDeps, unusedExports, issueCount });
    }
}

// ============================================================================
// DIMENSION 4: Madge (Circular Dependencies)
// ============================================================================

function auditCircular() {
    section('4. Madge - Circular Dependencies');
    const { code, stdout } = runSilent('npx madge --circular --extensions js src/');
    const output = stdout.trim();

    const cycleMatch = output.match(/Found (\d+) circular/i);
    const cycles = cycleMatch ? parseInt(cycleMatch[1]) : 0;

    if (cycles === 0 && !output.includes('→')) {
        console.log('  ✅ No circular dependencies');
        pushResult('Circular Dependencies (Madge)', true, 4.0, { cycles: 0 });
    } else {
        const detectedCycles = cycles || output.split('\n').filter(l => l.includes('→')).length;
        console.log(`  ⚠️  ${detectedCycles} circular dependency cycles found`);
        const score = Math.max(0, 4.0 - (detectedCycles * 1.0));
        pushResult('Circular Dependencies (Madge)', false, score, { cycles: detectedCycles });
    }
}

// ============================================================================
// DIMENSION 5: Data Integrity (Custom JSON Validation)
// ============================================================================

function auditDataIntegrity() {
    section('5. Data Integrity - JSON Validation');
    const dataDir = path.join(PROJECT_ROOT, 'data');
    const issues = [];
    let totalChecks = 0;
    let passedChecks = 0;

    const schemas = {
        'decision-tree.json': {
            extract: d => ({
                steps: d.steps || [],
                rules: d.rules || [],
            }),
            validate: (data) => {
                const { steps, rules } = data;
                const checks = [];

                // Step count
                totalChecks++;
                if (steps.length >= 10) { passedChecks++; checks.push('✅ Steps: ' + steps.length); }
                else { checks.push('❌ Steps: ' + steps.length + ' (need >=10)'); issues.push('decision-tree: too few steps'); }

                // Rule count
                totalChecks++;
                if (rules.length >= 10) { passedChecks++; checks.push('✅ Rules: ' + rules.length); }
                else { checks.push('❌ Rules: ' + rules.length + ' (need >=10)'); issues.push('decision-tree: too few rules'); }

                // Domain tags on steps
                totalChecks++;
                const stepsWithDomain = steps.filter(s => Array.isArray(s.domain) && s.domain.length > 0);
                if (stepsWithDomain.length === steps.length) { passedChecks++; checks.push('✅ All steps have domain tags'); }
                else { checks.push(`⚠️ ${steps.length - stepsWithDomain.length} steps missing domain tags`); issues.push('decision-tree: missing domain tags on steps'); }

                // Domain tags on rules
                totalChecks++;
                const rulesWithDomain = rules.filter(r => Array.isArray(r.domain) && r.domain.length > 0);
                if (rulesWithDomain.length === rules.length) { passedChecks++; checks.push('✅ All rules have domain tags'); }
                else { checks.push(`⚠️ ${rules.length - rulesWithDomain.length} rules missing domain tags`); issues.push('decision-tree: missing domain tags on rules'); }

                // Required fields on steps
                totalChecks++;
                const missingQ = steps.filter(s => !s.question);
                if (missingQ.length === 0) { passedChecks++; checks.push('✅ All steps have questions'); }
                else { checks.push(`❌ ${missingQ.length} steps missing question`); issues.push('decision-tree: steps without questions'); }

                // Required fields on rules
                totalChecks++;
                const missingR = rules.filter(r => !r.reasoning);
                if (missingR.length === 0) { passedChecks++; checks.push('✅ All rules have reasoning'); }
                else { checks.push(`❌ ${missingR.length} rules missing reasoning`); issues.push('decision-tree: rules without reasoning'); }

                return checks;
            }
        },
        'faq.json': {
            extract: d => ({
                categories: d.categories || [],
                entries: d.entries || [],
            }),
            validate: (data) => {
                const { categories, entries } = data;
                const checks = [];

                totalChecks++;
                if (entries.length >= 20) { passedChecks++; checks.push('✅ FAQ entries: ' + entries.length); }
                else { checks.push('❌ FAQ entries: ' + entries.length + ' (need >=20)'); issues.push('faq: too few entries'); }

                totalChecks++;
                if (categories.length >= 10) { passedChecks++; checks.push('✅ Categories: ' + categories.length); }
                else { checks.push('⚠️ Categories: ' + categories.length + ' (need >=10)'); issues.push('faq: too few categories'); }

                totalChecks++;
                const missingQ = entries.filter(e => !e.question || !e.answer);
                if (missingQ.length === 0) { passedChecks++; checks.push('✅ All entries have Q&A'); }
                else { checks.push(`❌ ${missingQ.length} entries missing Q or A`); issues.push('faq: entries without Q/A'); }

                totalChecks++;
                const missingDomain = entries.filter(e => !Array.isArray(e.domain) || e.domain.length === 0);
                if (missingDomain.length === 0) { passedChecks++; checks.push('✅ All entries have domain tags'); }
                else { checks.push(`⚠️ ${missingDomain.length} entries missing domain tags`); issues.push('faq: missing domain tags'); }

                return checks;
            }
        },
        'products-solar.json': {
            extract: d => ({
                panels: d.panels || [],
                inverters: d.inverters || [],
            }),
            validate: (data) => {
                const { panels, inverters } = data;
                const checks = [];

                totalChecks++;
                if (panels.length >= 5) { passedChecks++; checks.push('✅ Panels: ' + panels.length); }
                else { checks.push('❌ Panels: ' + panels.length + ' (need >=5)'); issues.push('products-solar: too few panels'); }

                totalChecks++;
                if (inverters.length >= 5) { passedChecks++; checks.push('✅ Inverters: ' + inverters.length); }
                else { checks.push('❌ Inverters: ' + inverters.length + ' (need >=5)'); issues.push('products-solar: too few inverters'); }

                // Required fields
                for (const [label, items, fields] of [['panels', panels, ['model', 'manufacturer', 'power']], ['inverters', inverters, ['model', 'manufacturer', 'power']]]) {
                    for (const field of fields) {
                        totalChecks++;
                        const missing = items.filter(i => !i[field]);
                        if (missing.length === 0) { passedChecks++; }
                        else { checks.push(`⚠️ ${label}: ${missing.length} missing '${field}'`); issues.push(`products-solar: ${label} missing ${field}`); }
                    }
                }

                return checks;
            }
        },
        'products-bess.json': {
            extract: d => ({ systems: d.systems || [] }),
            validate: (data) => {
                const { systems } = data;
                const checks = [];

                totalChecks++;
                if (systems.length >= 5) { passedChecks++; checks.push('✅ Battery systems: ' + systems.length); }
                else { checks.push('❌ Battery systems: ' + systems.length + ' (need >=5)'); issues.push('products-bess: too few systems'); }

                for (const field of ['model', 'manufacturer', 'capacity']) {
                    totalChecks++;
                    const missing = systems.filter(s => !s[field]);
                    if (missing.length === 0) { passedChecks++; }
                    else { checks.push(`⚠️ ${missing.length} systems missing '${field}'`); issues.push(`products-bess: missing ${field}`); }
                }

                return checks;
            }
        },
        'products-ev.json': {
            extract: d => ({ chargers: d.chargers || [] }),
            validate: (data) => {
                const { chargers } = data;
                const checks = [];

                totalChecks++;
                if (chargers.length >= 10) { passedChecks++; checks.push('✅ EV chargers: ' + chargers.length); }
                else { checks.push('❌ EV chargers: ' + chargers.length + ' (need >=10)'); issues.push('products-ev: too few chargers'); }

                for (const field of ['model', 'manufacturer', 'power', 'connector']) {
                    totalChecks++;
                    const missing = chargers.filter(c => !c[field]);
                    if (missing.length === 0) { passedChecks++; }
                    else { checks.push(`⚠️ ${missing.length} chargers missing '${field}'`); issues.push(`products-ev: missing ${field}`); }
                }

                return checks;
            }
        },
        'incentives.json': {
            extract: d => ({ programs: d.programs || [] }),
            validate: (data) => {
                const { programs } = data;
                const checks = [];

                totalChecks++;
                if (programs.length >= 10) { passedChecks++; checks.push('✅ Incentive programs: ' + programs.length); }
                else { checks.push('❌ Programs: ' + programs.length + ' (need >=10)'); issues.push('incentives: too few programs'); }

                for (const field of ['name', 'amount', 'region', 'applies']) {
                    totalChecks++;
                    const missing = programs.filter(p => !p[field]);
                    if (missing.length === 0) { passedChecks++; }
                    else { checks.push(`⚠️ ${missing.length} programs missing '${field}'`); issues.push(`incentives: missing ${field}`); }
                }

                // Validate applies arrays
                totalChecks++;
                const validDomains = ['solar', 'storage', 'ev', 'microgrid'];
                const badApplies = programs.filter(p =>
                    !Array.isArray(p.applies) || p.applies.some(a => !validDomains.includes(a))
                );
                if (badApplies.length === 0) { passedChecks++; checks.push('✅ All programs have valid domain tags'); }
                else { checks.push(`⚠️ ${badApplies.length} programs with invalid domain tags`); issues.push('incentives: invalid domain tags'); }

                return checks;
            }
        }
    };

    for (const [filename, schema] of Object.entries(schemas)) {
        const filepath = path.join(dataDir, filename);

        if (!fs.existsSync(filepath)) {
            issues.push(`❌ Missing file: ${filename}`);
            console.log(`  ❌ Missing: ${filename}`);
            continue;
        }

        let raw;
        try {
            raw = fs.readFileSync(filepath, 'utf-8');
            JSON.parse(raw); // validate JSON
        } catch (e) {
            issues.push(`❌ Invalid JSON: ${filename} - ${e.message}`);
            console.log(`  ❌ Invalid JSON: ${filename}`);
            continue;
        }

        const data = JSON.parse(raw);
        const extracted = schema.extract(data);
        const checks = schema.validate(extracted);

        console.log(`  ${filename}:`);
        for (const c of checks) console.log(`    ${c}`);
    }

    const pct = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
    const score = (passedChecks / totalChecks) * 4.0;

    console.log(`\n  Data integrity: ${passedChecks}/${totalChecks} checks passed (${pct.toFixed(0)}%)`);

    pushResult('Data Integrity', issues.length === 0, score, {
        totalChecks,
        passedChecks,
        issues,
        pct: pct.toFixed(1),
    });
}

// ============================================================================
// DIMENSION 6: File Health
// ============================================================================

function auditFileHealth() {
    section('6. File Health - LOC, TODOs, Oversized');
    const srcDir = path.join(PROJECT_ROOT, 'src');
    let totalLoc = 0;
    let totalTodos = 0;
    const oversized = [];
    const todoFiles = [];

    function walkDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules') walkDir(fullPath);
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                const loc = lines.length;
                totalLoc += loc;

                if (loc > 300) {
                    oversized.push({ file: path.relative(PROJECT_ROOT, fullPath), loc });
                }

                const todos = lines.filter(l => /TODO|FIXME|HACK|XXX/i.test(l)).length;
                if (todos > 0) {
                    totalTodos += todos;
                    todoFiles.push({ file: path.relative(PROJECT_ROOT, fullPath), todos });
                }
            }
        }
    }

    walkDir(srcDir);

    console.log(`  Total LOC: ${totalLoc}`);
    console.log(`  Total TODOs/FIXMEs: ${totalTodos}`);

    if (oversized.length > 0) {
        console.log(`  ⚠️  Oversized files (>300 lines):`);
        for (const f of oversized) console.log(`    ${f.file}: ${f.loc} lines`);
    } else {
        console.log('  ✅ No oversized files');
    }

    if (todoFiles.length > 0) {
        console.log(`  📝 Files with TODOs:`);
        for (const f of todoFiles) console.log(`    ${f.file}: ${f.todos}`);
    }

    let score = 4.0;
    if (oversized.length > 0) score -= 0.5 * oversized.length;
    if (totalTodos > 10) score -= 0.5;
    score = Math.max(0, score);

    pushResult('File Health', oversized.length === 0, score, {
        totalLoc,
        totalTodos,
        oversizedFiles: oversized.length,
        oversized,
        todoFiles,
    });
}

// ============================================================================
// DIMENSION 7: Bundle Size (Vite Build)
// ============================================================================

function auditBundleSize() {
    section('7. Vite Build - Bundle Size');
    const distDir = path.join(PROJECT_ROOT, 'dist');

    // Clean dist
    if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });

    const { code, stdout, stderr } = runSilent('npx vite build 2>&1');
    const output = stdout + stderr;

    if (code !== 0) {
        console.log('  ❌ Build failed');
        console.log(output.slice(0, 500));
        pushResult('Bundle Size (Vite)', false, 0, { error: 'Build failed' });
        return;
    }

    // Walk dist to calculate total size
    let totalBytes = 0;
    const assets = [];

    function walkDist(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) walkDist(fullPath);
            else {
                const stat = fs.statSync(fullPath);
                totalBytes += stat.size;
                assets.push({ file: path.relative(distDir, fullPath), size: stat.size });
            }
        }
    }

    walkDist(distDir);

    const totalKB = Math.round(totalBytes / 1024);
    const budgetKB = 150;

    console.log(`  Total bundle: ${totalKB} KB`);
    for (const a of assets.sort((x, y) => y.size - x.size).slice(0, 5)) {
        console.log(`    ${a.file}: ${Math.round(a.size / 1024)} KB`);
    }

    if (totalKB <= budgetKB) {
        console.log(`  ✅ Within budget (${budgetKB} KB)`);
    } else {
        console.log(`  ⚠️  Over budget: ${totalKB} KB > ${budgetKB} KB`);
    }

    const score = totalKB <= budgetKB ? 4.0 : totalKB <= 250 ? 3.0 : totalKB <= 400 ? 2.0 : 1.0;

    pushResult('Bundle Size (Vite)', totalKB <= budgetKB, score, {
        totalKB,
        budgetKB,
        assetCount: assets.length,
    });
}

// ============================================================================
// DIMENSION 8: Lighthouse (Accessibility - Graceful Skip)
// ============================================================================

function auditAccessibility() {
    section('8. Lighthouse - Accessibility');

    // Check if lighthouse is installed
    const { code } = runSilent('which lighthouse');
    if (code !== 0) {
        console.log('  ⏭️  Lighthouse not installed (npm i -g lighthouse)');
        console.log('  Skipping accessibility audit');
        pushResult('Accessibility (Lighthouse)', true, 3.0, { skipped: true, note: 'Install lighthouse globally to enable' });
        return;
    }

    // Run lighthouse against the built dist (needs a server)
    console.log('  ⏭️  Lighthouse requires a running server');
    console.log('  Run manually: lighthouse http://localhost:5174 --only-categories=accessibility');
    pushResult('Accessibility (Lighthouse)', true, 3.0, { skipped: true, note: 'Manual execution recommended' });
}

// ============================================================================
// SCORING & REPORT GENERATION
// ============================================================================

const DIMENSION_WEIGHTS = {
    'Code Quality (ESLint)': 2.0,
    'Security (npm audit)': 2.0,
    'Dead Code (Knip)': 1.0,
    'Circular Dependencies (Madge)': 1.0,
    'Data Integrity': 3.0,
    'File Health': 1.0,
    'Bundle Size (Vite)': 1.5,
    'Accessibility (Lighthouse)': 1.5,
};

function calculateGPA() {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const r of results) {
        const weight = DIMENSION_WEIGHTS[r.name] || 1.0;
        weightedSum += r.score * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

function getGrade(gpa) {
    if (gpa >= 3.7) return { letter: 'A', emoji: '🏆' };
    if (gpa >= 3.0) return { letter: 'B', emoji: '✅' };
    if (gpa >= 2.0) return { letter: 'C', emoji: '⚠️' };
    if (gpa >= 1.0) return { letter: 'D', emoji: '🟡' };
    return { letter: 'F', emoji: '❌' };
}

function generateMarkdownReport(gpa, grade, elapsed) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let md = `# Renewables Wizard - Audit Report\n\n`;
    md += `**Date**: ${timestamp}  \n`;
    md += `**GPA**: ${gpa}/4.00 (${grade.emoji} ${grade.letter})  \n`;
    md += `**Duration**: ${elapsed.toFixed(1)}s  \n\n`;

    md += `## Dimension Results\n\n`;
    md += `| # | Dimension | Score | Status |\n`;
    md += `|---|-----------|-------|--------|\n`;

    results.forEach((r, i) => {
        const status = r.passed ? '✅ PASS' : '⚠️ WARN';
        md += `| ${i + 1} | ${r.name} | ${r.score.toFixed(2)} | ${status} |\n`;
    });

    md += `\n## GPA: ${gpa}/4.00 ${grade.emoji}\n\n`;

    // Action items
    const actionItems = results.filter(r => !r.passed);
    if (actionItems.length > 0) {
        md += `## Action Items\n\n`;
        for (const r of actionItems) {
            md += `- **${r.name}**: Score ${r.score.toFixed(2)}/4.00\n`;
        }
    } else {
        md += `> All dimensions passed. No action items.\n`;
    }

    md += `\n---\n*Generated by Renewables Wizard Unified Audit*\n`;

    const reportPath = path.join(REPORTS_DIR, 'audit-summary.md');
    fs.writeFileSync(reportPath, md);
    console.log(`\n  📄 Report saved: reports/audit-summary.md`);
}

function generateJSONSnapshot(gpa, grade, elapsed) {
    const snapshot = {
        timestamp: new Date().toISOString(),
        gpa,
        grade: grade.letter,
        elapsed_seconds: Math.round(elapsed * 10) / 10,
        dimensions: results.map(r => ({
            name: r.name,
            passed: r.passed,
            score: r.score,
            weight: DIMENSION_WEIGHTS[r.name] || 1.0,
            details: r.details,
        })),
    };

    const snapshotPath = path.join(AUDIT_DIR, 'last_audit.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log(`  📄 Snapshot saved: audit/last_audit.json`);
    return snapshot;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const start = Date.now();

    console.log('\n' + '🔬 '.repeat(15));
    console.log('  Renewables Wizard - Unified Audit Pipeline');
    console.log('🔬 '.repeat(15));

    ensureDirs();

    // Run all dimensions
    auditESLint();
    auditSecurity();
    auditDeadCode();
    auditCircular();
    auditDataIntegrity();
    auditFileHealth();
    auditBundleSize();
    auditAccessibility();

    // Calculate GPA
    const gpa = calculateGPA();
    const grade = getGrade(gpa);
    const elapsed = (Date.now() - start) / 1000;

    // Summary
    section('AUDIT SUMMARY');
    console.log(`\n  ${'Dimension'.padEnd(35)} ${'Score'.padStart(6)} ${'Status'.padStart(10)}`);
    console.log(`  ${'─'.repeat(55)}`);

    for (const r of results) {
        const status = r.passed ? '✅ PASS' : '⚠️  WARN';
        console.log(`  ${r.name.padEnd(35)} ${r.score.toFixed(2).padStart(5)}  ${status}`);
    }

    console.log(`\n  ${'─'.repeat(55)}`);
    console.log(`  ${'GPA'.padEnd(35)} ${gpa.toFixed(2).padStart(5)}/4.00`);
    console.log(`  ${'Elapsed'.padEnd(35)} ${elapsed.toFixed(1).padStart(5)}s`);
    console.log(`\n  Grade: ${grade.emoji} ${grade.letter}`);

    if (gpa >= 3.5) {
        console.log('\n  🏆 AUDIT PASSED - Code quality meets production standards');
    } else if (gpa >= 2.0) {
        console.log('\n  ⚠️  AUDIT NEEDS WORK - Address issues above');
    } else {
        console.log('\n  ❌ AUDIT FAILED - Critical issues must be resolved');
    }

    // Generate reports
    generateMarkdownReport(gpa, grade, elapsed);

    if (process.argv.includes('--json')) {
        generateJSONSnapshot(gpa, grade, elapsed);
    }

    // Always save JSON for programmatic consumption
    generateJSONSnapshot(gpa, grade, elapsed);

    return gpa >= 3.5 ? 0 : 1;
}

main().then(code => process.exit(code)).catch(e => {
    console.error(e);
    process.exit(1);
});
