const fs = require('fs');

function fixName(url) {
  const m = url.match(/\/product\/\d+-(.+?)(?:\?|$)/);
  if (!m) return '';
  try {
    const decoded = decodeURIComponent(m[1]);
    return decoded.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  } catch (e) {
    return m[1]; // fallback
  }
}

// 1. Fix AR JSON
const arFile = 'output/products_ar_clean.json';
const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));
arData.categories.forEach(c => {
  c.products.forEach(p => {
    p.name = fixName(p.url);
  });
});
fs.writeFileSync(arFile, JSON.stringify(arData, null, 2));
console.log('Fixed AR JSON');

// 2. Fix Bilingual JSON
const biFile = 'output/products_bilingual_clean.json';
const biData = JSON.parse(fs.readFileSync(biFile, 'utf8'));
biData.categories.forEach(c => {
  c.products.forEach(p => {
    p.name_ar = fixName(p.url_ar || p.url_en.replace('/en/', '/ar/'));
  });
});
fs.writeFileSync(biFile, JSON.stringify(biData, null, 2));
console.log('Fixed Bilingual JSON');

// Helper to rebuild CSVs
function toCSVRow(product, cols) {
  return cols.map(col => {
    let val = product[col];
    if (val === null || val === undefined) val = '';
    if (typeof val === 'object') {
       if (Array.isArray(val) && (col === 'Additional Images' || col === 'images')) {
          val = val.join(',');
       } else {
          val = JSON.stringify(val);
       }
    }
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(',');
}

// 3. Rebuild AR CSV
const csvColsEnAr = ['id', 'name', 'categoryName', 'subCategoryName', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url', 'Image Src', 'Additional Images'];
const arProducts = arData.categories.flatMap(c => c.products).map(p => {
   return { ...p, 'Image Src': p.images?.[0]||'', 'Additional Images': p.images?.slice(1).join(',')||'' };
});
const arCsv = [csvColsEnAr.join(','), ...arProducts.map(p => toCSVRow(p, csvColsEnAr))].join('\n');
fs.writeFileSync('output/products_ar.csv', arCsv);
console.log('Fixed AR CSV');

// 4. Rebuild Bilingual CSV
const biCols = ['id', 'name_en', 'name_ar', 'categoryName_en', 'categoryName_ar', 'subCategoryName_en', 'subCategoryName_ar', 'price', 'currency', 'stockStatus', 'preparationTime', 'specifications', 'url_en', 'url_ar', 'Image Src', 'Additional Images'];
const biProducts = biData.categories.flatMap(c => c.products).map(p => {
   return { ...p, 'Image Src': p.images?.[0]||'', 'Additional Images': p.images?.slice(1).join(',')||'' };
});
const biCsv = [biCols.join(','), ...biProducts.map(p => toCSVRow(p, biCols))].join('\n');
fs.writeFileSync('output/products_bilingual.csv', biCsv);
console.log('Fixed Bilingual CSV');

console.log('Done!');
