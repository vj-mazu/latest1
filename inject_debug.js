const fs = require('fs');
const path = 'client/src/pages/Records.tsx';
let content = fs.readFileSync(path, 'utf8');

const debugSnippet = `const totalShortage = splits.reduce((sum: number, s: any) => sum + (s.shortageKg || 0), 0);

                                              // DEBUG: Comprehensive matching diagnostics for all sections
                                              if (paltiItems.length > 0) {
                                                console.group(\`🔍 PALTI MATCHING [\${productType}] - \${item.variety}\`);
                                                console.log('Row Data:', { variety: item.variety, location: item.location, pkg: item.packaging, bag: item.bagSizeKg });
                                                console.log('Generated Item Key:', itemKey);
                                                console.log('Available Palti Keys:', Object.keys(paltiSplitsMap));
                                                if (hasSplits) {
                                                  console.log('%c✅ MATCH FOUND!', 'color: green; font-weight: bold;', splits);
                                                } else {
                                                  console.log('%c❌ NO MATCH', 'color: red;');
                                                }
                                                console.groupEnd();
                                              }`;

// Replace the calculation line with calculation + debug
content = content.replace(/const totalShortage = splits\.reduce\(\(sum: number, s: any\) => sum \+ \(s\.shortageKg \|\| 0\), 0\);/g, debugSnippet);

fs.writeFileSync(path, content);
console.log('Injected debug logs into all sections successfully!');
