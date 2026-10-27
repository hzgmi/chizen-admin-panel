const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// ابحث عن بداية الكتلة المعطوبة بالضبط
const brokenStart = html.indexOf(`        '<div class="sc" id="sc-banners">`);
const brokenEnd = html.indexOf(`<div class="sc" id="sc-settings">'+`, brokenStart);

if (brokenStart === -1 || brokenEnd === -1) {
  console.log('❌ لم يجد الكتلة بدقة');
  console.log('  brokenStart:', brokenStart);
  console.log('  brokenEnd:', brokenEnd);
  process.exit(1);
}

console.log('📍 بداية الكتلة:', brokenStart);
console.log('📍 نهاية الكتلة:', brokenEnd);

// استخراج المحتوى (بعد '<div class="sc" id="sc-banners">' وقبل '<div class="sc" id="sc-settings">')
const openTag = `        '<div class="sc" id="sc-banners">`;
const innerStart = brokenStart + openTag.length;
const innerEnd = brokenEnd;
const innerContent = html.slice(innerStart, innerEnd);

console.log('📏 طول المحتوى الداخلي:', innerContent.length);

// إعادة بناء: كل سطر HTML يُحوَّل إلى string
const lines = innerContent.split('\n');
const rebuilt = [];
rebuilt.push(`        '<div class="sc" id="sc-banners">' +`);

for (const line of lines) {
  if (!line.trim()) continue;
  
  // احتفظ بعلامات التنصيص الموجودة، أضف علامات جديدة حول المحتوى
  let escaped = line
    .replace(/\\/g, '\\\\')   // escape backslashes first
    .replace(/'/g, "\\'");     // escape single quotes
  
  rebuilt.push(`'${escaped}' +`);
}

// استبدال الجزء الأخير
const replacement = rebuilt.join('\n').slice(0, -2) + `\n        '<div class="sc" id="sc-settings">' +`;

// تطبيق التعديل
html = html.slice(0, brokenStart) + replacement + html.slice(brokenEnd + `<div class="sc" id="sc-settings">'+`.length);

// حفظ
fs.writeFileSync(file + '.bak_careful_' + Date.now(), original);
fs.writeFileSync(file, html);

console.log('✅ تم إصلاح الكتلة.');

// فحص Syntax
const os = require('os');
const path = require('path');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'cfx_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('  ❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
    // طباعة أول سطر من الخطأ
    const firstErrLine = (e.stderr || '').toString().split('\n').filter(l => l.trim()).slice(0, 2);
    firstErrLine.forEach(l => console.log('      ' + l));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('\n════════ SYNTAX ════════');
console.log(errs === 0 ? '✅ SAFE TO COMMIT (' + i + ' blocks)' : '❌ ' + errs + ' errors');
