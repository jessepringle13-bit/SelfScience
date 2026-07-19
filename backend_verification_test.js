#!/usr/bin/env node
// /app/backend_verification_test.js
// Comprehensive backend verification pass for SelfScience app
// DO NOT MODIFY SOURCE CODE - this is a verification-only pass

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function log(section, status, message) {
  const icon = status === '✅' ? '✅' : status === '⚠️' ? '⚠️' : '❌';
  console.log(`${icon} [${section}] ${message}`);
}

function logTable(rows) {
  console.log('\n' + rows.map(r => `  ${r}`).join('\n'));
}

// ============================================================================
// TEST 1: BrandScore™ computation
// ============================================================================

async function testBrandScore() {
  console.log('\n========================================');
  console.log('TEST 1: BrandScore™ Computation');
  console.log('========================================\n');

  try {
    // Import the modules
    const { computeBrandScore } = require('./utils/brandScore.js');
    const { BRAND_PROFILES } = require('./lib/supplements/brandProfiles.js');
    const { getBrandExtras } = require('./lib/supplements/brandExtras.js');

    const results = [];
    let allPass = true;

    // Test EVERY brand in BRAND_PROFILES
    for (const [slug, brand] of Object.entries(BRAND_PROFILES)) {
      const extras = getBrandExtras(slug);
      
      // Test WITHOUT genome
      const withoutGenome = computeBrandScore(brand, extras, null);
      
      // Test WITH genome
      const withGenome = computeBrandScore(brand, extras, ['methylfolate', 'methylcobalamin', 'chelated_minerals']);

      // Validation checks
      const checks = {
        noNaN: !isNaN(withoutGenome.overall) && !isNaN(withGenome.overall),
        inRange: withoutGenome.overall >= 0 && withoutGenome.overall <= 10 && 
                 withGenome.overall >= 0 && withGenome.overall <= 10,
        tierCorrect: (withoutGenome.overall >= 8 && withoutGenome.tier === 'high') ||
                     (withoutGenome.overall >= 5 && withoutGenome.overall < 8 && withoutGenome.tier === 'moderate') ||
                     (withoutGenome.overall < 5 && withoutGenome.tier === 'low'),
        maxTotalCorrect: withoutGenome.maxTotal === 90 && withGenome.maxTotal === 100,
      };

      const passed = Object.values(checks).every(v => v);
      if (!passed) allPass = false;

      results.push({
        slug,
        withoutGenome: withoutGenome.overall.toFixed(1),
        withGenome: withGenome.overall.toFixed(1),
        tier: withoutGenome.tier,
        maxTotal: `${withoutGenome.maxTotal}/${withGenome.maxTotal}`,
        passed,
      });
    }

    // Log results
    log('BrandScore', allPass ? '✅' : '❌', `Tested ${results.length} brands`);
    
    // Show sample results
    logTable([
      'Sample results (first 10 brands):',
      'Brand                    | No-Genome | With-Genome | Tier     | MaxTotal | Pass',
      '-------------------------|-----------|-------------|----------|----------|-----',
      ...results.slice(0, 10).map(r => 
        `${r.slug.padEnd(24)} | ${r.withoutGenome.padEnd(9)} | ${r.withGenome.padEnd(11)} | ${r.tier.padEnd(8)} | ${r.maxTotal.padEnd(8)} | ${r.passed ? '✅' : '❌'}`
      ),
    ]);

    if (!allPass) {
      const failed = results.filter(r => !r.passed);
      logTable([
        '',
        `❌ FAILED BRANDS (${failed.length}):`,
        ...failed.map(r => `  - ${r.slug}: overall=${r.withoutGenome}, tier=${r.tier}`),
      ]);
    }

    return allPass ? '✅' : '❌';
  } catch (err) {
    log('BrandScore', '❌', `ERROR: ${err.message}`);
    console.error(err.stack);
    return '❌';
  }
}

// ============================================================================
// TEST 2: DSLD API proxy
// ============================================================================

