const fs = require('fs');
const os = require('os');
const path = require('path');
const html = fs.readFileSync('index.html', 'utf8');

const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
const errorBlocks = [];

while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'now_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 5000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    errorBlocks.push({ block: i, line: errLine ? errLine[1] : '?', content: sc[2] });
    console.log('❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}

console.log('\n════════ ملخص ════════');
console.log('  إجمالي الكتل: ' + i);
console.log('  أخطاء: ' + errs);

// طباعة محتوى أول كتلة معطوبة
if (errorBlocks.length > 0) {
  const eb = errorBlocks[0];
  console.log('\n📋 محتوى block #' + eb.block + ' (أول 800 حرف):');
  console.log(eb.content.slice(0, 800));
}
