const fs = require('fs');
const path = 'client/src/pages/Records.tsx';
let content = fs.readFileSync(path, 'utf8');

const debugSnippet = `const sourceKey = getPaltiMatchKey(sourceVariety, sourceLoc, sourcePkg, sourceBagSize);
                                                console.log('🔄 Registered Palti SOURCE:', { sourceKey, variety: sourceVariety, loc: sourceLoc, pkg: sourcePkg, size: sourceBagSize });`;

content = content.replace(/const sourceKey = getPaltiMatchKey\(sourceVariety, sourceLoc, sourcePkg, sourceBagSize\);/g, debugSnippet);

// Similar for other sections where indices are used (sourceBagSize2, sourceBagSize3)
content = content.replace(/const sourceKey = getPaltiMatchKey\(sourceVariety, sourceLoc, sourcePkg, sourceBagSize2\);/g,
    `const sourceKey = getPaltiMatchKey(sourceVariety, sourceLoc, sourcePkg, sourceBagSize2);
                                           console.log('🔄 Registered Palti SOURCE (Right):', { sourceKey, variety: sourceVariety, loc: sourceLoc, pkg: sourcePkg, size: sourceBagSize2 });`);

content = content.replace(/const sourceKey = getPaltiMatchKey\(sourceVariety, sourceLoc, sourcePkg, sourceBagSize3\);/g,
    `const sourceKey = getPaltiMatchKey(sourceVariety, sourceLoc, sourcePkg, sourceBagSize3);
                                        console.log('🔄 Registered Palti SOURCE (Bottom):', { sourceKey, variety: sourceVariety, loc: sourceLoc, pkg: sourcePkg, size: sourceBagSize3 });`);

fs.writeFileSync(path, content);
console.log('Injected Source Palti debug logs successfully!');
