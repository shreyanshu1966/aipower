/**
 * AIpower Kuwait — Post-Processor
 * - Fixes product names (extracted from URL slug)
 * - Splits description into clean name + spec block
 * - Parses spec key-value pairs into structured objects
 * - Outputs: cleaned JSON + flat CSV for both languages
 *
 * Usage: node postprocess.js
 */

const fs   = require('fs');
const path = require('path');

const OUTPUT_DIR = './output';

// ─── UTILITIES ─────────────────────────────────────────────────────────────────

/**
 * Convert URL slug → clean product name
 * e.g. "mq12500-oi-remote-control-inverter-generator-8000-max-starting-watts"
 *   →  "MQ12500-OI Remote Control Inverter Generator 8000 Max Starting Watts"
 */
function slugToName(href) {
  const m = href.match(/\/product\/\d+-(.+?)(?:\?|$)/);
  if (!m) return '';
  return m[1]
    .split('-')
    .map((word) => {
      // Keep all-uppercase tokens (like OI, HP, etc.) and numbers intact
      if (/^\d+$/.test(word)) return word;
      if (word.length <= 3 && word === word.toUpperCase()) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Spec patterns found across AIpower product descriptions.
 * Each returns { key, value } from a captured group.
 */
// Stop value capture at the next " :- " label (lookahead) or at 60 chars max
const STOP = '(?=\\s+[A-Z][^:-]{2,25}\\s*:-|$)';

const SPEC_PATTERNS = [
  { key: 'model_number',         re: /Model Number\s*:-\s*([A-Z0-9 .-]+?)(?=\s+(?:Max|Rated|Volts)|$)/i },
  { key: 'rated_watts',          re: /Rated Watts\s*:-\s*(\d+[kKwW]+)/i },
  { key: 'max_starting_watts',   re: /Max\.?\s*Starting Watts\s*:-\s*(\d+[kKwW]+)/i },
  { key: 'volts',                re: /Volts\s*:-\s*([\d/V]+)/i },
  { key: 'phase_frequency',      re: /Phase,?\s*Frequency\s*:-\s*(Single|Three|Dual)/i },
  { key: 'starting_method',      re: /Starting Method\s*:-\s*(Electrical|Manual|Recoil)/i },
  { key: 'horse_power_hp',       re: /Horse Power\s*\(HP\)\s*:-\s*([\d.]+\s*HP)/i },
  { key: 'fuel_tank_capacity',   re: /Fuel Tank Capacity\s*:-\s*([\d.]+L)/i },
  { key: 'engine_oil_capacity',  re: /Engine Oil Capacity\s*:-\s*([\d.]+L)/i },
  { key: 'noise_level',          re: /Noise Level\s*:-\s*([\d.]+\s*dBA[^S]*?)(?=\s+Socket|$)/i },
  { key: 'socket',               re: /Socket\s*:-\s*([\dX ,A]+?)(?=\s+(?:Net Weight|Digital|$))/i },
  { key: 'net_weight',           re: /Net Weight\s*:-\s*(\d+\s*KG)/i },
  { key: 'dimension',            re: /Dimension\s*:-\s*([\dXxmm ]+)/i },
  { key: 'digital_display',      re: /Digital Display\s*:-\s*([^]+?)(?=\s+Net Weight|$)/i },

  // Generators — fuel type
  { key: 'fuel_type',            re: /\b(Gasoline|Diesel|Inverter)\s+Generator\b/i },

  // Voltage / power
  { key: 'voltage',              re: /Voltage\s*[:-]+\s*([\d~VHz\-/. ]+?)(?=\s+(?:Rated|Input|Carbon|Copper|$))/i },
  { key: 'input_power_w',        re: /Input power\s*[:-]+\s*(\d+W)/i },
  { key: 'rated_power_w',        re: /Rated power\s*[:-]+\s*(\d+[Ww]+(?:\([\d.]+HP\))?)/i },

  // Compressor / washer
  { key: 'max_pressure_bar',     re: /Max\.?\s*Pressure\s*[:-]+\s*(\d+\s*(?:Bar|bar|PSI|psi|BAR))/i },
  { key: 'flow_rate',            re: /(?:Max\.?\s*)?[Ff]low\s*(?:rate|Rate)\s*[:-]+\s*([\d./]+\s*L\/min)/i },
  { key: 'max_head_m',           re: /Max\.?\s*head\s*[:-]+\s*(\d+\s*m)/i },
  { key: 'pipe_diameter',        re: /Pipe diameter\s*[:-]+\s*([^P\n,]{1,30}?)(?=\s+(?:Copper|Packed|$))/i },

  // Engine pump
  { key: 'engine_power_hp',      re: /Engine Power\s*[:-]+\s*([\d.]+\s*HP)/i },
  { key: 'displacement_cc',      re: /Displacement\s*[:-]+\s*(\d+\s*cc)/i },
  { key: 'suction_head_m',       re: /(?:Max\.?\s*)?[Ss]uction\s*[:-]+\s*(\d+\s*m)/i },

  // Welding
  { key: 'welding_current_a',    re: /Welding Current\s*[:-]+\s*(\d+\s*A(?:mps?)?)/i },
  { key: 'duty_cycle_pct',       re: /Duty Cycle\s*[:-]+\s*([\d%@ ]+)/i },
  { key: 'open_circuit_voltage', re: /Open Circuit Voltage\s*[:-]+\s*([\dV ]+)/i },
  { key: 'electrode_diameter',   re: /Electrode Diameter\s*[:-]+\s*([^P\n,]{1,20})/i },
];

function parseSpecs(description) {
  const specs = {};
  for (const { key, re } of SPEC_PATTERNS) {
    const m = description.match(re);
    if (m && !specs[key]) {
      specs[key] = m[1].trim().replace(/\s+/g, ' ');
    }
  }
  return Object.keys(specs).length ? specs : null;
}

/**
 * Given the raw product from the scraper, return a cleaned version.
 */
function cleanProduct(raw) {
  // Extract clean name from URL slug (most reliable source)
  const cleanName = slugToName(raw.url);

  // Strip name prefix from description if it was appended
  let description = raw.description || '';
  if (cleanName && description.startsWith(cleanName)) {
    description = description.slice(cleanName.length).trim();
  }

  // Further strip any repeated product-name text at start of description
  // (happens when listing card repeats the title then specs)
  const specs = parseSpecs(description);

  return {
    id:              raw.id,
    name:            cleanName || raw.name,
    url:             raw.url.startsWith('http') ? raw.url : `https://aipowerkw.com${raw.url}`,
    categoryId:      raw.categoryId,
    categorySlug:    raw.categorySlug,
    categoryName:    raw.categoryName,
    price:           raw.price,
    originalPrice:   raw.originalPrice,
    currency:        raw.currency,
    stockStatus:     raw.stockStatus,
    preparationTime: raw.preparationTime,
    specifications:  specs,
    description:     description.trim(),
  };
}

// ─── CSV GENERATOR ─────────────────────────────────────────────────────────────

const CSV_COLS = [
  'id', 'name', 'categoryName', 'price', 'currency',
  'originalPrice', 'stockStatus', 'preparationTime',
  'specifications', 'url',
];

function toCSVRow(product) {
  return CSV_COLS.map((col) => {
    let val = product[col];
    if (val === null || val === undefined) val = '';
    if (typeof val === 'object') val = JSON.stringify(val);
    val = String(val).replace(/"/g, '""');
    return `"${val}"`;
  }).join(',');
}

function buildCSV(products) {
  const header = CSV_COLS.join(',');
  const rows   = products.map(toCSVRow);
  return [header, ...rows].join('\n');
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

function processFile(filename) {
  const filePath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ File not found: ${filePath}`);
    return;
  }

  const raw     = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const lang    = raw.language || filename.replace('products_', '').replace('.json', '');
  const allClean = [];

  const cleaned = {
    language:      raw.language,
    scrapedAt:     raw.scrapedAt,
    processedAt:   new Date().toISOString(),
    totalProducts: raw.totalProducts,
    categories:    raw.categories.map((cat) => {
      const cleanedProducts = cat.products.map(cleanProduct);
      allClean.push(...cleanedProducts);
      return { ...cat, products: cleanedProducts };
    }),
  };

  // Write cleaned JSON
  const cleanedJsonPath = path.join(OUTPUT_DIR, `products_${lang}_clean.json`);
  fs.writeFileSync(cleanedJsonPath, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`  ✅ Cleaned JSON → ${cleanedJsonPath}`);

  // Write flat CSV
  const csvPath = path.join(OUTPUT_DIR, `products_${lang}.csv`);
  fs.writeFileSync(csvPath, buildCSV(allClean), 'utf-8');
  console.log(`  ✅ CSV          → ${csvPath}  (${allClean.length} rows)`);

  return cleaned;
}

console.log('\n🔧  AIpower Kuwait — Post-Processor\n');

const enData = processFile('products_en.json');
const arData = processFile('products_ar.json');

// ─── BILINGUAL MERGED CLEAN ────────────────────────────────────────────────────
if (enData && arData) {
  const allEnProducts = enData.categories.flatMap((c) => c.products);
  const allArProducts = arData.categories.flatMap((c) => c.products);

  const mergedCategories = enData.categories.map((enCat) => {
    const arCat = arData.categories.find((c) => c.id === enCat.id);
    return {
      id:           enCat.id,
      slug:         enCat.slug,
      name_en:      enCat.name,
      name_ar:      arCat ? arCat.name : '',
      productCount: enCat.productCount,
      products:     enCat.products.map((enP) => {
        const arP = allArProducts.find((p) => p.id === enP.id);
        return {
          id:              enP.id,
          name_en:         enP.name,
          name_ar:         arP ? arP.name : enP.name,
          url_en:          enP.url,
          url_ar:          arP ? arP.url : enP.url.replace('/en/', '/ar/'),
          categoryId:      enP.categoryId,
          categorySlug:    enP.categorySlug,
          categoryName_en: enP.categoryName,
          categoryName_ar: arCat ? arCat.name : '',
          price:           enP.price,
          originalPrice:   enP.originalPrice,
          currency:        'KWD',
          stockStatus:     enP.stockStatus,
          preparationTime: enP.preparationTime,
          specifications:  enP.specifications,
          description_en:  enP.description,
          description_ar:  arP ? arP.description : '',
        };
      }),
    };
  });

  const bilingual = {
    scrapedAt:     enData.scrapedAt,
    processedAt:   new Date().toISOString(),
    totalProducts: enData.totalProducts,
    categories:    mergedCategories,
  };

  const biPath = path.join(OUTPUT_DIR, 'products_bilingual_clean.json');
  fs.writeFileSync(biPath, JSON.stringify(bilingual, null, 2), 'utf-8');
  console.log(`  ✅ Bilingual    → ${biPath}`);

  // Bilingual CSV
  const biProducts = mergedCategories.flatMap((c) => c.products);
  const biCsvCols  = [
    'id','name_en','name_ar','categoryName_en','categoryName_ar',
    'price','currency','stockStatus','preparationTime',
    'specifications','url_en','url_ar'
  ];
  const biCsv = [
    biCsvCols.join(','),
    ...biProducts.map((p) =>
      biCsvCols.map((col) => {
        let v = p[col];
        if (v === null || v === undefined) v = '';
        if (typeof v === 'object') v = JSON.stringify(v);
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const biCsvPath = path.join(OUTPUT_DIR, 'products_bilingual.csv');
  fs.writeFileSync(biCsvPath, biCsv, 'utf-8');
  console.log(`  ✅ Bilingual CSV→ ${biCsvPath}  (${biProducts.length} rows)`);
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
if (enData) {
  console.log('\n📊  CATEGORY SUMMARY (English)');
  console.log('─'.repeat(55));
  console.log(`  ${'Category'.padEnd(20)} ${'Products'.padStart(10)}`);
  console.log('─'.repeat(55));
  for (const cat of enData.categories) {
    console.log(`  ${cat.name.padEnd(20)} ${String(cat.productCount).padStart(10)}`);
  }
  console.log('─'.repeat(55));
  console.log(`  ${'TOTAL'.padEnd(20)} ${String(enData.totalProducts).padStart(10)}`);
  console.log('─'.repeat(55));
}

console.log('\n🎉  Post-processing complete!\n');
