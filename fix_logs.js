const fs = require('fs');
const path = 'client/src/pages/Records.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix Rice section log
content = content.replace(
    /console\.log\('🔍 PALTI MATCH DEBUG:', \{\s+bifurcationItem: \{\s+variety: item\.variety,\s+standardizedVariety: itemVariety,\s+packaging: item\.packaging,\s+standardizedPkg: itemPkg,\s+bagSizeKg: itemBagSizeKg,\s+location: item\.location,\s+standardizedLoc: itemLocation,\s+KEY: itemKey\s+\},/g,
    `console.log('🔍 PALTI MATCH DEBUG:', {
                                                      bifurcationItem: {
                                                        variety: item.variety,
                                                        packaging: item.packaging,
                                                        bagSizeKg: item.bagSizeKg,
                                                        location: item.location,
                                                        KEY: itemKey
                                                      },`
);

// Fix other sections if they have logs (they usually don't or have different ones)
// Let's just search and remove 'standardizedVariety: itemVariety' which is the main culprit
content = content.replace(/standardizedVariety: itemVariety,/g, '');
content = content.replace(/standardizedPkg: itemPkg,/g, '');
content = content.replace(/standardizedLoc: itemLocation,/g, '');
content = content.replace(/itemBagSizeKg,/g, 'item.bagSizeKg,');

fs.writeFileSync(path, content);
console.log('Fixed console logs in Records.tsx!');
