const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// احتياطياً — لو v214 موجود، احذفه
h = h.replace(/<style id="v214-css">[\s\S]*?<\/style>/g, '');
h = h.replace(/<script id="v214-js">[\s\S]*?<\/script>/g, '');

const v216 = `
<script id="v216-welcome">
(function(){
  function tryInject(){
    var dashV2 = document.getElementById('dash-v2');
    if(!dashV2) return setTimeout(tryInject, 500);
    if(document.getElementById('v216-welcome')) return; // موجود مسبقاً
    
    var name = 'مدير';
    try {
      var u = firebase && firebase.auth && firebase.auth().currentUser;
      if(u) name = u.displayName || (u.email||'').split('@')[0] || 'مدير';
    } catch(e){}
    
    var hour = new Date().getHours();
    var greet = hour < 12 ? 'صباح الخير' : (hour < 18 ? 'مساء النور' : 'مساء الخير');
    var emoji = hour < 12 ? '☀️' : (hour < 18 ? '🌤️' : '🌙');
    
    var welcome = document.createElement('div');
    welcome.id = 'v216-welcome';
    welcome.style.cssText = 'background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);border-radius:20px;padding:22px 20px;margin:0 0 18px 0;text-align:center;color:#fff;box-shadow:0 10px 30px rgba(168,85,247,0.35)';
    welcome.innerHTML = 
      '<div style="font-size:26px;margin-bottom:8px;line-height:1">' + emoji + '</div>' +
      '<h2 style="margin:0 0 6px 0;font-size:18px;font-weight:900;letter-spacing:-0.3px">' + greet + ' ' + name + '</h2>' +
      '<p style="margin:0;font-size:12px;opacity:0.9;font-weight:500">لوحة الإدارة العامة — نظرة سريعة على اليوم</p>';
    
    dashV2.appendChild(welcome);
    console.log('[V216] Welcome card injected');
  }
  
  // انتظر 2.5 ثانية لضمان أن كل شيء جاهز
  setTimeout(tryInject, 2500);
  // محاولة ثانية بعد 5 ثواني (احتياطياً)
  setTimeout(tryInject, 5000);
})();
</script>
`;

if (!h.includes('id="v216-welcome"')) {
  const idx = h.lastIndexOf('</body>');
  h = h.slice(0, idx) + v216 + h.slice(idx);
}

fs.writeFileSync('index.html', h);
console.log('✅ v216: بطاقة الترحيب |', before, '->', h.length);
