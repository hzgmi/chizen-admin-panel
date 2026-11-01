const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    const code = match[1];
    if (!code.trim()) continue;

    try {
        new Function(code);
    } catch (e) {
        if (scriptCount === 8) {
            console.log("الخطأ:", e.message);
            // هنحاول نلاقي السطر اللي فيه المشكلة عن طريق تقسيم الكود
            const lines = code.split('\n');
            for(let i=0; i<lines.length; i++) {
                try {
                    // لو السطر فيه قوس مفتوح أو مقفول ناقص
                    if ((lines[i].match(/\(/g)||[]).length !== (lines[i].match(/\)/g)||[]).length) {
                         console.log(`السطر ${i+1} محتمل يكون فيه الخطأ: ${lines[i].substring(0,100)}`);
                    }
                } catch(err) {}
            }
        }
    }
}
