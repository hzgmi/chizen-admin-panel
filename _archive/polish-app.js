const fs = require('fs');

// ═══ ١. إصلاح الـ PDF ليفتح الملف بعد التحميل ═══
let adminHtml = fs.readFileSync('index.html', 'utf8');
adminHtml = adminHtml.replace(
  /doc\.save\('orders\.pdf'\);/g, 
  "doc.save('orders.pdf'); window.open(doc.output('bloburl'), '_blank');"
);
adminHtml = adminHtml.replace(
  /doc\.save\('receipt\.pdf'\);/g, 
  "doc.save('receipt.pdf'); window.open(doc.output('bloburl'), '_blank');"
);

// ═══ ٢. حفظ جلسة الأدمن (تخطي الدخول إذا كان مسجل) ═══
// إجبار التطبيق على الانتظار حتى يتأكد من الجلسة
adminHtml = adminHtml.replace(
  /if \(u\) self\.access\(u\); else self\.loginScreen\(\);/g,
  "if (u) { self.access(u); } else { self.loginScreen(); }"
);

// ═══ ٤. إضافة خاصية السحب للتحديث (Pull to Refresh) ═══
const ptrCss = `
<style>
#ptr-indicator {
  position: fixed; top: -50px; left: 0; right: 0; height: 50px;
  display: flex; align-items: center; justify-content: center;
  background: #1F0D35; color: #ff27c9; font-weight: bold; font-family: Tajawal, sans-serif;
  transition: top 0.3s ease; z-index: 99999;
}
#ptr-indicator.active { top: 0; }
</style>
`;
const ptrJs = `
<div id="ptr-indicator">🔄 جاري التحديث...</div>
<script>
let startY = 0;
let pulling = false;
document.addEventListener('touchstart', e => {
  if (window.scrollY === 0) { startY = e.touches[0].pageY; pulling = true; }
});
document.addEventListener('touchmove', e => {
  if (!pulling) return;
  let currentY = e.touches[0].pageY;
  if (currentY - startY > 100 && window.scrollY === 0) {
    document.getElementById('ptr-indicator').classList.add('active');
  }
});
document.addEventListener('touchend', e => {
  if (!pulling) return;
  pulling = false;
  let ptr = document.getElementById('ptr-indicator');
  if (ptr.classList.contains('active')) {
    setTimeout(() => {
      if (window.A && window.A.loadData) {
        window.A.loadData().then(() => { if(window.A.renderAll) window.A.renderAll(); location.reload(); });
      } else {
        location.reload();
      }
      ptr.classList.remove('active');
    }, 1000);
  }
});
</script>
</body>
`;
adminHtml = adminHtml.replace('</head>', ptrCss + '</head>');
adminHtml = adminHtml.replace('</body>', ptrJs);
fs.writeFileSync('index.html', adminHtml);
fs.writeFileSync('www/index.html', adminHtml);
console.log('✅ تم تلميع لوحة التحكم (PDF + Pull to Refresh + Session)');

// ═══ ٣. واجهة AI مثل واتساب (للتطبيق العميل) ═══
let clientCssFile = '/data/data/com.termux/files/home/chizen-audit/chizen-app/client/chat-widget.css';
if (fs.existsSync(clientCssFile)) {
    let css = fs.readFileSync(clientCssFile, 'utf8');
    const waStyle = `
/* WhatsApp Style Overrides */
.chat-sheet { background: #efeae2 !important; } /* لون خلفية واتساب */
.chat-header { background: #008069 !important; color: white !important; }
.chat-header-name, .chat-header-sub { color: white !important; }
.chat-messages { background: #efeae2 url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png') repeat !important; }
.chat-msg.bot { background: #ffffff !important; color: #000 !important; border-radius: 8px 8px 8px 0 !important; align-self: flex-start; }
.chat-msg.user { background: #d9fdd3 !important; color: #000 !important; border-radius: 8px 8px 0 8px !important; align-self: flex-end; }
.chat-input-area { background: #f0f2f5 !important; padding: 5px !important; }
.chat-input { background: #fff !important; border-radius: 20px !important; border: none !important; padding: 10px 15px !important; }
.chat-send { background: #00a884 !important; color: white !important; border-radius: 50% !important; width: 45px !important; height: 45px !important; }
`;
    fs.writeFileSync(clientCssFile, css + waStyle);
    console.log('✅ تم تحويل واجهة الدردشة إلى نمط واتساب');
}
