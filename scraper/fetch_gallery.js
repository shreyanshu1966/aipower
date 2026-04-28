/**
 * Fetch ALL full-size gallery images from the product detail pages.
 * Replaces the single thumbnail with an array of all high-res image URLs.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
};

async function getGalleryImages(url) {
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    const html = res.data;
    
    // The gallery images are usually in the __next_f JSON block 
    // or inside specific img tags. Let's try parsing both.
    
    // First approach: Look for image URLs in the unescaped Next.js data
    const unescaped = html.replace(/\\"/g, '"');
    
    // Pattern: "images":["url1","url2"] or similar in the Next.js payload
    const images = [];
    
    // Look for product gallery images block
    // "images":[{"id":... "image":"https://ksacdn4..."}, ...]
    const galleryRe = /"image"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp))"/g;
    let m;
    while ((m = galleryRe.exec(unescaped)) !== null) {
      let imgUrl = m[1].replace(/\\/g, '');
      
      // We want full size images. Sometimes URLs end with _thumb.jpg.
      // If we see a _thumb, we can often just remove it to get the full size.
      // E.g. product_01766660686_thumb.jpg -> product_01766660686.jpg
      // But let's just collect them first and see.
      if (imgUrl.startsWith('http') && imgUrl.includes('/product_image/')) {
        // Try to get the non-thumb version if it's a thumb
        let fullImg = imgUrl.replace('_thumb.', '.');
        if (!images.includes(fullImg)) {
           images.push(fullImg);
        }
      }
    }
    
    // If we couldn't find them in Next.js payload, try normal cheerio
    if (images.length === 0) {
      const $ = cheerio.load(html);
      // Find gallery slider images
      $('img').each((_, el) => {
        let src = $(el).attr('src');
        if (src && src.includes('/product_image/')) {
           let fullImg = src.replace('_thumb.', '.');
           if (!images.includes(fullImg)) {
             images.push(fullImg);
           }
        }
      });
    }
    
    // If still 0, fallback to og:image but try to remove _thumb
    if (images.length === 0) {
       const $ = cheerio.load(html);
       const ogImage = $('meta[property="og:image"]').attr('content');
       if (ogImage) {
          images.push(ogImage.replace('_thumb.', '.'));
       }
    }

    return images;
  } catch (e) {
    return [];
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

  data.categories.forEach(c => total += c.products.length);
  console.log(`Starting gallery extraction for ${total} products...`);

  const imgMap = {};

  let idx = 0;
  for (const cat of data.categories) {
    for (const prod of cat.products) {
      idx++;
      process.stdout.write(`[${idx}/${total}] Fetching ${prod.id}... `);
      const url = prod.url;
      const images = await getGalleryImages(url);
      
      if (images && images.length > 0) {
        prod.images = images;
        // Shopify CSV needs images as separate rows OR mapped to Image Src, Variant Image, etc.
        // Usually you join them with a comma if it's a custom script, but Shopify standard CSV 
        // prefers the primary image in "Image Src" and additional images in separate rows or extra columns.
        // We'll store them as an array in JSON, and comma-separated in CSV for now.
        imgMap[prod.id] = images;
        fetched++;
        console.log(`✅ Found ${images.length} images`);
      } else {
        prod.images = [];
        imgMap[prod.id] = [];
        errors++;
        console.log(`❌ Not found`);
      }
      
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`\nDone! Found image galleries for ${fetched} out of ${total} products. (${errors} failed)`);

  // Update JSON files
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  
  const filesToUpdate = ['output/products_ar_clean.json', 'output/products_bilingual_clean.json'];
  for (const f of filesToUpdate) {
    if (fs.existsSync(f)) {
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      d.categories.forEach(c => c.products.forEach(p => { 
        p.images = imgMap[p.id] || []; 
      }));
      fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8');
    }
  }

  // Regenerate CSVs with "Image Src" (first image) and "Additional Images" (comma separated)
  const csvColsEnAr = ['id', 'name', 'categoryName', 'subCategoryName', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url', 'Image Src', 'Additional Images'];
  
  function toCSVRow(product, cols) {
    return cols.map(col => {
      let val = '';
      if (col === 'Image Src') {
         val = product.images && product.images.length > 0 ? product.images[0] : '';
      } else if (col === 'Additional Images') {
         val = product.images && product.images.length > 1 ? product.images.slice(1).join(',') : '';
      } else {
         val = product[col];
         if (val === null || val === undefined) val = '';
         if (typeof val === 'object') val = JSON.stringify(val);
      }
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
    const biCols = ['id', 'name_en', 'name_ar', 'categoryName_en', 'categoryName_ar', 'subCategoryName_en', 'subCategoryName_ar', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url_en', 'url_ar', 'Image Src', 'Additional Images'];
    const csv = [biCols.join(','), ...allProducts.map(p => toCSVRow(p, biCols))].join('\n');
    fs.writeFileSync('output/products_bilingual.csv', csv, 'utf8');
  }
  
  console.log("\nAll JSON and CSV files successfully updated with FULL gallery images!");
}

main();
