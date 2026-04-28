/**
 * Extract product image URLs from the Next.js payload and update JSONs/CSVs.
 * Shopify allows importing products via direct image URLs, so we don't need
 * to download them locally right now. We just need the "Image Src".
 */
const axios = require('axios');
const fs = require('fs');

const MAIN_CATEGORIES = [
  { id: 3,  slug: 'generator' },
  { id: 6,  slug: 'air-compressor' },
  { id: 9,  slug: 'welding-machine' },
  { id: 36, slug: 'tools' },
  { id: 39, slug: 'accessories' },
  { id: 42, slug: 'water-pumps' },
  { id: 45, slug: 'cleaning' },
];

async function fetchAndUnescape(url) {
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return res.data.replace(/\\"/g, '"');
}

async function getImages(cat) {
  const raw = await fetchAndUnescape(`https://aipowerkw.com/en/category/${cat.id}-${cat.slug}`);
  const imagesMap = {};

  // Find pattern: "id":"123","name":"...","image":"https://...","categoryId"
  // Since order might vary, we can just grab everything block by block.
  // We'll use a regex that captures 'id' and 'image' near each other.
  
  const blocks = raw.split('"id":"');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].slice(0, 1000); // 1000 chars should cover the product object
    
    // Extract ID (first thing after the split)
    const idMatch = block.match(/^(\d+)"/);
    if (!idMatch) continue;
    const prodId = idMatch[1];
    
    // Extract image inside this block
    const imgMatch = block.match(/"image"\s*:\s*"([^"]+)"/);
    if (imgMatch) {
      const imgUrl = imgMatch[1].replace(/\\/g, ''); // strip any remaining escapes
      if (imgUrl && imgUrl.startsWith('http')) {
         imagesMap[prodId] = imgUrl;
      }
    }
  }

  // Handle pagination pages to get ALL images for tools (which has 130 products)
  const paginationLinks = new Set();
  const pageMatch = raw.match(/"nextPage":\s*(\d+)/g);
  // Actually, let's just loop page 2,3,4,5,6 if we didn't get all products.
  
  return imagesMap;
}

async function main() {
  console.log("Scraping product images...");
  
  // To ensure we get ALL products, we might need to hit the API or pages.
  // Actually, our scraper has an index.js which already had the `--all` logic.
  // Since we already scraped 260 products, let's see how many we can get quickly from page 1s.
  // Wait, `tools` has 130 products (which is like 8 pages). We must fetch the paginated pages too.

  const allImages = {};

  for (const cat of MAIN_CATEGORIES) {
    console.log(`> ${cat.slug}`);
    
    // Try up to 10 pages per category to make sure we get all images
    for (let page = 1; page <= 10; page++) {
      const url = `https://aipowerkw.com/en/category/${cat.id}-${cat.slug}?page=${page}`;
      try {
        const raw = await fetchAndUnescape(url);
        
        let foundOnPage = 0;
        const blocks = raw.split('"id":"');
        for (let i = 1; i < blocks.length; i++) {
          const block = blocks[i].slice(0, 1000);
          const idMatch = block.match(/^(\d+)"/);
          if (!idMatch) continue;
          const prodId = idMatch[1];
          const imgMatch = block.match(/"image"\s*:\s*"([^"]+)"/);
          if (imgMatch && imgMatch[1].startsWith('http')) {
             if (!allImages[prodId]) {
                allImages[prodId] = imgMatch[1].replace(/\\/g, '');
                foundOnPage++;
             }
          }
        }
        
        if (foundOnPage === 0 && page > 1) {
          break; // No new products found on this page, stop paginating
        }
      } catch(e) {
         break;
      }
      await new Promise(r => setTimeout(r, 400)); // be nice
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`Found images for ${Object.keys(allImages).length} products.`);

  // Update JSON files
  const files = ['output/products_en_clean.json', 'output/products_ar_clean.json', 'output/products_bilingual_clean.json'];
  let missing = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    for (const cat of data.categories) {
      for (const prod of cat.products) {
        if (allImages[prod.id]) {
          prod.imageUrl = allImages[prod.id];
        } else {
          missing++;
          prod.imageUrl = ''; 
        }
      }
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  }
  console.log(`Updated JSON files. Missing images for ${missing / files.length} products.`);

  // Regenerate CSVs with "Image Src" column for Shopify
  function toCSVRow(product, cols) {
    return cols.map(col => {
      let val = product[col];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  }

  const baseCols = ['id', 'name', 'categoryName', 'subCategoryName', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url', 'imageUrl'];
  
  for (const file of ['output/products_en_clean.json', 'output/products_ar_clean.json']) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const csv = [baseCols.join(','), ...data.categories.flatMap(c => c.products).map(p => toCSVRow(p, baseCols))].join('\n');
    fs.writeFileSync(file.replace('_clean.json', '.csv'), csv, 'utf8');
  }

  // Bilingual CSV
  if (fs.existsSync('output/products_bilingual_clean.json')) {
    const data = JSON.parse(fs.readFileSync('output/products_bilingual_clean.json', 'utf8'));
    const biCols = ['id', 'name_en', 'name_ar', 'categoryName_en', 'categoryName_ar', 'subCategoryName_en', 'subCategoryName_ar', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url_en', 'url_ar', 'imageUrl'];
    const csv = [biCols.join(','), ...data.categories.flatMap(c => c.products).map(p => toCSVRow(p, biCols))].join('\n');
    fs.writeFileSync('output/products_bilingual.csv', csv, 'utf8');
    console.log("Updated CSVs with imageUrl column!");
  }
}

main();
