const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
const count = (h.match(/اختفى/g) || []).length;
h = h.replace(/اختفى/g, 'MISSING_DOC');
fs.writeFileSync('index.html', h);
console.log('استُبدل', count, 'مرة | الحجم:', before, '->', h.length);
