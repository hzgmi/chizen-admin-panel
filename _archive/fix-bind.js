const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// استبدال السطر المكسور
html = html.replace(/}\.bind\(this\)\);/g, '});');

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم إزالة .bind(this) من دالة الـ Arrow Function');
