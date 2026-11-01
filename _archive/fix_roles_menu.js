const fs = require('fs');
const p = 'index.html';
let s = fs.readFileSync(p, 'utf8');

// النمط الصحيح — نستبدل آخر option قبل إغلاق select
const oldBlock = `'<option value="delivery_mgr">📋 مندوب طلبات</option>'+
    '</select>'+`;

const newBlock = `'<option value="delivery_mgr">📋 مندوب طلبات</option>'+
    '<option value="accountant">💰 محاسب مالي</option>'+
    '<option value="bookings_mgr">✈️ مدير حجوزات</option>'+
    '</select>'+`;

if (!s.includes(oldBlock)) {
  console.error('❌ لم أجد النمط الصحيح');
  // ابحث يدوياً
  const idx = s.indexOf('📋 مندوب طلبات');
  if (idx > -1) {
    console.log('موجود @', idx);
    console.log('السياق:', s.substring(idx - 100, idx + 100));
  }
  process.exit(1);
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(p, s);
console.log('✅ أُضيف خيارا "محاسب مالي" و"مدير حجوزات"');

// تحقق
const verify = fs.readFileSync(p, 'utf8');
console.log('accountant:', (verify.match(/value="accountant"/g) || []).length);
console.log('bookings_mgr:', (verify.match(/value="bookings_mgr"/g) || []).length);