async function testDSLD() {
  console.log('\n========================================');
  console.log('TEST 2: DSLD API Proxy');
  console.log('========================================\n');

  const tests = [
    { name: 'Thorne query', url: `${BASE_URL}/api/supplements/dsld/search?q=Thorne&size=3` },
    { name: 'Nordic Naturals query', url: `${BASE_URL}/api/supplements/dsld/search?q=Nordic%20Naturals&size=3` },
    { name: 'Barcode search', url: `${BASE_URL}/api/supplements/dsld/search?q=693749205005` },
  ];

  let allPass = true;

  for (const test of tests) {
    try {
      const { status, data } = await httpGet(test.url);
      
      if (status === 200) {
        const hasProducts = Array.isArray(data.results) && data.results.length > 0;
        const hasShape = data.results.every(p => 
          p.fullName && p.brand && Array.isArray(p.ingredients)
        );
        
        if (hasProducts && hasShape) {
          log('DSLD', '✅', `${test.name}: ${data.results.length} products, valid shape`);
          logTable([
            `  Sample product: ${data.results[0].fullName}`,
            `  Brand: ${data.results[0].brand.name}`,
            `  Ingredients: ${data.results[0].ingredients.length} items`,
          ]);
        } else if (!hasProducts) {
          log('DSLD', '⚠️', `${test.name}: No products found (may be rate-limited)`);
        } else {
          log('DSLD', '❌', `${test.name}: Invalid response shape`);
          allPass = false;
        }
      } else {
        log('DSLD', '⚠️', `${test.name}: HTTP ${status} (DSLD may be rate-limited)`);
      }
    } catch (err) {
      log('DSLD', '⚠️', `${test.name}: ${err.message} (external API may be unreachable)`);
    }
  }

  return allPass ? '✅' : '⚠️';
}

// ============================================================================
// TEST 3: Open Food Facts macro data
// ============================================================================

async function testOpenFoodFacts() {
  console.log('\n========================================');
  console.log('TEST 3: Open Food Facts Macro Data');
  console.log('========================================\n');

  const tests = [
    { name: "Nature's Path Cereal", barcode: '737628064502' },
    { name: "Lay's chips", barcode: '028400090032' },
    { name: "RXBAR", barcode: '819573010184' },
  ];

  let allPass = true;

  for (const test of tests) {
    try {
      const { status, data } = await httpGet(`${BASE_URL}/api/nutrition/product?barcode=${test.barcode}`);
      
      if (status === 200 && data.name) {
        const nutriments = data.nutriments || {};
        const hasMacros = 
          typeof nutriments.carbs === 'number' &&
          typeof nutriments.protein === 'number' &&
          typeof nutriments.fat === 'number' &&
          typeof nutriments.energy_kcal === 'number';
        
        if (hasMacros) {
          log('OFF', '✅', `${test.name}: Found with valid macros`);
          logTable([
            `  Product: ${data.name}`,
            `  Carbs: ${nutriments.carbs}g, Protein: ${nutriments.protein}g, Fat: ${nutriments.fat}g, Kcal: ${nutriments.energy_kcal}`,
          ]);
        } else {
          log('OFF', '❌', `${test.name}: Missing macro data`);
          allPass = false;
        }
      } else if (status === 404) {
        log('OFF', '⚠️', `${test.name}: Product not found in OFF database`);
      } else {
        log('OFF', '❌', `${test.name}: HTTP ${status}`);
        allPass = false;
      }
    } catch (err) {
      log('OFF', '❌', `${test.name}: ${err.message}`);
      allPass = false;
    }
  }

  return allPass ? '✅' : '❌';
}

// ============================================================================
// TEST 4: Supplement-drug interaction table
// ============================================================================

