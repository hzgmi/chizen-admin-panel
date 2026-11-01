const fs = require('fs');

// ١. قراءة الملف من الجذر
let html = fs.readFileSync('index.html', 'utf8');

// ٢. مسح أي بصمة قديمة لو موجودة
html = html.replace(/<div id="version-badge">[\s\S]*?<\/div>/, '');

// ٣. إضافة بصمة إصدار ضخمة في أول الصفحة عشان نتأكد إن التحديث وصل
const badge = `
<div id="version-badge" style="background: red; color: white; text-align: center; padding: 15px; font-size: 20px; font-weight: bold; position: fixed; top: 0; left: 0; right: 0; z-index: 9999999; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
✅ تم تحديث كود الأدمن V3.0 بنجاح ✅
</div>
`;
html = html.replace('<body>', '<body>' + badge);

// ٤. حفظ الملف في الجذر وفي مجلد www (عشان نضمن إن GitHub Pages هيقرأ التحديث)
fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) {
    fs.writeFileSync('www/index.html', html);
}

console.log('✅ تم إضافة بصمة الإصدار V3.0 في الجذر و www');
