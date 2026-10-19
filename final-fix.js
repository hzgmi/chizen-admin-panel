const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ١. استبدال الزرار عشان يستخدم دالة جديدة اسمها forceLogin
html = html.replace(/<button class="gbtn"[^>]*>🔓 تسجيل الدخول للإدارة<\/button>/, '<button class="gbtn" id="btn-login" onclick="forceLogin()">🔓 تسجيل الدخول للإدارة</button>');

// ٢. حقن السكربت الجديد قبل إغلاق الـ body
const forceScript = `
<script>
window.forceLogin = function() {
    var btn = document.getElementById('btn-login');
    if(btn) btn.innerText = 'جاري الدخول...';
    
    if (!window.FB || !window.FB.auth) {
        alert('Firebase غير جاهز');
        if(btn) btn.innerText = '🔓 تسجيل الدخول للإدارة';
        return;
    }

    FB.auth.signInWithEmailAndPassword('hazimchat@gmail.com', 'Chizen@2026').then((res) => {
        if(btn) btn.innerText = '✅ تم الدخول';
        
        // إخفاء شاشة الدخول وإظهار اللوحة مباشرة
        var gs = document.getElementById('gs');
        var am = document.getElementById('am');
        if(gs) gs.style.display = 'none';
        if(am) am.style.display = 'flex';

        // محاولة تحميل بيانات اللوحة
        if (window.A) {
            try {
                if (window.A.buildSections) window.A.buildSections();
                if (window.A.loadData) {
                    window.A.loadData().then(function(){
                        if (window.A.renderAll) window.A.renderAll();
                    });
                }
            } catch(e) { console.log('Dashboard load error:', e); }
        }
    }).catch(e => {
        alert('خطأ: ' + e.message);
        if(btn) btn.innerText = '🔓 تسجيل الدخول للإدارة';
    });
};
</script>
</body>
`;

// مسح أي سكربت قديم وحقن الجديد
html = html.replace(/<script>\s*window\.forceLogin[\s\S]*?<\/script>\n<\/body>/g, '</body>');
html = html.replace('</body>', forceScript);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم حقن دالة forceLogin بنجاح');
