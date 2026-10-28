const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
let removed = 0;

// 1. حذف هيكل نموذج المنتج القديم
const oldForm = '<div id="v97c-form"><div id="v97c-form-inner"></div></div>';
if (h.includes(oldForm)) {
  h = h.replace(oldForm, '');
  removed++;
  console.log('✅ تم حذف هيكل v97c-form');
}

// 2. حذف هيكل شاشة الدخول القديمة v97h-login بالكامل (مع كل ما بداخلها)
const startTag = '<div id="v97h-login">';
let startIdx = h.indexOf(startTag);
if (startIdx !== -1) {
  let openDivs = 0;
  let endIdx = -1;
  for (let i = startIdx; i < h.length; i++) {
    if (h.startsWith('<div', i)) {
      openDivs++;
      i += 3; // تخطي <div
    } else if (h.startsWith('</div>', i)) {
      openDivs--;
      if (openDivs === 0) {
        endIdx = i + 6;
        break;
      }
      i += 4; // تخطي </div>
    }
  }
  if (endIdx !== -1) {
    h = h.slice(0, startIdx) + h.slice(endIdx);
    removed++;
    console.log('✅ تم حذف هيكل v97h-login بالكامل');
  }
}

fs.writeFileSync('index.html', h);
console.log(`✅ تم قص ${removed} من الهياكل القديمة |`, before, '->', h.length);
