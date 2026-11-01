const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
// استبدال الـ catch الفاضي عشان يظهر Alert
html = html.replace(/catch\(e\)\{\}/g, "catch(e){ alert('خطأ في جلب البيانات: ' + e.message); }");
fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم تعديل الكود لإظهار الأخطاء');
