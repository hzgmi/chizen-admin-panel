const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('════════════════════════════════════════');
console.log('  🔍 فحص CSS لصفحة البانرات');
console.log('════════════════════════════════════════\n');

// 1) CSS الأساسية
console.log('📌 1) CSS الحرجة:');
['.sc', '.sc.active', '.fl', '.fll', '.fi', '.cd', '.btn', '.bp', '.sh'].forEach(sel => {
  const regex = new RegExp(sel.replace('.', '\\.') + '\\s*\\{[^}]*\\}');
  const match = html.match(regex);
  console.log('  ' + (match ? '✅' : '❌') + ' ' + sel + (match ? ': ' + match[0].slice(0, 100).replace(/\n/g, ' ') : ''));
});

// 2) هل .sc-banners مخفية بستايل خاص؟
console.log('\n📌 2) #sc-banners في CSS:');
const bannerCss = html.match(/#sc-banners[^{]*\{[^}]*\}/g);
if (bannerCss) {
  bannerCss.forEach(c => console.log('  ' + c));
} else {
  console.log('  ✅ لا يوجد CSS خاص يخفيها');
}

// 3) دالة tab() كاملة
console.log('\n📌 3) دالة tab() كاملة:');
const tabStart = html.indexOf('tab:function');
const tabEnd = html.indexOf('renderDash:', tabStart);
if (tabStart !== -1 && tabEnd !== -1) {
  console.log(html.slice(tabStart, tabEnd).replace(/\n/g, '\n  '));
}

// 4) هل هناك stubs لدوال العرض؟
console.log('\n📌 4) الدوال التي يستدعيها tab():');
['renderDash', 'renderReports', 'renderProducts', 'renderCats', 'renderPays', 'renderOrders', 'renderFlights', 'renderSups', 'renderBalances', 'renderDelivery', 'renderUsers', 'renderEmployees', 'renderAdmins', 'renderSettings'].forEach(fn => {
  const exists = new RegExp(fn + '\\s*:').test(html);
  console.log('  ' + (exists ? '✅' : '❌') + ' ' + fn);
});

// 5) هل هناك خطأ في CSS يخفي الحقول؟
console.log('\n📌 5) CSS .fi و .fl:');
const fiCss = html.match(/\.fi\s*\{[^}]*\}/);
const flCss = html.match(/\.fl\s*\{[^}]*\}/);
if (fiCss) console.log('  .fi: ' + fiCss[0].replace(/\n/g, ' '));
if (flCss) console.log('  .fl: ' + flCss[0].replace(/\n/g, ' '));

// 6) هل هناك أي عرض "block" يخفي؟
console.log('\n📌 6) قواعد قد تخفي:');
const suspicious = html.match(/[^{}]*display\s*:\s*none[^}]*\}/g) || [];
suspicious.slice(0, 10).forEach(s => console.log('  ' + s.slice(0, 150).replace(/\n/g, ' ')));
