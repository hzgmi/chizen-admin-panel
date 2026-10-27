const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('════════════════════════════════════════');
console.log('  🔍 فحص عميق للمشكلة');
console.log('════════════════════════════════════════\n');

// 1) توازن script tags
const openCount = (html.match(/<script[\s>]/g) || []).length;
const closeCount = (html.match(/<\/script>/g) || []).length;
console.log('📌 1) توازن <script>:');
console.log('  open:  ' + openCount);
console.log('  close: ' + closeCount);
console.log('  ' + (openCount === closeCount ? '✅ متوازن' : '🔴 غير متوازن! فرق: ' + (openCount - closeCount)));

// 2) زر تسجيل الدخول
console.log('\n📌 2) زر تسجيل الدخول:');
const loginBtnMatch = html.match(/<button[^>]*id="btn-login"[^>]*>|<button[^>]*onclick="[^"]*[Ll]ogin[^"]*"[^>]*>[^<]*تسجيل الدخول[^<]*<\/button>/);
if (loginBtnMatch) {
  console.log('  الزر: ' + loginBtnMatch[0].slice(0, 200));
} else {
  // ابحث عن أي زر يحتوي على "تسجيل الدخول للإدارة"
  const adminLoginBtn = html.match(/<button[^>]{0,300}>[^<]*تسجيل الدخول للإدارة[^<]*<\/button>/);
  if (adminLoginBtn) {
    console.log('  الزر: ' + adminLoginBtn[0].slice(0, 300));
  } else {
    console.log('  ⚠️ لم يجد الزر بالنص');
  }
}

// 3) الدوال المطلوبة
console.log('\n📌 3) دوال تسجيل الدخول:');
['forceLogin', 'customLogin', 'login', 'loginGoogle', 'checkAdmin', 'access', 'init'].forEach(fn => {
  const patterns = [
    new RegExp('function\\s+' + fn + '\\s*\\('),
    new RegExp(fn + '\\s*[:=]\\s*(?:async\\s+)?function'),
    new RegExp('window\\.' + fn + '\\s*=')
  ];
  const found = patterns.some(p => p.test(html));
  console.log('  ' + (found ? '✅' : '❌') + ' ' + fn);
});

// 4) اطبع ما بعد </script> الأول
console.log('\n📌 4) آخر 500 حرف من الملف:');
console.log(html.slice(-500));

// 5) هل هناك <script> مفتوح؟
console.log('\n📌 5) آخر <script> وأول </script> بعده:');
const lastScriptOpen = html.lastIndexOf('<script');
const lastScriptClose = html.lastIndexOf('</script>');
console.log('  last <script  at: ' + lastScriptOpen);
console.log('  last </script> at: ' + lastScriptClose);
if (lastScriptOpen > lastScriptClose) {
  console.log('  🔴 هناك <script> غير مُغلق!');
  console.log('  محتوى من آخر <script>:');
  console.log(html.slice(lastScriptOpen, lastScriptOpen + 300));
}
