const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// استبدال أي prompt بـ alert أو قيمة افتراضية لتجنب التهنيج
// السطر 771: إضافة مديرية جديدة
html = html.replace(
  /var name = prompt\('اسم المديرية \(مثال: المعلا، كريتر\):'\);/g,
  "var name = 'مديرية جديدة'; this.toast('تمت إضافة مديرية افتراضية (يمكنك تعديلها لاحقاً)', 'suc');"
);

// السطر 272 و 274: القديم بتاع تسجيل الدخول (بنشيله عشان ميعملش مشاكل)
html = html.replace(
  /var email = prompt\("أدخل الإيميل:", "hazimchat@gmail.com"\);/g,
  "var email = 'hazimchat@gmail.com';"
);
html = html.replace(
  /var pass = prompt\("أدخل كلمة المرور:"\);/g,
  "var pass = 'Chizen@2026';"
);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم استبدال كل نوافذ prompt القديمة');
