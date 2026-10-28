const fs = require('fs');
let d = fs.readFileSync('dashboard.html', 'utf8');
const before = d.length;
let fixes = 0;

// ═══ Fix 1: updatePreview (be-preview) ═══
const oldPrev = `html += '<div style="position:absolute;inset:0;background-image:url(' + JSON.stringify(img) + ');background-size:' + (scale*100) + '% auto;background-position:' + posX + '% ' + posY + '%;background-repeat:no-repeat;background-color:#111"></div>';`;
const newPrev = `html += '<div style="position:absolute;inset:0;background-image:url(&quot;' + esc(img) + '&quot;);background-size:' + (scale*100) + '% auto;background-position:' + posX + '% ' + posY + '%;background-repeat:no-repeat;background-color:#111"></div>';`;
if (d.includes(oldPrev)) { d = d.replace(oldPrev, newPrev); fixes++; console.log('✅ Fix1: be-preview'); }

// ═══ Fix 2: carousel (b276-slider) ═══
const oldCar = `return '<div style="flex:0 0 100%;height:100%;position:relative;background-image:url(' + JSON.stringify(b.img) + ');background-size:' + (sc*100) + '% auto;background-position:' + px + '% ' + py + '%;background-repeat:no-repeat;background-color:#111"></div>';`;
const newCar = `return '<div style="flex:0 0 100%;height:100%;position:relative;background-image:url(&quot;' + esc(b.img) + '&quot;);background-size:' + (sc*100) + '% auto;background-position:' + px + '% ' + py + '%;background-repeat:no-repeat;background-color:#111"></div>';`;
if (d.includes(oldCar)) { d = d.replace(oldCar, newCar); fixes++; console.log('✅ Fix2: carousel'); }

// ═══ Fix 3: thumbnail (__renderBannerList) ═══
const oldThumb = `return '<div style="position:absolute;inset:0;background-image:url(' + JSON.stringify(b.img) + ');background-size:' + (sc*100) + '% auto;background-position:' + px + '% ' + py + '%;background-repeat:no-repeat;background-color:#111"></div>';`;
const newThumb = `return '<div style="position:absolute;inset:0;background-image:url(&quot;' + esc(b.img) + '&quot;);background-size:' + (sc*100) + '% auto;background-position:' + px + '% ' + py + '%;background-repeat:no-repeat;background-color:#111"></div>';`;
if (d.includes(oldThumb)) { d = d.replace(oldThumb, newThumb); fixes++; console.log('✅ Fix3: thumbnail'); }

fs.writeFileSync('dashboard.html', d);
console.log('━━━━━━━━━━━━━━━━━━');
console.log('dashboard: ' + fixes + '/3 fixes | ' + before + ' → ' + d.length);
