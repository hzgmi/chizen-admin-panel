const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
let removed = 0;

// 1. حذف v284 (يعيد المحاولة كل 2s)
const v284Re = /<script id="v284-accountant-activate">[\s\S]*?<\/script>/;
if (v284Re.test(h)) {
  const m = h.match(v284Re)[0];
  h = h.replace(v284Re, '');
  removed += m.length;
  console.log('✅ حذف v284:', m.length, 'حرف');
}

// 2. حذف v287 (يعيد المحاولة + يضيف charts)
const v287Re = /<script id="v287-charts">[\s\S]*?<\/script>/;
if (v287Re.test(h)) {
  const m = h.match(v287Re)[0];
  h = h.replace(v287Re, '');
  removed += m.length;
  console.log('✅ حذف v287:', m.length, 'حرف');
}

fs.writeFileSync('index.html', h);
console.log('━━━━━━━━━━━━━━━━━━');
console.log('removed:', removed, '| total:', before, '→', h.length);
