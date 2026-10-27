const fs = require('fs');
const os = require('os');
const path = require('path');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// ═══ 1) استخراج block #11 ═══
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, targetBlock = null;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (i !== 11) continue;
  if (/src\s*=/.test(sc[1])) continue;
  targetBlock = sc;
  break;
}

if (!targetBlock) {
  console.log('❌ لم يجد block #11');
  process.exit(1);
}

const blockStart = targetBlock.index;
const blockEnd = targetBlock.index + targetBlock[0].length;
const blockContent = targetBlock[2];

console.log('📦 block #11: ' + blockContent.length + ' حرف');

// ═══ 2) البحث عن الفاصل ═══
const commentMarker = '<!-- ═══ End PTR ═══ -->';
const splitIdx = blockContent.indexOf(commentMarker);

if (splitIdx === -1) {
  console.log('❌ لم يجد "End PTR" داخل block #11');
  process.exit(1);
}

// ═══ 3) فصل: PTR_JS | comment | <script> | enhance_JS ═══
const ptrJS = blockContent.slice(0, splitIdx).trim();
const afterComment = blockContent.slice(splitIdx + commentMarker.length);

// ابحث عن <script> داخل afterComment
const innerScriptIdx = afterComment.indexOf('<script>');
let enhanceJS = '';
if (innerScriptIdx !== -1) {
  enhanceJS = afterComment.slice(innerScriptIdx + '<script>'.length).trim();
} else {
  // لا يوجد <script> — كل شيء بعد التعليق كود JS
  enhanceJS = afterComment.trim();
}

console.log('📦 PTR_JS: ' + ptrJS.length + ' حرف');
console.log('📦 enhance_JS: ' + enhanceJS.length + ' حرف');

// ═══ 4) إعادة بناء نظيفة ═══
const newContent =
  '<script>\n' + ptrJS + '\n</script>\n\n' +
  '<!-- ═══ End PTR ═══ -->\n\n' +
  '<script>\n' + enhanceJS + '\n</script>';

// ═══ 5) تطبيق التعديل ═══
html = html.slice(0, blockStart) + newContent + html.slice(blockEnd);

// ═══ 6) حفظ ═══
fs.writeFileSync(file + '.bak_b11fix_' + Date.now(), original);
fs.writeFileSync(file, html);
console.log('\n✅ تم إصلاح block #11.');

// ═══ 7) فحص Syntax ═══
const scRe2 = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc2, j = 0, errs = 0;
while ((sc2 = scRe2.exec(html)) !== null) {
  j++;
  if (/src\s*=/.test(sc2[1])) continue;
  if (!sc2[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'b11fix_' + j + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc2[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('  ❌ block #' + j + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
    const firstLines = (e.stderr || '').toString().split('\n').filter(l => l.trim()).slice(1, 3);
    firstLines.forEach(l => console.log('      ' + l));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('\n════════ SYNTAX ════════');
console.log(errs === 0 ? '✅ SAFE TO COMMIT (' + j + ' blocks)' : '❌ ' + errs + ' errors');