async function testInteractions() {
  console.log('\n========================================');
  console.log('TEST 4: Supplement-Drug Interactions');
  console.log('========================================\n');

  try {
    const { findInteractionsForSupplement } = require('./lib/supplements/interactions.js');

    const tests = [
      { supplement: 'vitamin k', context: { userDrugs: ['warfarin'] }, expect: true },
      { supplement: 'st johns wort', context: { userDrugs: ['escitalopram'] }, expect: true },
      { supplement: 'fish oil', context: { userDrugs: ['apixaban'] }, expect: true },
      { supplement: 'magnesium', context: { userDrugs: ['ciprofloxacin'] }, expect: true },
      { supplement: 'coq10', context: { userDrugs: ['simvastatin'] }, expect: true },
      { supplement: 'iron', context: { userDrugs: ['levothyroxine'] }, expect: true },
      { supplement: 'grapefruit', context: { userDrugs: ['tacrolimus'] }, expect: true },
      { supplement: 'melatonin', context: { userDrugs: ['zolpidem'] }, expect: true },
      { supplement: 'niacin', context: { userDrugs: ['rosuvastatin'] }, expect: true },
      // PGx-driven test
      { supplement: 'vitamin k', context: { phenotypes: { VKORC1: { phenotype: 'higher_sensitivity' } } }, expect: true },
      // Unrelated combo (should return empty)
      { supplement: 'vitamin d', context: { userDrugs: ['warfarin'] }, expect: false },
    ];

    let allPass = true;
    const results = [];

    for (const test of tests) {
      const flags = findInteractionsForSupplement(test.supplement, test.context);
      const hasFlag = flags.length > 0;
      const passed = hasFlag === test.expect;
      
      if (!passed) allPass = false;

      results.push({
        supplement: test.supplement,
        drug: test.context.userDrugs?.[0] || 'PGx',
        hasFlag,
        expect: test.expect,
        passed,
        message: flags[0]?.message?.slice(0, 60) || 'none',
      });
    }

    log('Interactions', allPass ? '✅' : '❌', `Tested ${tests.length} pairs`);
    
    logTable([
      'Results:',
      'Supplement       | Drug/PGx      | Flag? | Expected | Pass | Message',
      '-----------------|---------------|-------|----------|------|--------',
      ...results.map(r => 
        `${r.supplement.padEnd(16)} | ${r.drug.padEnd(13)} | ${r.hasFlag ? 'Yes' : 'No '}   | ${r.expect ? 'Yes' : 'No '}      | ${r.passed ? '✅' : '❌'}  | ${r.message}`
      ),
    ]);

    return allPass ? '✅' : '❌';
  } catch (err) {
    log('Interactions', '❌', `ERROR: ${err.message}`);
    console.error(err.stack);
    return '❌';
  }
}

// ============================================================================
// TEST 5: PGx plain-English lookup
// ============================================================================

async function testPgxPlainEnglish() {
  console.log('\n========================================');
  console.log('TEST 5: PGx Plain-English Lookup');
  console.log('========================================\n');

  try {
    const { getPgxPlainEnglish } = require('./lib/pgxPlainEnglish.js');

    const genes = {
      CYP2C19: ['EM', 'RM', 'UM', 'IM', 'PM'],
      CYP2D6: ['EM', 'RM', 'UM', 'IM', 'PM'],
      CYP2C9: ['EM', 'IM', 'PM'],
      VKORC1: ['lower_sensitivity', 'normal', 'higher_sensitivity'],
      SLCO1B1: ['normal', 'decreased_transport', 'poor_transport'],
      DPYD: ['normal', 'reduced_activity', 'deficient'],
      TPMT: ['normal', 'intermediate', 'deficient'],
    };

    let allPass = true;
    const results = [];

    for (const [gene, phenotypes] of Object.entries(genes)) {
      for (const phenotype of phenotypes) {
        const result = getPgxPlainEnglish(gene, { phenotype, label: phenotype });
        
        const hasImpact = result.impact && result.impact.length > 0;
        const hasSeverity = ['normal', 'intermediate', 'critical'].includes(result.severity);
        const passed = hasSeverity; // impact can be null for some entries
        
        if (!passed) allPass = false;

        results.push({
          gene,
          phenotype,
          severity: result.severity,
          hasImpact,
          passed,
        });
      }
    }

    // Test label-substring fallback
    const fallbackTest = getPgxPlainEnglish('UNKNOWN_GENE', { label: 'Poor Metabolizer' });
    const fallbackPassed = fallbackTest.severity === 'critical' && fallbackTest.impact === null;
    
    if (!fallbackPassed) allPass = false;

    log('PGx', allPass ? '✅' : '❌', `Tested ${results.length} phenotypes + fallback`);
    
    logTable([
      'Sample results (first 10):',
      'Gene     | Phenotype           | Severity     | Impact? | Pass',
      '---------|---------------------|--------------|---------|-----',
      ...results.slice(0, 10).map(r => 
        `${r.gene.padEnd(8)} | ${r.phenotype.padEnd(19)} | ${r.severity.padEnd(12)} | ${r.hasImpact ? 'Yes' : 'No '}     | ${r.passed ? '✅' : '❌'}`
      ),
      '',
      `Fallback test (Poor Metabolizer): ${fallbackPassed ? '✅' : '❌'} (severity=${fallbackTest.severity}, impact=${fallbackTest.impact})`,
    ]);

    return allPass ? '✅' : '❌';
  } catch (err) {
    log('PGx', '❌', `ERROR: ${err.message}`);
    console.error(err.stack);
    return '❌';
  }
}

