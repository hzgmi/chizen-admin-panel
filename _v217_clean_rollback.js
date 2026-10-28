const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// حذف كل ما أضفناه بعد v213
h = h.replace(/<script id="v216-welcome">[\s\S]*?<\/script>/g, '');
h = h.replace(/<style id="v214-css">[\s\S]*?<\/style>/g, '');
h = h.replace(/<script id="v214-js">[\s\S]*?<\/script>/g, '');
h = h.replace(/<div id="chz-dbg-v2"[\s\S]*?<\/script>/g, '');  // حذف DBG أيضاً

fs.writeFileSync('index.html', h);
console.log('✅ تراجع شامل |', before, '->', h.length);
console.log('v213 موجود؟', h.includes('v213-css'));
console.log('v214 موجود؟', h.includes('v214-css'));
console.log('v216 موجود؟', h.includes('v216-welcome'));
console.log('DBG موجود؟', h.includes('chz-dbg-v2'));
