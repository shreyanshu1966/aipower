// Dump raw HTML of Generator category page to inspect sub-category structure
const axios = require('axios');
const fs = require('fs');

async function main() {
  const res = await axios.get('https://aipowerkw.com/en/category/3-generator', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0' }
  });
  fs.writeFileSync('output/generator_raw.html', res.data);
  console.log('Saved HTML, length:', res.data.length);

  // Also search for any sub-cat pattern in the raw HTML
  const patterns = [
    /subCat/gi,
    /sub_cat/gi,
    /subcategory/gi,
    /subCategory/gi,
    /data-id="\d+"/g,
    /categoryId/gi,
    /"category":\s*\{/g,
    /filter/gi,
  ];

  for (const p of patterns) {
    const matches = [...res.data.matchAll(p)].slice(0, 5);
    if (matches.length) {
      console.log(`\n--- Pattern: ${p} ---`);
      matches.forEach(m => {
        const start = Math.max(0, m.index - 100);
        const end = Math.min(res.data.length, m.index + 200);
        console.log(res.data.slice(start, end).replace(/\n/g, ' '));
        console.log('...');
      });
    }
  }
}
main();
