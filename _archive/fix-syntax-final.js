const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// استبدال دالة loginScreen بالكامل بنسخة سليمة 100%
const badRegex = /loginScreen:function\(\)\{[\s\S]*?\},/;
const goodCode = `loginScreen:function(){
    document.getElementById('gb').innerHTML=
      '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div>'+
      '<div class="gi">🔐</div><div class="gtt">لوحة محمية</div>'+
      '<div class="gd">سجّل دخول بحساب المسؤول</div>'+
      '<button class="gbtn" onclick="forceLogin()">🔓 تسجيل الدخول للإدارة</button>'+
      '<button class="gbtn sec" onclick="location.reload()">🔄 إعادة</button>';
  },`;

html = html.replace(badRegex, goodCode);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم إصلاح دالة loginScreen');
