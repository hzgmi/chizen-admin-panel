const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('v219-applied')) { console.log('already applied'); process.exit(0); }

// 4 تعديلات دقيقة
const replacements = [
  // المبيعات
  ['\'<div class="scd"><div class="sl">المبيعات</div><div class="sv" id="d-sales">0 ر.س</div><div class="ss" id="d-sales-s">—</div></div>\'+',
   '\'<div class="scd" style="border-top:3px solid #ec4899;padding-top:12px"><div class="sl">المبيعات</div><div class="sv" id="d-sales">0 ر.س</div><div class="ss" id="d-sales-s">—</div></div>\'+'],
  // الطلبات
  ['\'<div class="scd"><div class="sl">الطلبات</div><div class="sv" id="d-orders">0</div><div class="ss" id="d-orders-s">—</div></div>\'+',
   '\'<div class="scd" style="border-top:3px solid #7c3aed;padding-top:12px"><div class="sl">الطلبات</div><div class="sv" id="d-orders">0</div><div class="ss" id="d-orders-s">—</div></div>\'+'],
  // المنتجات
  ['\'<div class="scd"><div class="sl">المنتجات</div><div class="sv" id="d-products">0</div><div class="ss" id="d-products-s">—</div></div>\'+',
   '\'<div class="scd" style="border-top:3px solid #a855f7;padding-top:12px"><div class="sl">المنتجات</div><div class="sv" id="d-products">0</div><div class="ss" id="d-products-s">—</div></div>\'+'],
  // المستخدمين
  ['\'<div class="scd"><div class="sl">المستخدمين</div><div class="sv" id="d-users">0</div><div class="ss" id="d-users-s">—</div></div>\'+',
   '\'<div class="scd" style="border-top:3px solid #06b6d4;padding-top:12px"><div class="sl">المستخدمين</div><div class="sv" id="d-users">0</div><div class="ss" id="d-users-s">—</div></div>\'+'],
];

let replaced = 0;
replacements.forEach(function(pair){
  if (h.indexOf(pair[0]) !== -1) {
    h = h.replace(pair[0], pair[1]);
    replaced++;
  }
});

// إضافة علامة للتحقق من التطبيق
h = h.replace('</head>', '<!-- v219-applied -->\n</head>');

fs.writeFileSync('index.html', h);
console.log('✅ v219: عُدّل', replaced, '/4 بطاقات |', before, '->', h.length);
