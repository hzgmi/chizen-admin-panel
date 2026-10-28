const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
let removed = 0;

// 1. حذف HTML القديم داخل cat-mgr-app (سنبقي الحاوية فارغة)
const htmlStart = '<div id="cat-mgr-app" dir="rtl">';
const htmlEnd = 'window.catMgrApp = (function(){';
let sIdx = h.indexOf(htmlStart);
let eIdx = h.indexOf(htmlEnd);

if (sIdx !== -1 && eIdx !== -1) {
  // نستبدل كل ما بين البداية والنهاية بحاوية فارغة
  h = h.slice(0, sIdx) + '<div id="cat-mgr-app" dir="rtl"></div>\n\n<script>\n' + h.slice(eIdx);
  removed++;
  console.log('✅ تم حذف HTML القديم لمدير القسم');
}

// 2. حذف CSS القديم الخاص بـ cm- و #cat-mgr-app
// نبحث عن البداية: #cat-mgr-app{position:fixed
// والنهاية: .cm-toast{...
const cssStart = '#cat-mgr-app{position:fixed';
const cssEnd = '.cm-toast{';
let cStart = h.indexOf(cssStart);
let cEnd = h.indexOf(cssEnd);

if (cStart !== -1 && cEnd !== -1) {
  // نبحث عن نهاية .cm-toast{ (نهاية السطر أو نهاية الـ style)
  let toastEnd = h.indexOf('}', cEnd);
  if (toastEnd !== -1) {
    h = h.slice(0, cStart) + h.slice(toastEnd + 1);
    removed++;
    console.log('✅ تم حذف CSS القديم (cm-*)');
  }
}

// 3. تنظيف أي بقايا لـ #cat-mgr-app في CSS
h = h.replace(/#cat-mgr-app\{position:fixed;inset:0;z-index:99999;background:var\(--bg,#fff\);overflow-y:auto;padding:14px;display:none;font-family:inherit\}/g, '');
h = h.replace(/#cat-mgr-app \*\{box-sizing:border-box\}/g, '');

fs.writeFileSync('index.html', h);
console.log(`✅ تم تنظيف ${removed} كتلة | الحجم:`, before, '->', h.length);