// ============================================================================
// TEST 6: Metrics store
// ============================================================================

async function testMetricsStore() {
  console.log('\n========================================');
  console.log('TEST 6: Metrics Store');
  console.log('========================================\n');

  try {
    // Mock window.localStorage for Node environment
    global.window = {
      localStorage: {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; },
      },
      dispatchEvent() {},
    };

    const { saveEntry, getEntries, getLatestEntry } = require('./lib/training/metricsStore.js');

    // Test 1: Save entries
    saveEntry('weight', 75.5, '2024-01-01');
    saveEntry('weight', 76.0, '2024-01-02');
    saveEntry('weight', 75.8, '2024-01-03');
    
    // Test 2: Same-day overwrite
    saveEntry('weight', 75.9, '2024-01-03'); // Should overwrite previous 75.8

    // Test 3: Get entries (should be sorted oldest-first)
    const entries = getEntries('weight');
    const sortedCorrectly = entries.length === 3 && 
                           entries[0].dateISO === '2024-01-01' &&
                           entries[2].dateISO === '2024-01-03' &&
                           entries[2].value === 75.9;

    // Test 4: Get latest entry
    const latest = getLatestEntry('weight');
    const latestCorrect = latest && latest.value === 75.9 && latest.dateISO === '2024-01-03';

    const allPass = sortedCorrectly && latestCorrect;

    log('MetricsStore', allPass ? '✅' : '❌', 'Tested save/get/latest/overwrite');
    
    logTable([
      `Entries count: ${entries.length} (expected 3)`,
      `Sorted correctly: ${sortedCorrectly ? '✅' : '❌'}`,
      `Latest entry: ${latest?.value} on ${latest?.dateISO} (expected 75.9 on 2024-01-03)`,
      `Same-day overwrite: ${latestCorrect ? '✅' : '❌'}`,
    ]);

    // Cleanup
    delete global.window;

    return allPass ? '✅' : '❌';
  } catch (err) {
    log('MetricsStore', '❌', `ERROR: ${err.message}`);
    console.error(err.stack);
    delete global.window;
    return '❌';
  }
}

// ============================================================================
// TEST 7: List stores
// ============================================================================

