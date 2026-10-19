const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    if (scriptCount === 8) {
        fs.writeFileSync('script8.js', match[1]);
        console.log('✅ تم استخراج السكربت رقم 8 في ملف script8.js');
        break;
    }
}
