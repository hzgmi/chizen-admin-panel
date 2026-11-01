const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ١. مسح كود السحب القديم
html = html.replace(/<div id="strict-ptr"[\s\S]*?<\/div>/, '');
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*const ptr = document\.getElementById\('strict-ptr'\)[\s\S]*?<\/script>/, '');

// ٢. إضافة السحب الجديد (بيعتمد على اتجاه السحب Delta Y)
const newPtr = `
<div id="direction-ptr" style="position:fixed; top:-60px; left:0; right:0; height:60px; display:flex; justify-content:center; align-items:center; background:#ff27c9; color:#fff; font-weight:bold; font-family:Tajawal, sans-serif; z-index:9999999; transition:top 0.3s ease; pointer-events:none;">🔄 جاري التحديث...</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const ptr = document.getElementById('direction-ptr');
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', function(e) {
        // بنسجل مكان اللمسة الأولى
        startY = e.touches[0].pageY;
        
        // بنشوف هل الصفحة أو أي عنصر رئيسي معمول عليه سكرول
        let hasScrolled = false;
        let el = e.target;
        while (el && el !== document.body) {
            if (el.scrollTop > 0) { hasScrolled = true; break; }
            el = el.parentElement;
        }
        
        // لو مفيش أي حاجة معمول عليها سكرول (إحنا في القمة)
        if (!hasScrolled && window.scrollY <= 0) {
            isPulling = true;
        } else {
            isPulling = false;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        
        let currentY = e.touches[0].pageY;
        let deltaY = currentY - startY; // موجب يعني بنسحب لتحت، سالب يعني بنطلع لفوق

        // لو بنسحب لتحت (Delta موجب) ومسافة كويسة
        if (deltaY > 80) {
            ptr.style.top = '0';
        } 
        // لو بنسحب لفوق (Delta سالب) نخفي الشريط
        else if (deltaY < 0) {
            ptr.style.top = '-60px';
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!isPulling) return;
        isPulling = false;
        
        if (ptr.style.top === '0px') {
            setTimeout(function() { location.reload(); }, 500);
        }
    });
});
</script>
`;

html = html.replace('</body>', newPtr + '</body>');
fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم إصلاح اتجاه السحب. الآن يعمل فقط عند السحب لأسفل من أعلى الصفحة.');
