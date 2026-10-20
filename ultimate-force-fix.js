const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ١. مسح شارة الإصدار لأنها خلصت مهمتها
html = html.replace(/<div id="version-badge">[\s\S]*?<\/div>/, '');

// ٢. مسح أي أكواد سحب سابقة عشان نبدأ نضيف النظيف
html = html.replace(/<div id="ptr-[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/<script>\s*let (touchStart|ptrStart|safeStartY)[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*let (touchStart|ptrStart|safeStartY)[\s\S]*?<\/script>/g, '');

// ٣. إضافة ستايل قسري لإظهار المحتوى
const forceCss = `
<style id="force-display-css">
.cd, .scd, .sc { background: #1F0D35 !important; display: block !important; opacity: 1 !important; visibility: visible !important; }
.sc.active { display: block !important; }
#ct { min-height: 100vh !important; display: block !important; padding-bottom: 50px; }
</style>
`;
if (!html.includes('id="force-display-css"')) {
    html = html.replace('</head>', forceCss + '</head>');
}

// ٤. إضافة دالة السحب الجديدة (بتشتغل بس لما scrollTop = 0)
const newPtr = `
<div id="ptr-final" style="position:fixed; top:-60px; left:0; right:0; height:60px; display:flex; justify-content:center; align-items:center; background:#ff27c9; color:#fff; font-weight:bold; z-index:999999; transition:top 0.3s ease;">🔄 تحديث...</div>
<script>
(function() {
    let startY = 0;
    let isPulling = false;
    
    document.addEventListener('touchstart', function(e) {
        // نتأكد إن إحنا في أول الصفحة تماماً
        if (window.scrollY === 0 && document.documentElement.scrollTop === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        } else {
            isPulling = false;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        let currentY = e.touches[0].pageY;
        if (currentY - startY > 80) {
            // لو لسه في الأول، نظهر الشريط
            if (window.scrollY === 0 && document.documentElement.scrollTop === 0) {
                document.getElementById('ptr-final').style.top = '0';
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!isPulling) return;
        isPulling = false;
        let ptr = document.getElementById('ptr-final');
        if (ptr.style.top === '0px') {
            setTimeout(function() { location.reload(); }, 500);
        } else {
            ptr.style.top = '-60px'; // إخفاء لو مسحبناش كفاية
        }
    });
})();
</script>
`;
if (!html.includes('id="ptr-final"')) {
    html = html.replace('</body>', newPtr + '</body>');
}

// ٥. فحص الكود للتأكد من سلامته
fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم فرض ظهور الكروت وإضافة سحب مضمون.');

// فحص سريع
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match; let count = 0; let err = false;
while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    if (!match[1].trim()) continue;
    try { new Function(match[1]); } catch (e) { console.log('❌ خطأ في سكربت', count, ':', e.message); err = true; }
}
if (!err) console.log('✅ لا توجد أخطاء برمجية.');
