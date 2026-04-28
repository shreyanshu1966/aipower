/**
 * AIpower Kuwait - Full Product Scraper
 * Scrapes all products from https://aipowerkw.com (English & Arabic)
 * Output: JSON files for each language
 *
 * Usage:
 *   node index.js           -> scrape English only
 *   node index.js --ar      -> scrape Arabic only
 *   node index.js --all     -> scrape both languages
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrls: {
    en: 'https://aipowerkw.com/en',
    ar: 'https://aipowerkw.com/ar',
  },
  delayMs: 800,          // polite delay between requests
  outputDir: './output',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
};

// ─── KNOWN CATEGORIES (discovered via analysis) ────────────────────────────────
const KNOWN_CATEGORIES = [
  { id: 3,  slug: 'generator',        name_en: 'Generator',       name_ar: 'مولدات' },
  { id: 6,  slug: 'air-compressor',   name_en: 'Air Compressor',  name_ar: 'ضاغط الهواء' },
  { id: 9,  slug: 'welding-machine',  name_en: 'Welding Machine', name_ar: 'ماكينات لحام' },
  { id: 36, slug: 'tools',            name_en: 'Tools',           name_ar: 'أدوات' },
  { id: 39, slug: 'accessories',      name_en: 'Accessories',     name_ar: 'اكسسوارات' },
  { id: 42, slug: 'water-pumps',      name_en: 'Water Pumps',     name_ar: 'مضخات مياه' },
  { id: 45, slug: 'cleaning',         name_en: 'Cleaning',        name_ar: 'تنظيف' },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url) {
  try {
    const res = await axios.get(url, { headers: CONFIG.headers, timeout: 15000 });
    return res.data;
  } catch (err) {
    console.error(`  ✗ Failed to fetch: ${url} — ${err.message}`);
    return null;
  }
}

function extractProductId(href) {
  const match = href.match(/\/product\/(\d+)-/);
  return match ? parseInt(match[1]) : null;
}

function cleanText(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

// ─── SCRAPE CATEGORY PAGE (returns array of raw product objects) ───────────────
function parseCategoryPage(html, categoryMeta, lang) {
  const $ = cheerio.load(html);
  const products = [];

  // Each product card: anchor tag wrapping the card
  $('a[href*="/product/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';

    // Skip duplicate footer links
    if (!href.includes(`/${lang}/product/`)) return;

    const productId = extractProductId(href);
    if (!productId) return;

    const fullText = cleanText($el.text());

    // Parse price  e.g. "17.500 KWD"
    const priceMatch = fullText.match(/([\d,]+\.\d{3})\s*KWD/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;

    // Parse original price (crossed-out) if discount present
    const originalPriceMatch = fullText.match(/was\s+([\d,]+\.\d{3})\s*KWD/i);
    const originalPrice = originalPriceMatch
      ? parseFloat(originalPriceMatch[1].replace(',', ''))
      : null;

    // Stock status
    let stockStatus = 'In Stock';
    if (/out\s+of\s+stock/i.test(fullText)) stockStatus = 'Out of Stock';
    else if (/only\s+(\d+)\s+left/i.test(fullText)) {
      const m = fullText.match(/only\s+(\d+)\s+left/i);
      stockStatus = `Only ${m[1]} left`;
    }

    // Preparation time
    const prepMatch = fullText.match(/Preparation Time\s+([\d]+\s+(?:Days?|Hours?))/i);
    const preparationTime = prepMatch ? prepMatch[1] : null;

    // Product name: first heading-like text inside the anchor
    // Strategy: strip known suffixes from fullText
    let name = '';
    const h2 = $el.find('h2, h3, .product-title, [class*="title"], [class*="name"]').first();
    if (h2.length) {
      name = cleanText(h2.text());
    } else {
      // Fallback: extract from URL slug
      const slugMatch = href.match(/\/product\/\d+-(.+?)(?:\?|$)/);
      if (slugMatch) {
        name = slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    // Description: everything except price/stock/prep lines
    let description = fullText
      .replace(/Preparation Time[\s\S]*?(?=\d+\.\d{3}\s*KWD|\+ Add To Cart|$)/i, '')
      .replace(/([\d,]+\.\d{3})\s*KWD/g, '')
      .replace(/\+ Add To Cart/gi, '')
      .replace(/Out Of Stock/gi, '')
      .replace(/Only \d+ left/gi, '')
      .replace(/New|Popular|Special Product/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Avoid duplicates by productId
    if (!products.find((p) => p.id === productId)) {
      products.push({
        id: productId,
        name: name || description.slice(0, 80),
        url: href,
        categoryId: categoryMeta.id,
        categorySlug: categoryMeta.slug,
        categoryName: lang === 'en' ? categoryMeta.name_en : categoryMeta.name_ar,
        price,
        originalPrice,
        currency: 'KWD',
        stockStatus,
        preparationTime,
        description,
      });
    }
  });

  return products;
}

// ─── SCRAPE PRODUCT DETAIL PAGE ────────────────────────────────────────────────
async function scrapeProductDetail(product, lang) {
  const html = await fetchPage(product.url);
  if (!html) return product;

  const $ = cheerio.load(html);

  // Name from page title or h1
  const pageTitle = cleanText($('h1').first().text()) ||
    cleanText($('title').text()).replace(/\s*\|\s*Aipower$/, '');
  if (pageTitle) product.name = pageTitle;

  // Price on detail page
  const priceText = cleanText($('[class*="price"]').first().text());
  const priceMatch = priceText.match(/([\d,]+\.\d{3})\s*KWD/);
  if (priceMatch) product.price = parseFloat(priceMatch[1].replace(',', ''));

  // Delivery fee
  const deliveryMatch = cleanText($('body').text()).match(/Delivery Fee\+?([\d.]+)\s*KWD/);
  if (deliveryMatch) product.deliveryFee = parseFloat(deliveryMatch[1]);

  // Description from meta og:description
  const metaDesc = $('meta[property="og:description"]').attr('content');
  if (metaDesc) {
    product.specifications = metaDesc.trim();
  }

  // Thumbnail image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) product.imageUrl = ogImage;

  return product;
}

// ─── MAIN CATEGORY SCRAPER ─────────────────────────────────────────────────────
async function scrapeCategory(category, lang) {
  const baseUrl = CONFIG.baseUrls[lang];
  const url = `${baseUrl}/category/${category.id}-${category.slug}`;
  console.log(`\n📂 [${lang.toUpperCase()}] Category: ${category.name_en} → ${url}`);

  const html = await fetchPage(url);
  if (!html) return [];

  let products = parseCategoryPage(html, category, lang);
  console.log(`  Found ${products.length} products on listing page`);

  // Check for pagination (page=2, page=3, ...)
  const $ = cheerio.load(html);
  const pageLinks = [];
  $('a[href*="page="]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !pageLinks.includes(href)) pageLinks.push(href);
  });

  for (const pageUrl of pageLinks) {
    await sleep(CONFIG.delayMs);
    const pageHtml = await fetchPage(pageUrl);
    if (!pageHtml) continue;
    const pageProducts = parseCategoryPage(pageHtml, category, lang);
    // Merge, avoiding duplicates
    for (const p of pageProducts) {
      if (!products.find((existing) => existing.id === p.id)) {
        products.push(p);
      }
    }
    console.log(`  Pagination: ${pageUrl} → +${pageProducts.length} products`);
  }

  return products;
}

// ─── FULL SCRAPE FOR ONE LANGUAGE ──────────────────────────────────────────────
async function scrapeLanguage(lang, fetchDetails = false) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🌐  Starting scrape — Language: ${lang.toUpperCase()}`);
  console.log(`${'═'.repeat(60)}`);

  const allProducts = [];

  for (const category of KNOWN_CATEGORIES) {
    const products = await scrapeCategory(category, lang);
    await sleep(CONFIG.delayMs);

    if (fetchDetails) {
      console.log(`  🔍 Fetching detail pages for ${products.length} products...`);
      for (const product of products) {
        await sleep(CONFIG.delayMs);
        await scrapeProductDetail(product, lang);
        process.stdout.write('.');
      }
      console.log('');
    }

    allProducts.push(...products);
  }

  // Build structured output
  const structured = {
    language: lang,
    scrapedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    categories: KNOWN_CATEGORIES.map((cat) => {
      const catProducts = allProducts.filter((p) => p.categoryId === cat.id);
      return {
        id: cat.id,
        slug: cat.slug,
        name: lang === 'en' ? cat.name_en : cat.name_ar,
        productCount: catProducts.length,
        products: catProducts,
      };
    }),
  };

  return structured;
}

// ─── ENTRY POINT ───────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const doAr = args.includes('--ar') || args.includes('--all');
  const doEn = !args.includes('--ar') || args.includes('--all');
  const fetchDetails = args.includes('--details');

  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });

  const results = {};

  if (doEn) {
    results.en = await scrapeLanguage('en', fetchDetails);
    const outPath = path.join(CONFIG.outputDir, 'products_en.json');
    fs.writeFileSync(outPath, JSON.stringify(results.en, null, 2), 'utf-8');
    console.log(`\n✅  English data saved → ${outPath}`);
    console.log(`    Total products: ${results.en.totalProducts}`);
  }

  if (doAr) {
    results.ar = await scrapeLanguage('ar', fetchDetails);
    const outPath = path.join(CONFIG.outputDir, 'products_ar.json');
    fs.writeFileSync(outPath, JSON.stringify(results.ar, null, 2), 'utf-8');
    console.log(`\n✅  Arabic data saved → ${outPath}`);
    console.log(`    Total products: ${results.ar.totalProducts}`);
  }

  // Also generate a merged bilingual file if both languages scraped
  if (doEn && doAr) {
    const merged = results.en.categories.map((enCat) => {
      const arCat = results.ar.categories.find((c) => c.id === enCat.id);
      return {
        id: enCat.id,
        slug: enCat.slug,
        name_en: enCat.name,
        name_ar: arCat ? arCat.name : '',
        productCount: enCat.productCount,
        products: enCat.products.map((enProduct) => {
          const arProduct = arCat
            ? arCat.products.find((p) => p.id === enProduct.id)
            : null;
          return {
            ...enProduct,
            name_en: enProduct.name,
            name_ar: arProduct ? arProduct.name : '',
            description_en: enProduct.description,
            description_ar: arProduct ? arProduct.description : '',
          };
        }),
      };
    });

    const mergedOut = {
      scrapedAt: new Date().toISOString(),
      totalProducts: results.en.totalProducts,
      categories: merged,
    };

    const mergedPath = path.join(CONFIG.outputDir, 'products_bilingual.json');
    fs.writeFileSync(mergedPath, JSON.stringify(mergedOut, null, 2), 'utf-8');
    console.log(`\n✅  Bilingual merged data saved → ${mergedPath}`);
  }

  console.log('\n🎉  Scraping complete!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
