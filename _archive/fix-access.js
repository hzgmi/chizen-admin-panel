const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// إضافة سطر إخفاء شاشة الدخول جوه دالة access
html = html.replace(
  /access:\s*function\s*\(u\)\s*\{/g, 
  "access: function(u){\n    document.getElementById('gs').style.display='none';"
);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم إصلاح دالة access لإخفاء شاشة الدخول');
