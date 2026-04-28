// Find the exact subCategoryId / subCategoryName pattern in raw HTML
const fs = require('fs');

const html = fs.readFileSync('output/generator_raw.html', 'utf-8');

// Find positions of "subCategoryId" and grab 400 chars around each
const needle = 'subCategoryId';
let pos = 0, found = 0;
while ((pos = html.indexOf(needle, pos)) !== -1 && found < 8) {
  const snippet = html.slice(Math.max(0, pos-80), pos+300);
  console.log(`\n--- Match ${++found} at pos ${pos} ---`);
  console.log(snippet);
  pos += needle.length;
}

console.log('\n\n--- listCatProducts search ---');
const lcp = html.indexOf('listCatProducts');
if (lcp !== -1) {
  console.log(html.slice(lcp, lcp + 1000));
}

// Check the __next_f raw escape format
console.log('\n\n--- __next_f raw first occurrence ---');
const nf = html.indexOf('__next_f.push');
if (nf !== -1) {
  console.log(html.slice(nf, nf+600));
}
