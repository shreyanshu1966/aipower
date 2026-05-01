const fs = require('fs');
const path = require('path');

const SHOPIFY_COLUMNS = [
  'Title',
  'URL handle',
  'Description',
  'Vendor',
  'Product category',
  'Type',
  'Tags',
  'Published on online store',
  'Status',
  'SKU',
  'Barcode',
  'Option1 name',
  'Option1 value',
  'Option1 Linked To',
  'Option2 name',
  'Option2 value',
  'Option2 Linked To',
  'Option3 name',
  'Option3 value',
  'Option3 Linked To',
  'Price',
  'Compare-at price',
  'Cost per item',
  'Charge tax',
  'Tax code',
  'Unit price total measure',
  'Unit price total measure unit',
  'Unit price base measure',
  'Unit price base measure unit',
  'Inventory tracker',
  'Inventory quantity',
  'Continue selling when out of stock',
  'Weight value (grams)',
  'Weight unit for display',
  'Requires shipping',
  'Fulfillment service',
  'Product image URL',
  'Image position',
  'Image alt text',
  'Variant image URL',
  'Gift card',
  'SEO title',
  'SEO description',
  'Color (product.metafields.shopify.color-pattern)',
  'Google Shopping / Google product category',
  'Google Shopping / Gender',
  'Google Shopping / Age group',
  'Google Shopping / Manufacturer part number (MPN)',
  'Google Shopping / Ad group name',
  'Google Shopping / Ads labels',
  'Google Shopping / Condition',
  'Google Shopping / Custom product',
  'Google Shopping / Custom label 0',
  'Google Shopping / Custom label 1',
  'Google Shopping / Custom label 2',
  'Google Shopping / Custom label 3',
  'Google Shopping / Custom label 4',
  'Metafield: custom.specifications [json]',
];

function csvEscape(value) {
  const stringValue = value == null ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function toHandle(productUrl, fallbackId) {
  if (!productUrl) return `product-${fallbackId}`;
  const match = productUrl.match(/\/product\/\d+-(.+?)(?:\?|$)/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]).toLowerCase();
    } catch {
      return match[1].toLowerCase();
    }
  }
  return `product-${fallbackId}`;
}

function parseInventory(stockStatus) {
  const value = String(stockStatus || '').toLowerCase();
  if (value.includes('out of stock')) return 0;
  const match = value.match(/only\s+(\d+)\s+left/);
  if (match) return parseInt(match[1], 10);
  return 100;
}

function parseWeightGrams(specifications) {
  const netWeight = specifications && specifications.net_weight ? String(specifications.net_weight) : '';
  const match = netWeight.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (!match) return '';
  return Math.round(parseFloat(match[1]) * 1000);
}

function getCleanDescription(rawDescription, productName) {
  const raw = String(rawDescription || '').trim();
  const name = String(productName || '');
  // If no "Key :- Value" spec pattern exists, the description has real copy — return it as-is
  if (!/ :- /.test(raw)) return raw;
  // Spec-only descriptions: the content is just the product name followed by specs.
  // Return the product name as the clean description.
  return name;
}

