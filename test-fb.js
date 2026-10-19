const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/catch\(e\)\{\}/g, "catch(e){ console.error('ERR:', e.message); }");
fs.writeFileSync('index.html', html);
console.log('✅ تم تعديل الأخطاء لتظهر في الكونسول');
