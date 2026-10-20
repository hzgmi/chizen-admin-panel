const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ══════════════════════════════════════════════════
// ١. التطهير الشامل (مسح كل أكواد السحب القديمة)
// ══════════════════════════════════════════════════
// مسح الـ HTML الخاص بالسحب
html = html.replace(/<div id="(ptr-|admin-ptr|final-ptr|safe-ptr|bulletproof-ptr)[^>]*>[\s\S]*?<\/div>/g, '');

// مسح الـ CSS الخاص بالسحب
html = html.replace(/<style id="ptr-ultimate-css">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style id="final-clean-css">[\s\S]*?<\/style>/g, '');
html = html.replace(/#final-ptr\s*\{[^}]*\}/g, '');
html = html.replace(/#final-ptr\.active\s*\{[^}]*\}/g, '');
html = html.replace(/#ptr[^{]*\{[^}]*\}/g, '');

// مسح أي سكريبت فيه touchstart (اللي كان بيسبب التعارض)
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{[\s\S]*?touchstart[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*\(function\(\)\s*\{[\s\S]*?touchstart[\s\S]*?\}\)\(\);/g, '');

// مسح أي ستايل ضفناه زمان ممكن يكون لخبط الشاشة
html = html.replace(/<style id="fix-visibility">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style id="force-display-css">[\s\S]*?<\/style>/g, '');


// ══════════════════════════════════════════════════
// ٢. إضافة كود السحب الآمن (النهائي والمضمون)
// ══════════════════════════════════════════════════
const ptrHtml = `
<div id="bulletproof-ptr" style="position:fixed; top:-60px; left:0; right:0; height:60px; display:flex; justify-content:center; align-items:center; background:#ff27c9; color:#fff; font-weight:bold; font-family:Tajawal, sans-serif; z-index:9999999; transition:top 0.3s ease; pointer-events:none;">🔄 جاري التحديث...</div>
<script>
document.addEventListener('touchstart', function(e) {
    let el = e.target;
    let isScrolled = false;
    
    // بنلف على كل الآباء عشان نشوف هل فيه أي عنصر (زي #ct أو #am) معمول عليه سكرول
    while (el && el !== document.body) {
        if (el.scrollTop > 0) { 
            isScrolled = true; 
            break; 
        }
        el = el.parentElement;
    }
    // بنشيك كمان على الصفحة نفسها
    if (window.scrollY > 0 || document.documentElement.scrollTop > 0) {
        isScrolled = true;
    }
    
    // لو مفيش أي حاجة معمول عليها سكرول (يعني إحنا في الأول خالص)
    if (!isScrolled) {
        window._ptrStartY = e.touches[0].pageY;
        window._ptrPulling = true;
    } else {
        window._ptrPulling = false; // لو نازل لتحت، ممنوع السحب
    }
}, { passive: true });

document.addEventListener('touchmove', function(e) {
    if (!window._ptrPulling) return;
    let currentY = e.touches[0].pageY;
    let ptr = document.getElementById('bulletproof-ptr');
    
    // لو سحب لتحت مسافة كويسة
    if (currentY - window._ptrStartY > 80) {
        ptr.style.top = '0';
    } else {
        ptr.style.top = '-60px';
    }
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!window._ptrPulling) return;
    window._ptrPulling = false;
    let ptr = document.getElementById('bulletproof-ptr');
    
    if (ptr.style.top === '0px') {
        setTimeout(function() { location.reload(); }, 500);
    }
});
</script>
`;
html = html.replace('</body>', ptrHtml + '</body>');

// ══════════════════════════════════════════════════
// ٣. الحفظ والفحص النهائي للتأكد من عدم وجود أخطاء
// ══════════════════════════════════════════════════
fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم التطهير الشامل وإضافة السحب الآمن.');

// فحص الأخطاء
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let m, i = 0; let err = false;
while ((m = re.exec(html)) !== null) {
    i++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) { 
        console.log('❌ خطأ في سكربت', i, ':', e.message); 
        err = true; 
    }
}
if (!err) console.log('✅ فحص الكود سليم 100% ولا توجد أي أخطاء برمجية.');
