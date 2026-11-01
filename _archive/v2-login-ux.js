const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-login-v2-ux')) { console.log('already'); process.exit(0); }

// Insert a "retry" button below the login form and add hint about network
const loginBtn = 'onclick="doLogin()"';
if (!h.includes(loginBtn)) { console.log('❌ login btn not found'); process.exit(1); }

// Add a small hint below the button
const loginBtnFull = `<button id="btn-do-login" class="gbtn" onclick="doLogin()" style="width:100%;position:relative;overflow:hidden;">`;
if (h.includes(loginBtnFull)) {
  // Find its closing </button>
  const btnStart = h.indexOf(loginBtnFull);
  const btnEnd = h.indexOf('</button>', btnStart);
  if (btnEnd > -1) {
    const afterBtn = btnEnd + '</button>'.length;
    const hint = `
      <div id="login-network-hint" style="margin-top:10px;padding:10px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.25);border-radius:10px;font-size:10.5px;color:#9ca3af;text-align:center;line-height:1.6;">
        🌐 <b>ملاحظة:</b> على الشبكات البطيئة قد يستغرق الدخول 30-60 ثانية<br>
        <span style="color:#a855f7;">لا تغلق الصفحة أثناء التحقق</span>
        &nbsp;·&nbsp;
        <a href="javascript:void(0)" onclick="location.reload()" style="color:#22d3ee;font-weight:800;text-decoration:underline;">🔄 تحديث الصفحة</a>
      </div>`;
    h = h.slice(0, afterBtn) + hint + h.slice(afterBtn);
    console.log('✅ network hint added');
  }
}

fs.writeFileSync(p, h);
console.log('size:', before, '->', h.length);
