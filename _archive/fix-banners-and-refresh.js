const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

console.log('🔍 جاري إصلاح صفحة البانرات وإضافة الريفريش...\n');

// ═══ 1) استخراج كتلة sc-banners بالكامل ═══
const scStart = html.indexOf('<div class="sc" id="sc-banners">');
if (scStart === -1) {
  console.log('❌ sc-banners غير موجودة!');
  process.exit(1);
}

// نبحث عن إغلاقها (نتتبع الأقواس)
let depth = 1, pos = scStart + '<div class="sc" id="sc-banners">'.length;
while (pos < html.length && depth > 0) {
  const nd = html.indexOf('<div', pos), nc = html.indexOf('</div>', pos);
  if (nc === -1) break;
  if (nd !== -1 && nd < nc) { depth++; pos = html.indexOf('>', nd) + 1; }
  else { depth--; pos = nc + 6; }
}
const bannersHTML = html.slice(scStart, pos);
html = html.slice(0, scStart) + html.slice(pos); // حذفها من مكانها القديم
console.log('✅ تم استخراج sc-banners وإزالتها من مكانها القديم.');

// ═══ 2) إعادة إدخالها داخل حاوية التبويبات (#ct) قبل sc-settings ═══
// نبحث عن شاشة الإعدادات (يجب أن تكون داخل #ct)
const settingsIdx = html.indexOf('id="sc-settings"');
if (settingsIdx === -1) {
  console.log('❌ sc-settings غير موجودة!');
  process.exit(1);
}

// نجد بداية الـ div الخاص بها
const divStart = html.lastIndexOf('<div', settingsIdx);

// نُدرج البانرات قبلها مباشرة
html = html.slice(0, divStart) + bannersHTML + '\n' + html.slice(divStart);
console.log('✅ تم إدخال sc-banners قبل sc-settings (داخل الحاوية).');

// ═══ 3) إضافة CSS و JS لخاصية Pull-to-Refresh ═══
if (!html.includes('admin-ptr-css')) {
  const ptrAssets = `
<style id="admin-ptr-css">
  #admin-ptr {
    position: fixed;
    top: -60px; left: 50%; transform: translateX(-50%);
    width: 40px; height: 40px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    transition: top 0.3s ease;
    pointer-events: none;
  }
  #admin-ptr.active { top: 15px; }
  #admin-ptr svg {
    width: 20px; height: 20px;
    stroke: #7C3AED; stroke-width: 2.5; fill: none;
    transition: transform 0.3s;
  }
  #admin-ptr.loading svg { animation: ptrSpin 1s linear infinite; }
  @keyframes ptrSpin { 100% { transform: rotate(360deg); } }
</style>

<div id="admin-ptr">
  <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
</div>

<script>
// ═══ Pull to Refresh for Admin ═══
(function() {
  let startY = 0, currentY = 0, pulling = false;
  const ptr = document.getElementById('admin-ptr');
  const ct = document.getElementById('ct') || window; // الحاوية الرئيسية للتمرير
  
  function getScrollTop() {
    if (ct === window) return document.body.scrollTop || document.documentElement.scrollTop;
    return ct.scrollTop;
  }

  function onStart(e) {
    if (getScrollTop() > 0) return; // فقط إذا كنا في الأعلى
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    pulling = true;
  }

  function onMove(e) {
    if (!pulling) return;
    currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY;
    
    if (diff > 50) {
      ptr.classList.add('active');
      ptr.querySelector('svg').style.transform = 'rotate(' + (diff * 2) + 'deg)';
    }
  }

  function onEnd() {
    if (!pulling) return;
    pulling = false;
    const diff = currentY - startY;
    
    if (diff > 80) {
      // تفعيل التحديث
      ptr.classList.add('loading');
      ptr.querySelector('svg').style.transform = 'rotate(0)';
      
      // استدعاء دالة التحديث (إعادة تحميل البيانات)
      if (window.A && A.currentTab) {
        const t = A.currentTab;
        if (t === 'banners' && A.loadBanners) A.loadBanners();
        else if (t === 'dash' && A.renderDash) A.renderDash();
        else if (t === 'products' && A.renderProducts) A.renderProducts();
        else if (t === 'orders' && A.renderOrders) A.renderOrders();
        else if (A.tab) A.tab(t, document.querySelector('.tb.active'));
      } else {
        location.reload();
      }

      // إخفاء بعد ثانية
      setTimeout(() => {
        ptr.classList.remove('active');
        ptr.classList.remove('loading');
        startY = 0; currentY = 0;
      }, 1000);
    } else {
      ptr.classList.remove('active');
      ptr.querySelector('svg').style.transform = 'rotate(0)';
    }
  }

  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('touchend', onEnd);
})();
</script>
`;
  html = html.replace('</body>', ptrAssets + '\n</body>');
  console.log('✅ تمت إضافة ميزة Pull-to-Refresh (اسحب من الأعلى).');
}

// ═══ 4) حفظ ═══
fs.writeFileSync(file + '.bak_bannersmove_' + Date.now(), original);
fs.writeFileSync(file, html);

// ═══ 5) التحقق ═══
console.log('\n════════ التحقق ════════');
console.log('  sc-banners موجودة: ' + (html.includes('id="sc-banners"') ? '✅' : '❌'));
console.log('  داخل sc-settings (قبلها): ' + (html.indexOf('id="sc-banners"') < html.indexOf('id="sc-settings"') ? '✅' : '❌'));
console.log('  Pull-to-Refresh: ' + (html.includes('admin-ptr') ? '✅' : '❌'));
console.log('  زر إضافة بانر: ' + (html.includes('onclick="A.saveBanner()"') ? '✅' : '❌'));
