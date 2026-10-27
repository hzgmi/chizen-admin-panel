const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// 1) البحث عن شاشة sc-banners الفارغة
const scStart = html.indexOf('<div class="sc" id="sc-banners">');
if (scStart === -1) {
  console.log('❌ sc-banners غير موجودة');
  process.exit(1);
}

// 2) العثور على إغلاقها (نتأكد أنها فارغة أو بها محتوى بسيط)
// نبحث عن "<div" التالي بعد sc-banners
const nextDiv = html.indexOf('<div class="sc"', scStart + 50);
if (nextDiv === -1) {
  console.log('⚠️ لم يجد الشاشة التالية');
  process.exit(1);
}

console.log('✅ وجدت sc-banners (فارغة)، سيُعاد بناؤها.');

// 3) محتوى جديد لشاشة البانرات
const newContent = `<div class="sc" id="sc-banners">
        <div class="sh"><h2>🖼️ إدارة البانرات</h2></div>
        
        <div class="cd" style="padding:20px; margin-bottom:20px; background:linear-gradient(135deg,rgba(255,39,201,0.08),rgba(141,36,255,0.08)); border:1px solid rgba(255,39,201,0.2); border-radius:16px;">
          <h3 style="margin-top:0; color:#ff27c9; font-weight:900; margin-bottom:15px;">➕ إضافة بانر جديد</h3>
          
          <div class="fl">
            <label class="fll">🖼️ رابط الصورة (ImgBB أو غيره)</label>
            <input class="fi" id="bn-img" placeholder="https://i.ibb.co/..." style="width:100%;">
          </div>
          
          <div class="fl">
            <label class="fll">📝 العنوان الرئيسي</label>
            <input class="fi" id="bn-title" placeholder="مثال: عروض حصرية" style="width:100%;">
          </div>
          
          <div class="fl">
            <label class="fll">📄 الوصف الفرعي (اختياري)</label>
            <input class="fi" id="bn-sub" placeholder="مثال: خصم حتى 50%" style="width:100%;">
          </div>
          
          <div class="fl">
            <label class="fll">🔘 نص الزر (اختياري)</label>
            <input class="fi" id="bn-btn" placeholder="تسوق الآن" style="width:100%;">
          </div>
          
          <div class="fl">
            <label class="fll">🔗 رابط الزر (اختياري)</label>
            <input class="fi" id="bn-link" placeholder="#" style="width:100%;">
          </div>
          
          <button class="btn bp" onclick="A.saveBanner()" style="width:100%; margin-top:15px; padding:14px; font-size:15px; font-weight:900;">➕ إضافة البانر</button>
        </div>

        <h3 style="color:#ff27c9; font-weight:900; margin:20px 0 15px;">📋 البانرات الحالية</h3>
        <div id="banners-list"></div>
      </div>
    `;

// 4) استبدال الشاشة القديمة بالجديدة
// نبحث عن آخر </div> قبل nextDiv (نهاية sc-banners)
let beforeNextDiv = html.slice(0, nextDiv);
let lastClose = beforeNextDiv.lastIndexOf('</div>');
if (lastClose !== -1 && lastClose > scStart) {
  // نستبدل من scStart إلى آخرClose + 6
  html = html.slice(0, scStart) + newContent + '\n    ' + html.slice(lastClose + 6);
  console.log('✅ تم إعادة بناء شاشة البانرات.');
} else {
  console.log('❌ لم يجد نهاية sc-banners');
  process.exit(1);
}

// 5) حفظ
fs.writeFileSync(file + '.bak_bannersrestore_' + Date.now(), original);
fs.writeFileSync(file, html);

// 6) فحص
console.log('\n═══ التحقق ═══');
['bn-img', 'bn-title', 'bn-sub', 'bn-btn', 'bn-link', 'banners-list'].forEach(f => {
  console.log('  ' + (html.includes('id="' + f + '"') ? '✅' : '❌') + ' ' + f);
});
console.log('  ' + (html.includes('onclick="A.saveBanner()"') ? '✅' : '❌') + ' زر إضافة');
