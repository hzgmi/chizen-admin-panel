const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ١. مسح كود السحب القديم بالكامل
html = html.replace(/<div id="bulletproof-ptr"[\s\S]*?<\/div>/, '');
html = html.replace(/<script>\s*document\.addEventListener\('touchstart',[\s\S]*?<\/script>/, '');

// ٢. إضافة كود سحب صارم جداً (بيشتغل بس جوه #ct ولما يكون في القمة)
const strictPtr = `
<div id="strict-ptr" style="position:fixed; top:-60px; left:0; right:0; height:60px; display:flex; justify-content:center; align-items:center; background:#ff27c9; color:#fff; font-weight:bold; font-family:Tajawal, sans-serif; z-index:9999999; transition:top 0.3s ease; pointer-events:none;">🔄 جاري التحديث...</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const ptr = document.getElementById('strict-ptr');
    const container = document.getElementById('ct'); // الصندوق الوحيد المسموح له
    
    if (!container) return; // لو مفيش صندوق محتوى، مفيش سحب

    let startY = 0;
    let isPulling = false;

    container.addEventListener('touchstart', function(e) {
        // السحب يشتغل فقط لو إحنا لامسين جوه #ct و #ct في القمة
        if (container.scrollTop <= 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        } else {
            isPulling = false;
        }
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        
        // تأكيد إضافي: لو بدأ ينزل لتحت (سكرول) نلغي السحب فوراً
        if (container.scrollTop > 0) {
            isPulling = false;
            ptr.style.top = '-60px';
            return;
        }

        let currentY = e.touches[0].pageY;
        if (currentY - startY > 80) {
            ptr.style.top = '0';
        } else {
            ptr.style.top = '-60px';
        }
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
        if (!isPulling) return;
        isPulling = false;
        
        if (ptr.style.top === '0px') {
            setTimeout(function() { location.reload(); }, 500);
        }
    });
    
    // منع السحب نهائياً لو اللمس مش جوه #ct (زي الشريط العلوي)
    document.addEventListener('touchstart', function(e) {
        if (!container.contains(e.target)) {
            isPulling = false;
        }
    }, { passive: true, capture: true });
});
</script>
`;

html = html.replace('</body>', strictPtr + '</body>');
fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم تركيب السحب الصارم. لن يعمل إلا جوه صندوق المحتوى #ct و في القمة فقط.');
