const fs = require('fs');
const path = 'client/src/pages/Records.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix getPaltiMatchKey bag size formatting
content = content.replace(/const size = String\(bagSize \|\| 26\);/g, 'const size = Number(bagSize || 26).toFixed(2);');

// 2. Fix Palti categorization to use sourceProductType
// We search for the start of the loop and the productType assignment
const categorySnippet = `                let productType = item.productType || item.product || 'Rice';
                
                // NEW: Use sourceProductType for Palti categorization to show splits in the correct section
                if ((item.movementType || item.movement_type) === 'palti') {
                  const sType = item.sourceProductType || item.source_product_type;
                  if (sType) productType = sType;
                }

                const qtls = Number(item.quantityQuintals || item.qtls || 0);`;

content = content.replace(/const productType = item\.productType \|\| item\.product \|\| 'Rice';\s+const qtls = Number\(item\.quantityQuintals \|\| item\.qtls \|\| 0\);/, categorySnippet);

fs.writeFileSync(path, content);
console.log('Fixed Palti matching and categorization successfully!');
