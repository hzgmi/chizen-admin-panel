const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-reset-link')) { console.log('already'); process.exit(0); }

// Add reset link near login form
const loginForm = 'id="login-err"';
if (h.includes(loginForm)) {
  // Find login container and add reset button below
  const idx = h.indexOf(loginForm);
  // Find next </div> or add before closing
  const resetBtn = `
    <div class="chz-reset-link" style="margin-top:14px;text-align:center;">
      <a href="reset.html" style="color:#a855f7;font-size:11px;font-weight:700;text-decoration:underline;">
        🔄 مواجهة مشكلة؟ إعادة تعيين كاملة
      </a>
    </div>
  `;
  
  // Find a good insertion point — after login-err div
  const errDivEnd = h.indexOf('</div>', idx);
  if (errDivEnd > -1) {
    h = h.slice(0, errDivEnd + 6) + resetBtn + h.slice(errDivEnd + 6);
    console.log('✅ reset link added');
  }
}

fs.writeFileSync(p, h);
console.log('size:', before, '->', h.length);
