const fs = require('fs');
let lines = fs.readFileSync('index.html', 'utf8').split('\n');

// ١. مسح السطر 261 نهائياً (اللي فيه علامات الاقتباس المكسورة)
if (lines[260] && lines[260].includes('جاري الدخول')) {
    lines[260] = ''; // مسح السطر بالكامل
    console.log('✅ تم مسح السطر المكسور 261');
}

// ٢. تعديل السطر 180 (الزرار الرئيسي) لينادي على الدالة السليمة
if (lines[179] && lines[179].includes('window.A.access')) {
    lines[179] = lines[179].replace(/onclick="[^"]*"/, 'onclick="forceLogin()"');
    console.log('✅ تم تعديل الزرار الرئيسي لينادي على forceLogin');
}

// ٣. التأكد إن دالة forceLogin موجودة وسليمة في نهاية الملف
let html = lines.join('\n');
if (!html.includes('window.forceLogin = function()')) {
    console.log('⚠️ دالة forceLogin مش موجودة، جاري إضافتها...');
    const forceScript = `
<script>
window.forceLogin = function() {
    var btn = document.querySelector('.gbtn');
    if(btn) btn.innerText = 'جاري الدخول...';
    FB.auth.signInWithEmailAndPassword('hazimchat@gmail.com', 'Chizen@2026').then((res) => {
        if(btn) btn.innerText = '✅ تم الدخول';
        document.getElementById('gs').style.display='none';
        document.getElementById('am').style.display='flex';
        if (window.A && window.A.loadData) window.A.loadData().then(()=>{ if(window.A.renderAll) window.A.renderAll(); });
    }).catch(e => {
        alert('خطأ: ' + e.message);
        if(btn) btn.innerText = '🔓 تسجيل الدخول للإدارة';
    });
};
</script>
</body>`;
    html = html.replace('</body>', forceScript);
} else {
    console.log('✅ دالة forceLogin موجودة بالفعل');
}

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم إصلاح الملف بالكامل');
