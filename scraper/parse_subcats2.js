/**
 * Precisely extract sub-category names from the Next.js __next_f JSON payload.
 * The payload contains "listCatProducts" arrays with sub-category entries
 * AND each product object has "subCategoryId" and "subCategoryName" fields.
 */
const axios = require('axios');
const fs    = require('fs');

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0' };

const MAIN_CATEGORIES = [
  { id: 3,  slug: 'generator',       name: 'Generator' },
  { id: 6,  slug: 'air-compressor',  name: 'Air Compressor' },
  { id: 9,  slug: 'welding-machine', name: 'Welding Machine' },
  { id: 36, slug: 'tools',           name: 'Tools' },
  { id: 39, slug: 'accessories',     name: 'Accessories' },
  { id: 42, slug: 'water-pumps',     name: 'Water Pumps' },
  { id: 45, slug: 'cleaning',        name: 'Cleaning' },
];

/** Decode the __next_f.push([1, "..."]) payload string */
function decodeNextF(html) {
  const re = /__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let m, combined = '';
  while ((m = re.exec(html)) !== null) {
    try {
      // unescape the JSON-escaped string
      const s = m[1]
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\x00BSLASH\x00')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\x00BSLASH\x00/g, '\\');
      combined += s;
    } catch(e) {}
  }
  return combined;
}

async function getSubcatsForCategory(cat, lang='en') {
  const url = `https://aipowerkw.com/${lang}/category/${cat.id}-${cat.slug}`;
  const res  = await axios.get(url, { headers: HEADERS, timeout: 20000 });
  const raw  = decodeNextF(res.data);

  // ─── 1. Find all "listCatProducts" arrays ────────────────────────────────────
  // Pattern: "listCatProducts":[{"id":"X","name":"...","nameEn":"...","nameAr":"..."}]
  const subcats = {};

  const listMatches = [...raw.matchAll(/"listCatProducts"\s*:\s*(\[[\s\S]{0,5000}?\])/g)];
  for (const lm of listMatches) {
    try {
      const arr = JSON.parse(lm[1]);
      for (const item of arr) {
        if (item.id && item.name) {
          subcats[item.id] = {
            id:      item.id,
            name_en: item.nameEn || item.name,
            name_ar: item.nameAr || '',
            slug:    (item.nameEn || item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
          };
        }
      }
    } catch(e) {}
  }

  // ─── 2. Find "subCategoryId" + "subCategoryName" on each product ─────────────
  const productSubcatMap = {};  // productId → { subCategoryId, subCategoryName, subCategoryNameAr }

  const prodRe = /"id"\s*:\s*"(\d+)"\s*,\s*"name"\s*:\s*"[^"]+"\s*,[^}]*?"subCategoryId"\s*:\s*"(\d+)"\s*,[^}]*?"subCategoryName"\s*:\s*"([^"]*)"\s*,[^}]*?"subCategoryNameAr"\s*:\s*"([^"]*)"/g;
  let pm;
  while ((pm = prodRe.exec(raw)) !== null) {
    const [, prodId, subId, subName, subNameAr] = pm;
    productSubcatMap[prodId] = { subCategoryId: subId, subCategoryName: subName, subCategoryNameAr: subNameAr };
    // also register the sub-cat if not seen
    if (subId && !subcats[subId] && subName) {
      subcats[subId] = { id: subId, name_en: subName, name_ar: subNameAr, slug: subName.toLowerCase().replace(/[^a-z0-9]+/g,'-') };
    }
  }

  // ─── 3. Simpler fallback: just grab subCategoryId + subCategoryName near each product ─
  // Looser pattern
  const looseRe = /"subCategoryId"\s*:\s*"(\d+)"\s*,\s*"(?:brandId|brandName|subCategoryName)"[^}]{0,200}?"subCategoryName"\s*:\s*"([^"]*)"\s*,\s*"subCategoryNameAr"\s*:\s*"([^"]*)"/g;
  while ((pm = looseRe.exec(raw)) !== null) {
    const [, subId, subName, subNameAr] = pm;
    if (subId && subName && !subcats[subId]) {
      subcats[subId] = { id: subId, name_en: subName, name_ar: subNameAr, slug: subName.toLowerCase().replace(/[^a-z0-9]+/g,'-') };
    }
  }

  // ─── 4. Find product→subcat mapping via a simpler pair search ────────────────
  const simpleProdRe = /"categoryId"\s*:\s*"(\d+)"\s*,\s*"subCategoryId"\s*:\s*"(\d+)"/g;
  // paired with surrounding "id":"X" — grab product id from earlier occurrence
  const allProductBlocks = [...raw.matchAll(/"id"\s*:\s*"(\d+)"\s*,\s*"name"\s*:\s*"[^"]+"\s*,\s*"descNoStyle"/g)];
  for (const pb of allProductBlocks) {
    const prodId = pb[1];
    const blockStart = pb.index;
    const blockSlice = raw.slice(blockStart, blockStart + 600);
    const scm = blockSlice.match(/"subCategoryId"\s*:\s*"(\d+)"/);
    const scnm = blockSlice.match(/"subCategoryName"\s*:\s*"([^"]*)"/);
    const scnar = blockSlice.match(/"subCategoryNameAr"\s*:\s*"([^"]*)"/);
    if (scm) {
      productSubcatMap[prodId] = {
        subCategoryId:   scm[1],
        subCategoryName: scnm ? scnm[1] : '',
        subCategoryNameAr: scnar ? scnar[1] : '',
      };
      if (scm[1] && scnm && !subcats[scm[1]]) {
        subcats[scm[1]] = {
          id:      scm[1],
          name_en: scnm[1],
          name_ar: scnar ? scnar[1] : '',
          slug:    scnm[1].toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        };
      }
    }
  }

  return { subcats, productSubcatMap };
}

async function main() {
  const allSubcats = {};  // catId → { subcats, productSubcatMap }

  for (const cat of MAIN_CATEGORIES) {
    console.log(`\n📂 ${cat.name} (id=${cat.id})`);
    try {
      const result = await getSubcatsForCategory(cat, 'en');
      allSubcats[cat.id] = { catName: cat.name, catSlug: cat.slug, ...result };

      const sc   = result.subcats;
      const pm   = result.productSubcatMap;
      const scIds = Object.keys(sc).filter(id => parseInt(id) < 10000); // sanity filter
      console.log(`   Sub-categories: ${Object.keys(sc).length}`);
      Object.values(sc).sort((a,b)=>parseInt(a.id)-parseInt(b.id)).slice(0, 20).forEach(s =>
        console.log(`     [${s.id}] EN: "${s.name_en}" | AR: "${s.name_ar}"`)
      );
      console.log(`   Products with subCategoryId mapping: ${Object.keys(pm).length}`);
      Object.entries(pm).slice(0,5).forEach(([pid, sc]) =>
        console.log(`     Product ${pid} → subCat ${sc.subCategoryId} "${sc.subCategoryName}"`)
      );
    } catch(e) {
      console.error(`   ✗ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  fs.writeFileSync('output/subcategories_final.json', JSON.stringify(allSubcats, null, 2));
  console.log('\n\n✅ Saved → output/subcategories_final.json');
}

main();
