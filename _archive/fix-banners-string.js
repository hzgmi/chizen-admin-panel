const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// البحث عن الكتلة المعطوبة
const brokenStart = html.indexOf(`'<div class="sc" id="sc-banners">`);
const brokenEnd = html.indexOf(`'<div class="sc" id="sc-settings">`, brokenStart);

if (brokenStart === -1 || brokenEnd === -1) {
  console.log('❌ لم يجد الكتلة');
  process.exit(1);
}

// استخراج المحتوى الداخلي
const inner = html.slice(brokenStart + `'<div class="sc" id="sc-banners">`.length, brokenEnd);

// إعادة بناء الكتلة الصحيحة
const fixed = `'<div class="sc" id="sc-banners">' +\n` +
  // إضافة ' قبل وبعد كل سطر HTML
  inner.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    // إذا كان السطر ينتهي بـ + أو يبدأ بـ ' => تجاوزه
    if (trimmed.endsWith('+') || trimmed.startsWith("'")) {
      return line;
    }
    // إضافة ' في بداية ونهاية السطر
    return `'${line}' +`;
  }).filter(l => l).join('\n') +
  `\n'`;

// استبدال
html = html.slice(0, brokenStart) + fixed + html.slice(brokenEnd);

// حفظ
fs.writeFileSync(file + '.bak_stringfix_' + Date.now(), original);
fs.writeFileSync(file, html);

console.log('✅ تم إصلاح علامات التنصيص في sc-banners.');

// فحص
console.log('\n═══ التحقق ═══');
const newStart = html.indexOf(`'<div class="sc" id="sc-banners">'`);
console.log('  ' + (newStart !== -1 ? '✅' : '❌') + ' بداية sc-banners صحيحة');

// فحص Syntax للكتلة
const os = require('os');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = require('path').join(os.tmpdir(), 'sfx_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('  ❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('\n════════ SYNTAX ════════');
console.log(errs === 0 ? '✅ SAFE TO COMMIT (' + i + ' blocks)' : '❌ ' + errs + ' errors');
