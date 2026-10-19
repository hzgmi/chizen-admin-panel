const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// استخراج كل أكواد الجافاسكريبت من الملف
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    const code = match[1];
    if (!code.trim()) continue; // تجاهل السكربتات الفاضية

    try {
        // اختبار الكود لو فيه خطأ
        new Function(code);
    } catch (e) {
        console.log(`\n❌ خطأ في السكربت رقم ${scriptCount}:`);
        console.log(`الخطأ: ${e.message}`);
        
        // محاولة تحديد السطر
        const lines = code.split('\n');
        console.log(`عدد الأسطر في هذا السكربت: ${lines.length}`);
    }
}
console.log(`\n✅ تم فحص ${scriptCount} سكربت.`);
