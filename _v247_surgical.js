const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
let removed = [];

// 1. رابط "مواجهة مشكلة"
const p1 = /<div class="chz-reset-link"[\s\S]*?<\/div>\s*/;
if (p1.test(h)) { h = h.replace(p1, ''); removed.push('reset-link'); }

// 2. ملاحظة الشبكات
const p2 = /<div id="login-network-hint"[\s\S]*?<\/div>\s*/;
if (p2.test(h)) { h = h.replace(p2, ''); removed.push('network-hint'); }

// 3. زر "إعادة"
const p3 = /<button class="gbtn sec"[^>]*onclick="location\.reload\(\)"[\s\S]*?<\/button>\s*/;
if (p3.test(h)) { h = h.replace(p3, ''); removed.push('reload-btn'); }

// 4. تحسين خفيف: زر الدخول بعرض كامل + تباعد أفضل
h = h.replace(
  'id="btn-do-login" class="gbtn" onclick="doLogin()" style="width:100%;position:relative;overflow:hidden;"',
  'id="btn-do-login" class="gbtn" onclick="doLogin()" style="width:100%;position:relative;overflow:hidden;margin-top:8px;padding:16px;border-radius:14px;font-weight:900;font-size:15px;"'
);

fs.writeFileSync('index.html', h);
console.log('✅ حُذف:', removed.join(', '));
console.log('الحجم:', before, '->', h.length);
