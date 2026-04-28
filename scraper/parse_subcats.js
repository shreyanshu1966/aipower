/**
 * Extract sub-category info from the Next.js __next_f JSON payload
 * embedded in the Generator category page HTML.
 * Products already carry subCategoryId — now we need the sub-cat name map.
 */
const axios = require('axios');
const fs    = require('fs');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0',
};

const MAIN_CATEGORIES = [
  { id: 3,  slug: 'generator' },
  { id: 6,  slug: 'air-compressor' },
  { id: 9,  slug: 'welding-machine' },
  { id: 36, slug: 'tools' },
  { id: 39, slug: 'accessories' },
  { id: 42, slug: 'water-pumps' },
  { id: 45, slug: 'cleaning' },
];

/** Extract all JSON objects from __next_f.push([1, "..."]) calls */
function extractNextData(html) {
  const chunks = [];
  const re = /__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      // The string inside is JSON-escaped — unescape it
      const raw = m[1]
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
      chunks.push(raw);
    } catch (e) { /* skip */ }
  }
  return chunks.join('\n');
}

async function scrapeCategory(cat, lang = 'en') {
  const url = `https://aipowerkw.com/${lang}/category/${cat.id}-${cat.slug}`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 20000 });
  const raw = extractNextData(res.data);

  // --- Find sub-category list (listCatProducts or subCategories array) ---
  const subcatMap = {};  // id → { id, name_en, name_ar, slug }
  const productSubcatMap = {};  // productId → subCategoryId

  // Pattern: "subCategoryId":"6" associated with products
  const prodRe = /"id"\s*:\s*"(\d+)"[^}]*?"subCategoryId"\s*:\s*"(\d+)"/g;
  let pm;
  while ((pm = prodRe.exec(raw)) !== null) {
    productSubcatMap[pm[1]] = pm[2];
  }

  // Pattern: sub-category objects like {"id":"6","name":"Gasoline Generator",...}
  // They appear in listCatProducts or a subcategories array
  const subcatRe = /"id"\s*:\s*"(\d+)"\s*,\s*"name"\s*:\s*"([^"]+)"\s*,\s*(?:"nameEn"\s*:\s*"([^"]*)"\s*,\s*)?(?:"nameAr"\s*:\s*"([^"]*)")?/g;
  let sm;
  while ((sm = subcatRe.exec(raw)) !== null) {
    const id = sm[1];
    // Exclude main category IDs and product IDs (sub-cats have smaller IDs typically)
    const name = sm[3] || sm[2];
    const nameAr = sm[4] || '';
    if (!subcatMap[id]) {
      subcatMap[id] = { id, name_en: name, name_ar: nameAr, slug: name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') };
    }
  }

  // Also look for listCatProducts array which has sub-category info
  const listRe = /"listCatProducts"\s*:\s*(\[[\s\S]*?\])\s*,\s*"products"/;
  const listM  = raw.match(listRe);
  if (listM) {
    try {
      const list = JSON.parse(listM[1]);
      for (const subcat of list) {
        if (subcat.id || subcat.catId) {
          const id   = String(subcat.id || subcat.catId);
          const name = subcat.name || subcat.nameEn || subcat.title || '';
          const ar   = subcat.nameAr || '';
          if (!subcatMap[id] && name) {
            subcatMap[id] = { id, name_en: name, name_ar: ar, slug: name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') };
          }
        }
      }
    } catch(e) {}
  }

  return { subcatMap, productSubcatMap, rawLen: raw.length };
}

async function main() {
  const results = {};
  for (const cat of MAIN_CATEGORIES) {
    console.log(`\n📂 ${cat.slug} (${cat.id})`);
    try {
      const data = await scrapeCategory(cat, 'en');
      results[cat.id] = { catId: cat.id, catSlug: cat.slug, ...data };

      const scKeys = Object.keys(data.subcatMap);
      const prodKeys = Object.keys(data.productSubcatMap);
      console.log(`   Sub-cats found: ${scKeys.length}`);
      scKeys.forEach(id => console.log(`     [${id}] ${data.subcatMap[id].name_en}`));
      console.log(`   Products with subCategoryId: ${prodKeys.length}`);

      // Show sample product→subcat mapping
      Object.entries(data.productSubcatMap).slice(0,5).forEach(([pid, scid]) => {
        const sc = data.subcatMap[scid];
        console.log(`     Product ${pid} → subCat ${scid} (${sc ? sc.name_en : '???'})`);
      });
    } catch(e) {
      console.error(`   ✗ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 700));
  }

  fs.writeFileSync('output/subcategories_parsed.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Saved → output/subcategories_parsed.json');
}

main();
