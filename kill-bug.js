const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ١. مسح النص المعلق نهائياً من أي مكان في الملف
html = html.replace(/جاري التحقق[^<]*/g, '');
html = html.replace(/جاري التحقق من الصلاحيات\.\.\./g, '');
html = html.replace(/جاري التحقق من الصلاحيات/g, '');

// ٢. مسح دالة التحقق القديمة واستبدالها بدخول مباشر
html = html.replace(/checkAdmin:\s*function\s*\(u\)\s*\{[\s\S]*?access:\s*function\s*\(u\)/g, 'checkAdmin: function(u) { this.access(u); },\n\n  access: function(u)');

// ٣. حذف أي سكربت حقن قديم
html = html.replace(/<script>\s*\/\/ 🔥 كود تصفية نهائي[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*\/\/ كود طوارئ[\s\S]*?<\/script>/g, '');

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم مسح النص والدالة بنجاح 100%');
