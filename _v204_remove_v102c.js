const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف سكربت v102c بالكامل (مصدر promptToken)
let removed = false;
const v102cRe = /<script[^>]*\bid="v102c-main"[^>]*>[\s\S]*?<\/script>/;
if (v102cRe.test(h)) {
  h = h.replace(v102cRe, '<!-- v102c removed (was source of GitHub token modal) -->');
  removed = true;
  console.log('✅ حذف v102c-main');
}

// 2. حذف أي بقايا promptToken (احتياطياً)
h = h.replace(/<textarea id="v102b-token-input"[^>]*><\/textarea>/g, '');
h = h.replace(/function promptToken\(\)\{[\s\S]*?\n  \}/g, '');

// 3. حذف تعريفات catMgrApp.confirm القديمة (نترك v203 فقط)
const confirmRe = /window\.catMgrApp\.confirm = async function\(orderId\)\{[\s\S]*?\n    \};/g;
const count = (h.match(confirmRe) || []).length;
console.log('عدد تعريفات confirm قبل الحذف:', count);

// حذف آخر تعريف قديم (السطر 13166) لكن ليس v203 (لأنه يحتوي على "fixedConfirm" ليس هذا النمط)
// نحذف فقط التعريفات القديمة التي تحتوي على 'runTransaction' مباشرة
// الأفضل: نتركها ونعتمد على v203

fs.writeFileSync('index.html', h);
console.log('✅ v204 | الحجم:', before, '->', h.length);
console.log('تم الحذف:', removed ? 'نجح' : 'فشل');

// تحقق
const promptCount = (h.match(/promptToken/g) || []).length;
console.log('عدد promptToken المتبقي:', promptCount);
