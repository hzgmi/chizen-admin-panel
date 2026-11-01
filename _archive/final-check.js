const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let m, i = 0;
while ((m = re.exec(html)) !== null) {
    i++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) { console.log('❌ خطأ في سكربت', i, ':', e.message); }
}
console.log('✅ تم فحص', i, 'سكربت.');
