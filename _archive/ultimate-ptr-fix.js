const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ١. مسح أي ستايل قديم
html = html.replace(/<style id="final-clean-css">[\s\S]*?<\/style>/g, '');
html = html.replace(/#final-ptr\s*\{[^}]*\}/g, '');
html = html.replace(/#final-ptr\.active\s*\{[^}]*\}/g, '');

// ٢. مسح أي كود HTML للسحب
html = html.replace(/<div id="admin-ptr-final"[\s\S]*?<\/div>/g, '');
html = html.replace(/<div id="final-ptr"[\s\S]*?<\/div>/g, '');

// ٣. مسح أي سكريبت فيه touchstart أو ptr
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*const ptr = document\.getElementById\('admin-ptr-final'\)[\s\S]*?<\/script>/g, '');
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*const ptr = document\.getElementById\('final-ptr'\)[\s\S]*?<\/script>/g, '');

// ٤. إضافة ستايل جديد للسحب
const newCss = `
<style id="ptr-ultimate-css">
#ptr-ultimate {
    position: fixed; top: -60px; left: 0; right: 0; height: 60px;
    display: flex; justify-content: center; align-items: center;
    background: #ff27c9; color: #fff; font-weight: bold; font-family: Tajawal, sans-serif;
    z-index: 9999999; transition: top 0.3s ease; border-bottom: 2px solid #fff;
}
#ptr-ultimate.active { top: 0; }
</style>
`;
if (!html.includes('id="ptr-ultimate-css"')) html = html.replace('</head>', newCss + '</head>');

// ٥. إضافة السحب الجديد (مربوط بـ #ct حصرياً)
const newPtr = `
<div id="ptr-ultimate">🔄 جاري التحديث...</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const ptr = document.getElementById('ptr-ultimate');
    // الصندوق اللي فيه المحتوى (التابات)
    const container = document.getElementById('ct');
    
    if (!container) return;

    let startY = 0;
    let isPulling = false;

    container.addEventListener('touchstart', function(e) {
        // لو الصندوق ده هو اللي في القمة (scrollTop === 0)
        if (container.scrollTop <= 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        } else {
            isPulling = false;
        }
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!isPulling) return;
        
        let currentY = e.touches[0].pageY;
        if (currentY - startY > 80 && container.scrollTop <= 0) {
            ptr.classList.add('active');
        } else {
            ptr.classList.remove('active');
        }
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
        if (!isPulling) return;
        isPulling = false;
        
        if (ptr.classList.contains('active')) {
            setTimeout(function() { location.reload(); }, 500);
        }
    });
});
</script>
`;
html = html.replace('</body>', newPtr + '</body>');

fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم التطهير الشامل للسحب، وربطه بصندوق المحتوى (#ct) حصرياً.');
