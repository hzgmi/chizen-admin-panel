const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('════════════════════════════════════════');
console.log('  🔍 فحص صفحة البانرات في الأدمن');
console.log('════════════════════════════════════════\n');

// 1) هل التبويب موجود في القائمة؟
console.log('📌 1) زر التبويب في القائمة:');
const tabBtn = html.match(/<button[^>]*onclick="A\.tab\(['"]banners['"][^>]*>([^<]*)<\/button>/);
console.log('  ' + (tabBtn ? '✅ "' + tabBtn[1].trim() + '"' : '❌ مفقود'));

// 2) هل الشاشة sc-banners موجودة؟
console.log('\n📌 2) شاشة sc-banners:');
const scStart = html.indexOf('id="sc-banners"');
console.log('  ' + (scStart !== -1 ? '✅ موجودة' : '❌ مفقودة'));

if (scStart !== -1) {
  // استخراج محتوى الشاشة كاملاً
  const scEnd = html.indexOf('</div>', html.indexOf('banners-list'));
  const scContent = html.slice(scStart, scEnd + 2000);
  
  console.log('\n📌 3) محتوى الشاشة (أول 2000 حرف):');
  console.log('  ' + scContent.slice(0, 2000).replace(/\n/g, '\n  '));
  
  // حقول الإدخال
  console.log('\n📌 4) الحقول:');
  ['bn-img', 'bn-title', 'bn-sub', 'bn-btn', 'bn-link'].forEach(f => {
    console.log('  ' + (scContent.includes('id="' + f + '"') ? '✅' : '❌') + ' ' + f);
  });
  
  // القائمة وزر الإضافة
  console.log('\n📌 5) القائمة وزر الإضافة:');
  console.log('  banners-list: ' + (scContent.includes('id="banners-list"') ? '✅' : '❌'));
  console.log('  زر saveBanner: ' + (scContent.includes('onclick="A.saveBanner()"') ? '✅' : '❌'));
}

// 3) هل الشاشة مخفية بـ display:none؟
console.log('\n📌 6) هل sc-banners مخفية؟');
const scTagMatch = html.match(/<div[^>]*id="sc-banners"[^>]*>/);
if (scTagMatch) {
  console.log('  tag: ' + scTagMatch[0]);
  console.log('  display:none: ' + (/display\s*:\s*none/.test(scTagMatch[0]) ? '⚠️ نعم (طبيعي - hidden by default)' : '✅ لا'));
}

// 4) هل CSS يخفي .sc؟
console.log('\n📌 7) CSS لحاوية .sc:');
const scCss = html.match(/\.sc\s*\{[^}]*\}/);
if (scCss) console.log('  ' + scCss[0].replace(/\n/g, '\n  '));
const scActive = html.match(/\.sc\.active\s*\{[^}]*\}/);
if (scActive) console.log('  ' + scActive[0].replace(/\n/g, '\n  '));

// 5) هل دالة tab() تعمل بشكل صحيح؟
console.log('\n📌 8) دالة tab:');
const tabFn = html.match(/tab\s*:\s*function\s*\([^)]*\)\s*\{[\s\S]*?\n\s{4}\}/);
if (tabFn) {
  console.log(tabFn[0].slice(0, 800).replace(/\n/g, '\n  '));
}

// 6) هل هناك أخطاء في تحميل البيانات؟
console.log('\n📌 9) loadBanners:');
const loadFn = html.match(/loadBanners\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*\{[\s\S]*?\n\s{4}\}/);
if (loadFn) {
  console.log(loadFn[0].slice(0, 600).replace(/\n/g, '\n  '));
}