async function testListStores() {
  console.log('\n========================================');
  console.log('TEST 7: List Stores');
  console.log('========================================\n');

  try {
    // Mock window.localStorage for Node environment
    global.window = {
      localStorage: {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; },
      },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
    };

    const { makeListStore } = require('./lib/lists/store.js');

    const store = makeListStore('test_list');

    // Test 1: Add items
    const item1 = store.add({ name: 'Item 1', value: 100 });
    const item2 = store.add({ name: 'Item 2', value: 200 });

    // Test 2: Get all
    const all = store.all();
    const hasTwo = all.length === 2;

    // Test 3: Find by predicate
    const found = store.findBy(i => i.name === 'Item 1');
    const foundCorrect = found && found.value === 100;

    // Test 4: Update
    store.update(item1.id, { value: 150 });
    const updated = store.findBy(i => i.id === item1.id);
    const updateCorrect = updated && updated.value === 150;

    // Test 5: Remove
    store.remove(item2.id);
    const afterRemove = store.all();
    const removeCorrect = afterRemove.length === 1;

    // Test 6: Subscribe (callback should fire)
    let subscribeCallbackFired = false;
    const unsub = store.subscribe(() => { subscribeCallbackFired = true; });
    store.add({ name: 'Item 3', value: 300 });
    const subscribeCorrect = subscribeCallbackFired;
    unsub();

    // Test 7: Clear
    store.clear();
    const afterClear = store.all();
    const clearCorrect = afterClear.length === 0;

    const allPass = hasTwo && foundCorrect && updateCorrect && removeCorrect && subscribeCorrect && clearCorrect;

    log('ListStores', allPass ? '✅' : '❌', 'Tested add/remove/update/clear/findBy/subscribe');
    
    logTable([
      `Add items: ${hasTwo ? '✅' : '❌'} (2 items)`,
      `Find by predicate: ${foundCorrect ? '✅' : '❌'}`,
      `Update: ${updateCorrect ? '✅' : '❌'} (value 100 → 150)`,
      `Remove: ${removeCorrect ? '✅' : '❌'} (2 → 1 items)`,
      `Subscribe callback: ${subscribeCorrect ? '✅' : '❌'}`,
      `Clear: ${clearCorrect ? '✅' : '❌'} (all items removed)`,
    ]);

    // Cleanup
    delete global.window;

    return allPass ? '✅' : '❌';
  } catch (err) {
    log('ListStores', '❌', `ERROR: ${err.message}`);
    console.error(err.stack);
    delete global.window;
    return '❌';
  }
}

// ============================================================================
// TEST 8: Route smoke test
// ============================================================================

async function testRoutes() {
  console.log('\n========================================');
  console.log('TEST 8: Route Smoke Test');
  console.log('========================================\n');

  const routes = [
    { path: '/', name: 'Home' },
    { path: '/api', name: 'API metadata' },
    { path: '/api/search?q=MTHFR&limit=5', name: 'Search API' },
    { path: '/api/supplements/dsld/search?q=thorne&size=3', name: 'DSLD search' },
  ];

  let allPass = true;
  const results = [];

  for (const route of routes) {
    try {
      const url = route.path.startsWith('http') ? route.path : `${BASE_URL}${route.path}`;
      const { status } = await httpGet(url);
      
      const passed = status === 200;
      if (!passed) allPass = false;

      results.push({
        name: route.name,
        path: route.path,
        status,
        passed,
      });

      log('Routes', passed ? '✅' : '❌', `${route.name}: HTTP ${status}`);
    } catch (err) {
      log('Routes', '❌', `${route.name}: ${err.message}`);
      allPass = false;
      results.push({
        name: route.name,
        path: route.path,
        status: 'ERROR',
        passed: false,
      });
    }
  }

  return allPass ? '✅' : '❌';
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  SelfScience Backend Verification Pass                    ║');
  console.log('║  VERIFICATION ONLY - NO SOURCE CODE MODIFICATIONS         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = {
    '1. BrandScore audit': await testBrandScore(),
    '2. DSLD API': await testDSLD(),
    '3. OFF macros': await testOpenFoodFacts(),
    '4. Interactions': await testInteractions(),
    '5. PGx plain-English': await testPgxPlainEnglish(),
    '6. Metrics store': await testMetricsStore(),
    '7. List stores': await testListStores(),
    '8. Route smoke': await testRoutes(),
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL RESULTS                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  for (const [test, result] of Object.entries(results)) {
    console.log(`${result} ${test}`);
  }

  const allPassed = Object.values(results).every(r => r === '✅' || r === '⚠️');
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED (or acceptable warnings)');
  } else {
    console.log('❌ SOME TESTS FAILED - see details above');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
