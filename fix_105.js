const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'index.html';
const html = fs.readFileSync(FILE, 'utf8');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `${FILE}.bak.${stamp}`;
fs.writeFileSync(backup, html, 'utf8');
console.log('📦 نسخة احتياطية:', backup);

const broken = `'<div class="sc active" id="sc-dash">\n<div class="cd" id="dash-c"></div>'+`;
const fixed  = '`<div class="sc active" id="sc-dash">\n<div class="cd" id="dash-c"></div>`+';

const hits = html.split(broken).length - 1;
if (hits !== 1) {
  console.error(`❌ النمط المكسور ظهر ${hits} مرة — متوقع مرة واحدة. توقف.`);
  process.exit(1);
}

const newHtml = html.replace(broken, fixed);
fs.writeFileSync(FILE, newHtml, 'utf8');
console.log('✅ تم استبدال سلسلة السطرين بـ template literal');

const tags = [...newHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
let fail = 0, total = 0;
for (const m of tags) {
  if (/src=/.test(m[1]) || !m[2].trim()) continue;
  total++;
  fs.writeFileSync('.chk.js', m[2]);
  try { execSync('node --check .chk.js', { stdio: 'pipe' }); }
  catch (e) {
    fail++;
    console.log(`❌ inline #${total}:`);
    console.log((e.stderr || e.stdout || '').toString().split('\n').slice(0, 6).join('\n'));
  }
}
try { fs.unlinkSync('.chk.js'); } catch {}

const o = (newHtml.match(/<script\b/g) || []).length;
const c = (newHtml.match(/<\/script>/g) || []).length;
const tagOk = o === c;
console.log(`📊 inline scripts: ${total}, failed: ${fail}, script tags: ${o}/${c} ${tagOk ? '✅' : '❌'}`);

if (fail > 0 || !tagOk) {
  console.error('\n❌ توقف — لا ترفع. الملف الأصلي سليم في النسخة الاحتياطية. أرسل المخرج.');
  process.exit(1);
}

console.log('\n✅ كل الفحوصات نجحت — آمن للرفع.');
console.log('للرفع الآن، شغّل السطر اللي بعد هذا البلوك مباشرة.');