function buildMainRow(product, handle, imageUrl) {
  const specs = product.specifications || {};
  const tags = [product.categoryName, product.subCategoryName, specs.fuel_type]
    .filter(Boolean)
    .join(', ');

  const row = {
    'Title': product.name || '',
    'URL handle': handle,
    'Description': getCleanDescription(product.description, product.name),
    'Vendor': 'AiPower Kuwait',
    'Product category': product.categoryName || '',
    'Type': product.subCategoryName || product.categoryName || '',
    'Tags': tags,
    'Published on online store': 'TRUE',
    'Status': 'Active',
    'SKU': specs.model_number || `AIP-${product.id}`,
    'Barcode': '',
    'Option1 name': 'Title',
    'Option1 value': 'Default Title',
    'Option1 Linked To': '',
    'Option2 name': '',
    'Option2 value': '',
    'Option2 Linked To': '',
    'Option3 name': '',
    'Option3 value': '',
    'Option3 Linked To': '',
    'Price': product.price ?? '',
    'Compare-at price': product.originalPrice ?? '',
    'Cost per item': '',
    'Charge tax': 'TRUE',
    'Tax code': '',
    'Unit price total measure': '',
    'Unit price total measure unit': '',
    'Unit price base measure': '',
    'Unit price base measure unit': '',
    'Inventory tracker': 'shopify',
    'Inventory quantity': parseInventory(product.stockStatus),
    'Continue selling when out of stock': 'DENY',
    'Weight value (grams)': parseWeightGrams(specs),
    'Weight unit for display': 'g',
    'Requires shipping': 'TRUE',
    'Fulfillment service': 'manual',
    'Product image URL': imageUrl || '',
    'Image position': imageUrl ? '1' : '',
    'Image alt text': product.name || '',
    'Variant image URL': '',
    'Gift card': 'FALSE',
    'SEO title': product.name || '',
    'SEO description': String(product.description || '').slice(0, 320),
    'Color (product.metafields.shopify.color-pattern)': '',
    'Google Shopping / Google product category': '',
    'Google Shopping / Gender': '',
    'Google Shopping / Age group': '',
    'Google Shopping / Manufacturer part number (MPN)': specs.model_number || '',
    'Google Shopping / Ad group name': product.subCategoryName || '',
    'Google Shopping / Ads labels': product.categoryName || '',
    'Google Shopping / Condition': 'New',
    'Google Shopping / Custom product': 'FALSE',
    'Google Shopping / Custom label 0': '',
    'Google Shopping / Custom label 1': '',
    'Google Shopping / Custom label 2': '',
    'Google Shopping / Custom label 3': '',
    'Google Shopping / Custom label 4': '',
    'Metafield: custom.specifications [json]': Object.keys(specs).length ? JSON.stringify(specs) : '',
  };

  return SHOPIFY_COLUMNS.map((col) => csvEscape(row[col]));
}

function buildImageOnlyRow(handle, imageUrl, imagePosition, imageAltText) {
  const row = {};
  for (const col of SHOPIFY_COLUMNS) row[col] = '';

  row['URL handle'] = handle;
  row['Product image URL'] = imageUrl;
  row['Image position'] = String(imagePosition);
  row['Image alt text'] = imageAltText;

  return SHOPIFY_COLUMNS.map((col) => csvEscape(row[col]));
}

function flattenProducts(inputJson) {
  if (!inputJson || !Array.isArray(inputJson.categories)) return [];
  return inputJson.categories.flatMap((cat) => Array.isArray(cat.products) ? cat.products : []);
}

function convert(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const inputJson = JSON.parse(raw);
  const products = flattenProducts(inputJson);

  const lines = [SHOPIFY_COLUMNS.map(csvEscape).join(',')];

  for (const product of products) {
    const handle = toHandle(product.url, product.id);
    const allImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const leadImage = allImages[0] || product.imageUrl || '';

    lines.push(buildMainRow(product, handle, leadImage).join(','));

    const additionalImages = leadImage ? allImages.filter((img, idx) => idx > 0) : allImages;
    for (let i = 0; i < additionalImages.length; i += 1) {
      lines.push(buildImageOnlyRow(handle, additionalImages[i], i + 2, product.name || '').join(','));
    }
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  return products.length;
}

function main() {
  const inputArg = process.argv[2] || path.join(__dirname, 'output', 'products_en_clean.json');
  const outputArg = process.argv[3] || path.join(__dirname, 'output', 'products_en_shopify.csv');

  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input JSON not found: ${inputPath}`);
    process.exit(1);
  }

  const count = convert(inputPath, outputPath);
  console.log(`Shopify CSV created: ${outputPath}`);
  console.log(`Products exported: ${count}`);
}

main();