const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// 1) إضافة banners:this.loadBanners إلى قائمة الدوال في tab()
const oldTabPattern = /settings:this\.renderSettings\}\[n\];/;
const newTab = 'settings:this.renderSettings,banners:this.loadBanners}[n];';

if (oldTabPattern.test(html)) {
  html = html.replace(oldTabPattern, newTab);
  console.log('✅ تم ربط banners بـ loadBanners في tab()');
} else {
  console.log('⚠️ النمط لم يُطابق، سنجرب طريقة بديلة...');
  
  // طريقة بديلة: البحث عن "settings:this.renderSettings" وإضافة banners بعده
  if (html.includes('settings:this.renderSettings')) {
    html = html.replace(
      /settings:this\.renderSettings\}/g,
      'settings:this.renderSettings,banners:this.loadBanners}'
    );
    console.log('✅ تم الربط (طريقة بديلة).');
  }
}

// 2) حفظ
fs.writeFileSync(file + '.bak_tabfix_' + Date.now(), original);
fs.writeFileSync(file, html);

// 3) التحقق
console.log('\n═══ التحقق ═══');
console.log('  ' + (html.includes('banners:this.loadBanners') ? '✅' : '❌') + ' banners:this.loadBanners موجودة في tab()');

// طباعة tab() الجديدة
const tabStart = html.indexOf('tab:function');
const tabEnd = html.indexOf('renderDash:', tabStart);
if (tabStart !== -1 && tabEnd !== -1) {
  console.log('\n📋 tab() الجديدة:');
  console.log(html.slice(tabStart, tabEnd).replace(/\n/g, '\n  '));
}
