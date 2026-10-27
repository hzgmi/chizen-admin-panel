const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// ═══ 1) تحديث arr.push لإضافة الحقول الجديدة ═══
const oldPush = 'arr.push({ img: img, title: title, sub: sub, btn: btn, link: link, fit: fit, position: position });';
const newPush = `arr.push({ 
          img: img, title: title, sub: sub, btn: btn, link: link, fit: fit, position: position,
          scale: (window._chzBannerState||{}).scale || 1,
          rotate: (window._chzBannerState||{}).rotate || 0,
          height: (window._chzBannerState||{}).height || 200,
          align: (window._chzBannerState||{}).align || "right",
          overlay: (window._chzBannerState||{}).overlay !== undefined ? window._chzBannerState.overlay : 50
        });`;

if (html.includes(oldPush)) {
  html = html.replace(oldPush, newPush);
  console.log('✅ تم تحديث arr.push (إضافة scale/rotate/height/align/overlay)');
} else {
  console.log('⚠️ لم يجد النمط القديم، تحقق يدوياً');
}

// ═══ 2) حفظ ═══
if (html !== original) {
  fs.writeFileSync(file + '.bak_final_' + Date.now(), original);
  fs.writeFileSync(file, html);
  console.log('💾 تم الحفظ');
}

// ═══ 3) فحص Syntax ═══
const os = require('os');
const path = require('path');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'fb_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) { errs++; }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}

// فحص banner-upload.js
let uploadErr = 0;
try {
  require('child_process').execSync('node --check banner-upload.js', { stdio: 'pipe' });
} catch (e) {
  uploadErr = 1;
}

console.log('\n════════ SYNTAX ════════');
console.log('  index.html: ' + (errs === 0 ? '✅' : '❌'));
console.log('  banner-upload.js: ' + (uploadErr === 0 ? '✅' : '❌'));
console.log(errs === 0 && uploadErr === 0 ? '\n✅ ALL SAFE' : '\n❌ أخطاء');
