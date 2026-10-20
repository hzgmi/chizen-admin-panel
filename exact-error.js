const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let m, i = 0;
while ((m = re.exec(html)) !== null) {
    i++;
    if (i === 8) { fs.writeFileSync('script8.js', m[1]); break; }
}
console.log('تم استخراج السكربت رقم 8');
