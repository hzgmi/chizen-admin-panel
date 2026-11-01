const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    if (scriptCount === 8) {
        let code = match[1];
        fs.writeFileSync('script8.js', code);
        let lines = code.split('\n');
        
        // بنفحص كل سطر لوحده عشان نلاقي السطر اللي فيه المشكلة
        for (let i = 0; i < lines.length; i++) {
            try {
                new Function(lines[i]);
            } catch (e) {
                // لو الخطأ مش بسبب قوس مفتوح أو دالة ناقصة، يبقى ده السطر المكسور
                if (e.message.includes('Invalid or unexpected token') || e.message.includes('Unexpected token')) {
                    console.log(`❌ السطر رقم ${i + 1} فيه المشكلة:`);
                    console.log(lines[i]);
                }
            }
        }
    }
}
