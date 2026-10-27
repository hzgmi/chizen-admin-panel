const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// ═══ 1) البحث عن الكتلة المعطوبة (من <!-- BANNERS TAB --> حتى </script>) ═══
const brokenStart = html.indexOf('<!-- BANNERS TAB -->');
if (brokenStart === -1) {
  console.log('❌ لم يجد الكتلة');
  process.exit(1);
}

// ابحث عن بداية <script> التي تحتوي عليها
const scriptOpen = html.lastIndexOf('<script', brokenStart);
const scriptClose = html.indexOf('</script>', brokenStart);

if (scriptOpen === -1 || scriptClose === -1) {
  console.log('❌ لم يجد بداية/نهاية <script>');
  process.exit(1);
}

console.log('📍 بداية <script>: ' + scriptOpen);
console.log('📍 بداية الكتلة: ' + brokenStart);
console.log('📍 نهاية </script>: ' + scriptClose);

// ═══ 2) استخراج الكتلة المعطوبة ═══
const brokenContent = html.slice(brokenStart, scriptClose);
console.log('\n📋 محتوى الكتلة المعطوبة (أول 300 حرف):');
console.log(brokenContent.slice(0, 300));

// ═══ 3) فصل CSS/HTML عن JS ═══
// نجد آخر } قبل <style> (نهاية JavaScript الحقيقي)
const styleStart = brokenContent.indexOf('<style');
const beforeStyle = brokenContent.slice(0, styleStart).trim();
const styleAndRest = brokenContent.slice(styleStart).trim();

console.log('\n📋 JavaScript قبل <style>: ' + beforeStyle.length + ' حرف');
console.log('📋 CSS+HTML+JS بعد <style>: ' + styleAndRest.length + ' حرف');

// ═══ 4) إعادة بناء ═══
// JavaScript يصبح: beforeStyle + </script>
const jsPart = beforeStyle + '\n';

// CSS + HTML + script منفصل
const htmlPart = '\n<!-- ═══ PTR Assets ═══ -->\n' + styleAndRest + '\n<!-- ═══ End PTR ═══ -->\n';

// ═══ 5) بناء الملف الجديد ═══
// احذف الكتلة القديمة من داخل script
let newHtml = html.slice(0, scriptOpen) + '<script' + html.slice(scriptOpen + 7, brokenStart).replace(/<style[\s\S]*$/, '') + jsPart + '</script>' + htmlPart + html.slice(scriptClose + '</script>'.length);

// ═══ 6) حفظ ═══
fs.writeFileSync(file + '.bak_extractptr_' + Date.now(), original);
fs.writeFileSync(file, newHtml);
console.log('\n✅ تم استخراج PTR من داخل <script>.');

// ═══ 7) فحص ═══
const os = require('os');
const path = require('path');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
while ((sc = scRe.exec(newHtml)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'ptr_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('  ❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
    const errText = (e.stderr || '').toString().split('\n').filter(l => l.trim()).slice(1, 3);
    errText.forEach(l => console.log('      ' + l));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('\n════════ SYNTAX ════════');
console.log(errs === 0 ? '✅ SAFE TO COMMIT (' + i + ' blocks)' : '❌ ' + errs + ' errors');
