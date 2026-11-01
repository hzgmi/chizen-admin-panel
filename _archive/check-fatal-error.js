const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// استخراج السكربتات
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    let code = match[1];
    if (!code.trim()) continue;

    try {
        // فحص الكود
        new Function(code);
    } catch (e) {
        console.log(`\n❌ خطأ في السكربت رقم ${scriptCount}:`);
        console.log(`الرسالة: ${e.message}`);
        
        // محاولة تحديد السطر
        let lines = code.split('\n');
        console.log(`عدد الأسطر في السكربت: ${lines.length}`);
        
        // بنحاول نشوف آخر 5 أسطر عشان نعرف إيه اللي كسر
        console.log("آخر الأسطر في السكربت:");
        console.log(lines.slice(-5).join('\n'));
    }
}
console.log(`\n✅ تم فحص ${scriptCount} سكربت.`);
