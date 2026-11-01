const fs = require('fs');
const path = require('path');
const os = require('os');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;
let changed = false;

// ═══ 1) إضافة <script src="banner-upload.js"></script> قبل </body> ═══
if (!html.includes('banner-upload.js')) {
  html = html.replace('</body>', '<script src="banner-upload.js"></script>\n</body>');
  console.log('✅ تم إضافة مرجع banner-upload.js');
  changed = true;
} else {
  console.log('ℹ️ banner-upload.js موجود مسبقاً');
}

// ═══ 2) تعديل saveBanner لإضافة الحقول الجديدة ═══
// البحث عن النص الدقيق (باستخدام indexOf، ليس regex)
const oldPush = 'arr.push({ img: img, title: title, sub: sub, btn: btn });';
const newPush = 'arr.push({ img: img, title: title, sub: sub, btn: btn, fit: (window._chzBannerState||{}).fit||"cover", position: ((window._chzBannerState||{}).x||50)+"% "+((window._chzBannerState||{}).y||50)+"%", scale: (window._chzBannerState||{}).scale||1, rotate: (window._chzBannerState||{}).rotate||0, height: (window._chzBannerState||{}).height||200, align: (window._chzBannerState||{}).align||"right", overlay: (window._chzBannerState||{}).overlay !== undefined ? window._chzBannerState.overlay : 50 });';

const occurrences = html.split(oldPush).length - 1;
console.log('\n📌 عدد تكرارات arr.push: ' + occurrences);

if (occurrences === 1) {
  html = html.replace(oldPush, newPush);
  console.log('✅ تم تعديل saveBanner (إضافة fit/position/scale/rotate/height/align/overlay)');
  changed = true;
} else if (occurrences === 0) {
  console.log('⚠️ لم يجد arr.push بالشكل المتوقع');
  // محاولة بديلة: البحث بـ "btn: btn"
  if (html.includes('btn: btn });')) {
    html = html.replace('btn: btn });', 'btn: btn, fit: (window._chzBannerState||{}).fit||"cover", position: ((window._chzBannerState||{}).x||50)+"% "+((window._chzBannerState||{}).y||50)+"%", scale: (window._chzBannerState||{}).scale||1, rotate: (window._chzBannerState||{}).rotate||0, height: (window._chzBannerState||{}).height||200, align: (window._chzBannerState||{}).align||"right", overlay: (window._chzBannerState||{}).overlay !== undefined ? window._chzBannerState.overlay : 50 });');
    console.log('✅ تم التعديل (طريقة بديلة)');
    changed = true;
  }
} else {
  console.log('⚠️ موجود ' + occurrences + ' مرات — تخطي لتجنب الحذف الخطأ');
}

// ═══ 3) حفظ فقط إذا تغير شيء ═══
if (changed && html !== original) {
  fs.writeFileSync(file + '.bak_safeinject_' + Date.now(), original);
  fs.writeFileSync(file, html);
  console.log('\n💾 تم حفظ الملف (نسخة احتياطية محفوظة)');
} else {
  console.log('\n⚠️ لا تغييرات — الملف لم يُعدّل');
}

// ═══ 4) فحص Syntax ═══
console.log('\n════════ SYNTAX ════════');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'safe_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}

// فحص banner-upload.js أيضاً
const uploadFile = 'banner-upload.js';
if (fs.existsSync(uploadFile)) {
  try {
    fs.writeFileSync('/tmp/bu_check.js', fs.readFileSync(uploadFile, 'utf8'));
    require('child_process').execSync('node --check /tmp/bu_check.js', { stdio: 'pipe' });
    console.log('✅ banner-upload.js: SAFE');
    fs.unlinkSync('/tmp/bu_check.js');
  } catch (e) {
    console.log('❌ banner-upload.js: SYNTAX ERROR');
    errs++;
  }
}

console.log('\n════════ النتيجة ════════');
if (errs === 0) {
  console.log('✅ ALL SAFE — جاهز للرفع');
  console.log('\n📊 حجم الملف:');
  console.log('  قبل: ' + original.length);
  console.log('  بعد: ' + html.length);
  console.log('  الفرق: +' + (html.length - original.length));
} else {
  console.log('❌ ' + errs + ' أخطاء — لا نرفع');
}
