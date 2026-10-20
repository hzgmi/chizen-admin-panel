const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

// ══════════════════════════════════════════════════
// ١. التطهير الشامل (مسح كل الأكواد القديمة اللي عملت لخبطة)
// ══════════════════════════════════════════════════
// مسح الستايلات
html = html.replace(/<style id="[^"]*">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style>\s*#ptr[\s\S]*?<\/style>/g, '');
html = html.replace(/<style>\s*#admin-ptr[\s\S]*?<\/style>/g, '');
html = html.replace(/<style>\s*#safe-ptr[\s\S]*?<\/style>/g, '');

// مسح كل الـ HTML بتاع السحب
html = html.replace(/<div id="ptr-[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/<div id="admin-ptr"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/<div id="safe-ptr"[^>]*>[\s\S]*?<\/div>/g, '');

// مسح كل سكريبتات السحب
html = html.replace(/<script>\s*let (touchStart|ptrStart|safeStartY|isPulling|startY)[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*let (touchStart|ptrStart|safeStartY)[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*\(function\(\)\s*\{\s*let startY[\s\S]*?\}\)\(\);/g, '');
html = html.replace(/<div id="version-badge"[\s\S]*?<\/div>/g, ''); // مسح شارة الإصدار


// ══════════════════════════════════════════════════
// ٢. إضافة ستايل نظيف جداً (يضمن ظهور الكروت بلون صلب)
// ══════════════════════════════════════════════════
const cleanCss = `
<style id="final-clean-css">
/* إجبار الكروت على الظهور */
.cd, .scd, .sc { 
    background: #1F0D35 !important; 
    display: block !important; 
    opacity: 1 !important; 
    visibility: visible !important; 
    border: 1px solid rgba(255,255,255,0.1) !important;
}
#ct { display: block !important; min-height: 80vh; }

/* ستايل السحب */
#final-ptr {
    position: fixed; top: -60px; left: 0; right: 0; height: 60px;
    display: flex; justify-content: center; align-items: center;
    background: #ff27c9; color: #fff; font-weight: bold; font-family: Tajawal, sans-serif;
    z-index: 9999999; transition: top 0.3s ease;
}
#final-ptr.active { top: 0; }
</style>
`;
html = html.replace('</head>', cleanCss + '</head>');


// ══════════════════════════════════════════════════
// ٣. إضافة سحب دقيق ومربوط بصندوق المحتوى (#ct)
// ══════════════════════════════════════════════════
const smartPtr = `
<div id="final-ptr">🔄 جاري تحديث البيانات...</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('ct') || document.getElementById('am') || document.body;
    const ptr = document.getElementById('final-ptr');
    let startY = 0;
    let isPulling = false;

    container.addEventListener('touchstart', function(e) {
        // نتأكد إن صندوق المحتوى نفسه في القمة (مش الصفحة كلها)
        if (container.scrollTop === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        } else {
            isPulling = false;
        }
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        let currentY = e.touches[0].pageY;
        let distance = currentY - startY;

        if (distance > 80 && container.scrollTop === 0) {
            ptr.classList.add('active');
        }
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
        if (!isPulling) return;
        isPulling = false;
        if (ptr.classList.contains('active')) {
            setTimeout(function() {
                location.reload();
            }, 500);
        } else {
            ptr.classList.remove('active');
        }
    });
});
</script>
`;
html = html.replace('</body>', smartPtr + '</body>');

// ══════════════════════════════════════════════════
// ٤. الحفظ والفحص البرمجي
// ══════════════════════════════════════════════════
fs.writeFileSync(file, html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم تطهير الكود بالكامل وإضافة السحب الدقيق.');

// فحص الأخطاء
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match; let count = 0; let err = false;
while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    if (!match[1].trim()) continue;
    try { new Function(match[1]); } catch (e) { console.log('❌ خطأ في سكربت', count, ':', e.message); err = true; }
}
if (!err) console.log('✅ الكود سليم 100% بدون أي أخطاء برمجية.');
