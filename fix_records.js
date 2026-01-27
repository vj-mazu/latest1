const fs = require('fs');
const path = 'client/src/pages/Records.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix Right Side section (paltiItems loop)
content = content.replace(
    /const sourceVariety = standardizeVariety\(palti\.variety \|\| palti\.sourceVariety\);\s+const sourceLoc = normalize\(palti\.fromLocation \|\| palti\.locationCode\);\s+const sourcePkg = normalize\(palti\.sourcePackaging\?\.brandName \|\| palti\.sourcePackagingBrand \|\| palti\.source_packaging_brand \|\| 'Unknown'\);\s+const sourceBagSize2 = palti\.sourcePackaging\?\.allottedKg \|\| palti\.source_packaging_kg \|\| palti\.sourcePackagingKg \|\| 26;\s+const sourceKey = `\${sourceVariety}\|\${sourceLoc}\|\${sourcePkg}\|\${sourceBagSize2}`;/g,
    `const sourceVariety = palti.variety || palti.sourceVariety;
                                          const sourceLoc = palti.fromLocation || palti.locationCode;
                                          const sourcePkg = palti.sourcePackaging?.brandName || palti.sourcePackagingBrand || palti.source_packaging_brand || 'Unknown';
                                          const sourceBagSize2 = palti.sourcePackaging?.allottedKg || palti.source_packaging_kg || palti.sourcePackagingKg || 26;
                                          const sourceKey = getPaltiMatchKey(sourceVariety, sourceLoc, sourcePkg, sourceBagSize2);`
);

// Fix Right Side section (item loop)
content = content.replace(
    /const itemVariety = standardizeVariety\(item\.variety\);\s+const itemPkg = \(item\.packaging\?\.brandName \|\| item\.packaging \|\| ''\)\.toLowerCase\(\)\.trim\(\);\s+const itemBagSizeKg = item\.bagSizeKg \|\| 26;\s+const itemLocation = \(item\.location \|\| ''\)\.toLowerCase\(\)\.trim\(\);\s+const itemKey = `\${itemVariety}\|\${itemLocation}\|\${itemPkg}\|\${itemBagSizeKg}`;/g,
    `const itemKey = getPaltiMatchKey(item.variety, item.location, item.packaging, item.bagSizeKg);`
);

fs.writeFileSync(path, content);
console.log('Fixed Records.tsx matching logic!');
