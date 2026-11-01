const fs = require('fs');
const adminPath = '/data/data/com.termux/files/home/chizen-audit/chizen-admin-panel/index.html';
let html = fs.readFileSync(adminPath, 'utf8');

// ══════════════════════════════════════════════════
// ١. مسح أي أثر لأكواد التصميم القديمة والسحب (عشان مفيش تعارض)
// ══════════════════════════════════════════════════
// مسح الـ CSS اللي كان بيسبب الشاشة الفاضية
html = html.replace(/<style id="luxury-theme">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style id="fix-blank-screen">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style id="safe-admin-theme">[\s\S]*?<\/style>/g, '');

// مسح أكواد السحب القديمة (HTML, CSS, JS)
html = html.replace(/<div id="ptr-indicator"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/<div id="admin-ptr"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/<div id="safe-ptr"[^>]*>[\s\S]*?<\/div>/g, '');
html = html.replace(/<script>\s*let touchStart[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*let touchStartY[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*let ptrStart[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*let safeStartY[\s\S]*?<\/script>/g, '');

// ══════════════════════════════════════════════════
// ٢. إضافة ستايل نظيف جداً يضمن ظهور الكروت (بدون شفافية)
// ══════════════════════════════════════════════════
const cleanCss = `
<style id="precise-admin-css">
/* إصلاح الشاشة الفاضية: كروت بلون صلب */
.cd, .scd { 
    background: #1F0D35 !important; 
    border: 1px solid rgba(255,255,255,0.08) !important; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important;
    border-radius: 12px !important;
}
.sc.active { display: block !important; opacity: 1 !important; visibility: visible !important; }
#ct { min-height: 80vh; display: block !important; }
.sv, .sl, .ctl { color: #fff !important; }

/* سحب احترافي */
#ptr-precise {
    position: fixed; top: -60px; left: 0; right: 0; height: 60px;
    display: flex; justify-content: center; align-items: center;
    background: #1F0D35; color: #ff27c9; font-weight: bold; font-family: Tajawal, sans-serif;
    z-index: 99999; transition: top 0.3s ease; border-bottom: 2px solid #ff27c9;
}
#ptr-precise.active { top: 0; }
</style>
`;
if (!html.includes('id="precise-admin-css"')) {
    html = html.replace('</head>', cleanCss + '</head>');
}

// ══════════════════════════════════════════════════
// ٣. إضافة سحب دقيق (من فوق فقط ومش بيأثر على التصفح)
// ══════════════════════════════════════════════════
const smartPtr = `
<div id="ptr-precise">🔄 جاري تحديث البيانات...</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    let touchStart = 0;
    let pulling = false;

    document.addEventListener('touchstart', function(e) {
        // شرط دقيق: لازم يكون في أعلى الصفحة (scrollTop === 0)
        let isAtTop = window.scrollY === 0 && document.documentElement.scrollTop === 0 && document.body.scrollTop === 0;
        
        if (isAtTop) {
            touchStart = e.touches[0].pageY;
            pulling = true;
        } else {
            pulling = false;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!pulling) return;
        let currentY = e.touches[0].pageY;
        let distance = currentY - touchStart;

        // لو سحب لتحت مسافة كويسة وإحنا لسه فوق
        if (distance > 80) {
            let isAtTop = window.scrollY === 0 && document.documentElement.scrollTop === 0 && document.body.scrollTop === 0;
            if (isAtTop) {
                document.getElementById('ptr-precise').classList.add('active');
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!pulling) return;
        pulling = false;
        
        let ptr = document.getElementById('ptr-precise');
        if (ptr.classList.contains('active')) {
            setTimeout(function() {
                location.reload();
            }, 600);
        }
    });
});
</script>
`;
if (!html.includes('id="ptr-precise"')) {
    html = html.replace('</body>', smartPtr + '</body>');
}

// ══════════════════════════════════════════════════
// ٤. فحص سريع للتأكد من عدم وجود أخطاء
// ══════════════════════════════════════════════════
fs.writeFileSync(adminPath, html);
console.log('✅ تم العلاج الدقيق: مسح الأخطاء، إصلاح الشاشة، وإضافة السحب الذكي.');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let scriptCount = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    if (!match[1].trim()) continue;
    try { new Function(match[1]); } catch (e) { 
        console.log('❌ خطأ في سكربت رقم', scriptCount, ':', e.message); 
    }
}
console.log('✅ تم فحص الكود بالكامل.');
