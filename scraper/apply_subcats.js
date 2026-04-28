/**
 * Extract sub-categories by directly parsing the unescaped Next.js raw data.
 * We will then merge this into our cleaned JSON output.
 */
const axios = require('axios');
const fs = require('fs');

const MAIN_CATEGORIES = [
  { id: 3,  slug: 'generator',       name: 'Generator' },
  { id: 6,  slug: 'air-compressor',  name: 'Air Compressor' },
  { id: 9,  slug: 'welding-machine', name: 'Welding Machine' },
  { id: 36, slug: 'tools',           name: 'Tools' },
  { id: 39, slug: 'accessories',     name: 'Accessories' },
  { id: 42, slug: 'water-pumps',     name: 'Water Pumps' },
  { id: 45, slug: 'cleaning',        name: 'Cleaning' },
];

async function fetchAndUnescape(url) {
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  let html = res.data;
  
  // The data is heavily escaped inside __next_f strings. Let's just unescape it cleanly.
  let unescaped = html.replace(/\\"/g, '"');
  return unescaped;
}

async function getSubcats(cat) {
  const raw = await fetchAndUnescape(`https://aipowerkw.com/en/category/${cat.id}-${cat.slug}`);
  
  const subcats = {};
  
  // Match the listCatProducts pattern directly from unescaped string
  const subcatRe = /"subCatId":"(\d+)","name":"([^"]+)","nameEn":"([^"]+)","nameAr":"([^"]+)"/g;
  let sm;
  while ((sm = subcatRe.exec(raw)) !== null) {
    if (sm[1] !== "") {
      subcats[sm[1]] = {
        id: sm[1],
        name_en: sm[3].trim() || sm[2].trim(),
        name_ar: sm[4].trim(),
        slug: (sm[3] || sm[2]).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      };
    }
  }

  // Match the products to get their subCategoryId
  const productSubcats = {};
  // The unescaped format looks like: {"categoryId":"3","subCategoryId":"6","brandId":"","brandName":"","id":"3","name":"MQ4800...
  const prodRe = /"subCategoryId":"(\d+)","brandId":"[^"]*","brandName":"[^"]*","id":"(\d+)"/g;
  let pm;
  while ((pm = prodRe.exec(raw)) !== null) {
    const subcatId = pm[1];
    const prodId = pm[2];
    if (subcatId && subcatId !== "") {
      productSubcats[prodId] = parseInt(subcatId);
    }
  }

  return { subcats, productSubcats };
}

async function main() {
  console.log("Scraping sub-categories...\n");
  
  const allSubcatsData = {};
  const allProductSubcatMappings = {};
  
  for (const cat of MAIN_CATEGORIES) {
    console.log(`> ${cat.name} (${cat.id})`);
    try {
      const data = await getSubcats(cat);
      allSubcatsData[cat.id] = data.subcats;
      Object.assign(allProductSubcatMappings, data.productSubcats);
      
      console.log(`  Sub-categories found: ${Object.keys(data.subcats).length}`);
      for (const sc of Object.values(data.subcats)) {
        console.log(`    - [${sc.id}] ${sc.name_en} / ${sc.name_ar}`);
      }
      console.log(`  Mapped products: ${Object.keys(data.productSubcats).length}`);
    } catch(e) {
      console.error("  Error:", e.message);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  
  // Now merge this into our cleaned output files
  const enFile = 'output/products_en_clean.json';
  const arFile = 'output/products_ar_clean.json';
  const biFile = 'output/products_bilingual_clean.json';
  
  for (const file of [enFile, arFile, biFile]) {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      for (const cat of data.categories) {
        // Add sub-categories map to the category object
        cat.subCategories = allSubcatsData[cat.id] ? Object.values(allSubcatsData[cat.id]) : [];
        
        // Add sub-category info to each product
        for (const prod of cat.products) {
          const subcatId = allProductSubcatMappings[prod.id];
          if (subcatId && allSubcatsData[cat.id] && allSubcatsData[cat.id][subcatId]) {
            const sc = allSubcatsData[cat.id][subcatId];
            prod.subCategoryId = parseInt(subcatId);
            prod.subCategorySlug = sc.slug;
            
            if (file === enFile) {
              prod.subCategoryName = sc.name_en;
            } else if (file === arFile) {
              prod.subCategoryName = sc.name_ar;
            } else {
              prod.subCategoryName_en = sc.name_en;
              prod.subCategoryName_ar = sc.name_ar;
            }
          } else {
            prod.subCategoryId = null;
            prod.subCategorySlug = null;
            if (file === biFile) {
              prod.subCategoryName_en = null;
              prod.subCategoryName_ar = null;
            } else {
              prod.subCategoryName = null;
            }
          }
        }
      }
      
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`\nUpdated ${file} with sub-category data!`);
    }
  }

  // Generate updated CSV files
  console.log("\nRegenerating CSVs with sub-category data...");
  const csvColsEnAr = ['id', 'name', 'categoryName', 'subCategoryName', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url'];
  
  function toCSVRow(product, cols) {
    return cols.map(col => {
      let val = product[col];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  }

  for (const file of [enFile, arFile]) {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const allProducts = data.categories.flatMap(c => c.products);
      const csv = [csvColsEnAr.join(','), ...allProducts.map(p => toCSVRow(p, csvColsEnAr))].join('\n');
      const csvFile = file.replace('_clean.json', '.csv');
      fs.writeFileSync(csvFile, csv, 'utf8');
      console.log(`Updated ${csvFile}`);
    }
  }

  if (fs.existsSync(biFile)) {
    const data = JSON.parse(fs.readFileSync(biFile, 'utf8'));
    const allProducts = data.categories.flatMap(c => c.products);
    const biCols = ['id', 'name_en', 'name_ar', 'categoryName_en', 'categoryName_ar', 'subCategoryName_en', 'subCategoryName_ar', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url_en', 'url_ar'];
    const csv = [biCols.join(','), ...allProducts.map(p => toCSVRow(p, biCols))].join('\n');
    fs.writeFileSync('output/products_bilingual.csv', csv, 'utf8');
    console.log(`Updated output/products_bilingual.csv`);
  }
}

main();
