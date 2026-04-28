/**
 * Fetch high-resolution image URLs for all products by scraping their detail pages.
 * The high-res images are perfectly stored in <meta property="og:image">.
 * This script updates the JSON and CSV files with the 'imageUrl'.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
};

async function getProductImage(url) {
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(res.data);
    const ogImage = $('meta[property="og:image"]').attr('content');
    return ogImage || '';
  } catch (e) {
    return '';
  }
}

async function main() {
  const file = 'output/products_en_clean.json';
  if (!fs.existsSync(file)) {
    console.error("No JSON file found!");
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let total = 0;
  let fetched = 0;
  let errors = 0;

  // Count total products
  data.categories.forEach(c => total += c.products.length);
  console.log(`Starting image extraction for ${total} products...`);

  // Process sequentially to be nice to the server, but we can do a small concurrency
  let idx = 0;
  for (const cat of data.categories) {
    for (const prod of cat.products) {
      idx++;
      if (prod.imageUrl && prod.imageUrl.length > 5) {
        fetched++;
        continue; // skip if already has image
      }

      process.stdout.write(`[${idx}/${total}] Fetching ${prod.id}... `);
      const url = prod.url;
      const img = await getProductImage(url);
      
      if (img) {
        prod.imageUrl = img;
        fetched++;
        console.log(`✅ ${img.split('/').pop()}`);
      } else {
        prod.imageUrl = '';
        errors++;
        console.log(`❌ Not found`);
      }
      
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`\nDone! Found images for ${fetched} out of ${total} products. (${errors} failed)`);

  // Now update ALL json and csv files with the new imageUrls
  
  // 1. Update EN JSON
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  
  // Create an image mapping
  const imgMap = {};
  data.categories.forEach(c => c.products.forEach(p => { imgMap[p.id] = p.imageUrl; }));
  
  // 2. Update AR JSON
  if (fs.existsSync('output/products_ar_clean.json')) {
    const arData = JSON.parse(fs.readFileSync('output/products_ar_clean.json', 'utf8'));
    arData.categories.forEach(c => c.products.forEach(p => { p.imageUrl = imgMap[p.id] || ''; }));
    fs.writeFileSync('output/products_ar_clean.json', JSON.stringify(arData, null, 2), 'utf8');
  }
  
  // 3. Update Bilingual JSON
  if (fs.existsSync('output/products_bilingual_clean.json')) {
    const biData = JSON.parse(fs.readFileSync('output/products_bilingual_clean.json', 'utf8'));
    biData.categories.forEach(c => c.products.forEach(p => { p.imageUrl = imgMap[p.id] || ''; }));
    fs.writeFileSync('output/products_bilingual_clean.json', JSON.stringify(biData, null, 2), 'utf8');
  }

  // 4. Update CSVs
  const csvColsEnAr = ['id', 'name', 'categoryName', 'subCategoryName', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url', 'imageUrl'];
  
  function toCSVRow(product, cols) {
    return cols.map(col => {
      let val = product[col];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  }

  for (const f of [file, 'output/products_ar_clean.json']) {
    if (fs.existsSync(f)) {
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      const allProducts = d.categories.flatMap(c => c.products);
      const csv = [csvColsEnAr.join(','), ...allProducts.map(p => toCSVRow(p, csvColsEnAr))].join('\n');
      const csvFile = f.replace('_clean.json', '.csv');
      fs.writeFileSync(csvFile, csv, 'utf8');
    }
  }

  if (fs.existsSync('output/products_bilingual_clean.json')) {
    const biData = JSON.parse(fs.readFileSync('output/products_bilingual_clean.json', 'utf8'));
    const allProducts = biData.categories.flatMap(c => c.products);
    const biCols = ['id', 'name_en', 'name_ar', 'categoryName_en', 'categoryName_ar', 'subCategoryName_en', 'subCategoryName_ar', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url_en', 'url_ar', 'imageUrl'];
    const csv = [biCols.join(','), ...allProducts.map(p => toCSVRow(p, biCols))].join('\n');
    fs.writeFileSync('output/products_bilingual.csv', csv, 'utf8');
  }
  
  console.log("\nAll JSON and CSV files successfully updated with Shopify-ready image URLs!");
}

main();
