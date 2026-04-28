/**
 * Discover all sub-categories from every main category page.
 * Sub-categories appear as filter buttons (links or spans with onclick)
 * on the category listing pages.
 */
const axios   = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
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

async function discoverSubcategories(cat) {
  const url = `https://aipowerkw.com/en/category/${cat.id}-${cat.slug}`;
  const res  = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $    = cheerio.load(res.data);

  const subcats = [];
  const seen    = new Set();

  // Strategy 1: <a> tags whose href contains /category/ with a different ID
  $('a[href*="/category/"]').each(function() {
    const href = $(this).attr('href') || '';
    const text = $(this).text().trim().replace(/\s+/g, ' ');

    // Match sub-category URLs: /en/category/123-sub-slug  OR  ?subCategoryId=123
    const m1 = href.match(/\/category\/(\d+)-([a-z0-9-]+)/i);
    if (m1) {
      const subId = parseInt(m1[1]);
      if (subId !== cat.id && !seen.has(subId)) {
        seen.add(subId);
        subcats.push({ id: subId, slug: m1[2], name: text, url: href.startsWith('http') ? href : `https://aipowerkw.com${href}` });
      }
    }

    // Match query-string style: ?subCategoryId=123 or ?categoryId=123
    const m2 = href.match(/[?&](?:sub)?[Cc]ategory[Ii]d=(\d+)/);
    if (m2 && !seen.has(m2[1])) {
      seen.add(m2[1]);
      subcats.push({ id: m2[1], slug: text.toLowerCase().replace(/\s+/g, '-'), name: text, url: href.startsWith('http') ? href : `https://aipowerkw.com${href}` });
    }
  });

  // Strategy 2: any element with data-category or data-id that looks like a filter
  $('[data-category-id], [data-id], [data-catid]').each(function() {
    const id   = $(this).attr('data-category-id') || $(this).attr('data-id') || $(this).attr('data-catid');
    const text = $(this).text().trim().replace(/\s+/g, ' ');
    if (id && !seen.has(id)) {
      seen.add(id);
      subcats.push({ id, slug: text.toLowerCase().replace(/\s+/g, '-'), name: text, url: null });
    }
  });

  // Strategy 3: onclick patterns like loadCategory(123) or goToCategory('slug')
  $('[onclick]').each(function() {
    const onclick = $(this).attr('onclick') || '';
    const text    = $(this).text().trim().replace(/\s+/g, ' ');
    const m = onclick.match(/\((\d+)/);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      subcats.push({ id: m[1], slug: text.toLowerCase().replace(/\s+/g, '-'), name: text, url: null });
    }
  });

  // Dump raw HTML snippet around filter area for inspection
  const filterHtml = [];
  ['[class*="filter"]','[class*="Filter"]','[class*="subcat"]','[class*="tab"]','[class*="chip"]','[class*="pill"]','nav','aside'].forEach(sel => {
    $(sel).each(function() {
      const h = $(this).html() || '';
      if (h.length > 20 && h.length < 3000) filterHtml.push({ sel, snippet: h.replace(/\n/g,' ').slice(0,400) });
    });
  });

  return { cat: cat.slug, url, subcats, filterSnippets: filterHtml.slice(0,5) };
}

async function main() {
  const results = {};
  for (const cat of MAIN_CATEGORIES) {
    console.log(`Scanning ${cat.slug}...`);
    try {
      results[cat.slug] = await discoverSubcategories(cat);
      const sc = results[cat.slug].subcats;
      console.log(`  → ${sc.length} sub-categories found`);
      sc.forEach(s => console.log(`     • [${s.id}] ${s.name} — ${s.url || s.slug}`));
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  const fs = require('fs');
  fs.writeFileSync('output/subcategories_raw.json', JSON.stringify(results, null, 2));
  console.log('\nSaved → output/subcategories_raw.json');
}

main();
