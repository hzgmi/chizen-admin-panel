const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

const DELETE_LIST = [
  // v97 era — كاملة
  'v97b-theme','chz-catmgr-override-v97b',
  'v97c-css','chz-catmgr-products-v97c',
  'chz-catmgr-logout-v97d',
  'v97e-pro','v97e-redesign-js',
  'v97f-css','v97f-dashboard',
  'chz-kill-legacy-v97g',
  'v97h-css','chz-new-login-v97h',
  'v97i2-css','chz-force-v97i2',
  'chz-fix-login-v97j',
  'chz-kill-old-login-v97k',
  'chz-login-v97l',
  'chz-catmgr-init-v97n',
  'chz-force-home-v97o',
  // ترقيعات قديمة
  'chz-fix-v81','chz-force-render-v82','chz-direct-click-v83','chz-order-view-v85',
  // تشخيص وتنظيف ميت
  'chz-diag-v94-css','chz-diag-v94','chz-clean-v95-css','chz-clean-v95',
  // شاشات دخول مكررة
  'chz-login-btn-css','chz-login-enhance','chz-login-robust',
  // catmanager قديم (قبل v100)
  'dedicated-catmgr-ui','cm-product-form',
  // v102d — مستبدلة بـ v200
  'v102d-main'
];

let removed = 0;
const missing = [];

DELETE_LIST.forEach(id => {
  let found = false;
  // <style>
  let s = `<style id="${id}"`; let e = `</style>`;
  let i = h.indexOf(s);
  while(i !== -1) {
    let end = h.indexOf(e, i);
    if(end !== -1) { h = h.slice(0, i) + h.slice(end + e.length); removed++; found = true; }
    else break;
    i = h.indexOf(s);
  }
  // <script>
  s = `<script id="${id}"`; e = `</script>`;
  i = h.indexOf(s);
  while(i !== -1) {
    let end = h.indexOf(e, i);
    if(end !== -1) { h = h.slice(0, i) + h.slice(end + e.length); removed++; found = true; }
    else break;
    i = h.indexOf(s);
  }
  if(!found) missing.push(id);
});

fs.writeFileSync('index.html', h);
console.log('✅ حُذف:', removed, 'كتلة');
console.log('لم يُعثر عليها (قد تكون محذوفة مسبقاً):', missing.length);
if(missing.length) console.log('  →', missing.slice(0, 10).join(', '));
console.log('الحجم:', before, '->', h.length, '(' + Math.round((1 - h.length/before) * 100) + '% reduction)');
