const fs = require('fs');
const html = fs.readFileSync('output/generator_raw.html', 'utf-8');

// Find the product block for id 3
const blocks = html.split('"id":"3"');
if (blocks.length > 1) {
  console.log("Snippet around product ID 3:");
  // Let's print the block that comes after "id":"3"
  console.log(blocks[1].slice(0, 1000));
}

// Find any image URLs in the document to see how they're formatted
const imgMatches = html.match(/https?:\/\/[^\"]+\.(?:jpg|png|jpeg)/ig);
if (imgMatches) {
  console.log("\nSample Image URLs found in HTML:");
  // Dedup and show a few
  const uniq = [...new Set(imgMatches)];
  uniq.slice(0, 10).forEach(u => console.log(u));
}
