const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. حذف قواعد CSS القديمة التي تسبب التداخل
h = h.replace('#gb { display: none !important; }', '');
h = h.replace('.chz-reset-link { display: none !important; }', '');

// 2. إضافة CSS صارم جداً: إخفاء الحاوية القديمة، وإجبار الشاشة الزجاجية على الظهور
const css = `
<style id="v108-css">
/* إخفاء الشاشة القديمة بكل قوة */
#gb, .login-container, .chz-reset-link { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }
/* إظهار الشاشة الجديدة */
#v105-overlay { display: flex !important; }
</style>
`;
if (!h.includes('id="v108-css"')) {
  h = h.replace('</head>', css + '\n</head>');
}

// 3. سكربت يتحكم في التبديل بين الشاشتين (قبل وبعد الدخول)
const js = `
<script id="v108-js">
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof firebase !== 'undefined') {
      firebase.auth().onAuthStateChanged(function(user) {
        var overlay = document.getElementById('v105-overlay');
        var gb = document.getElementById('gb');
        if (user) {
          // بعد تسجيل الدخول: إخفاء الشاشة الزجاجية وإظهار لوحة التحكم
          if(overlay) overlay.style.setProperty('display', 'none', 'important');
          if(gb) gb.style.setProperty('display', 'block', 'important');
        } else {
          // قبل تسجيل الدخول: إظهار الشاشة الزجاجية وإخفاء لوحة التحكم
          if(overlay) overlay.style.setProperty('display', 'flex', 'important');
          if(gb) gb.style.setProperty('display', 'none', 'important');
        }
      });
    }
  }, 1000);
});
</script>
`;
if (!h.includes('id="v108-js"')) {
  h = h.replace('</body>', js + '\n</body>');
}

fs.writeFileSync('index.html', h);
console.log('✅ تم تدمير الشاشة القديمة نهائياً وتثبيت الشاشة الزجاجية');
