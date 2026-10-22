const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const inline = tags.filter(m => !/src=/.test(m[1]) && m[2].trim());
if (!inline.length) { console.error('no inline script'); process.exit(1); }
const target = inline[0]; // أول inline script = #8 في ترقيمك
const body = target[2];
const bodyStart = target.index + target[0].indexOf('>') + 1;
const bodyLines = body.split('\n');
const errLine = 105;

console.log(`inline scripts: ${inline.length}, total body lines: ${bodyLines.length}`);
console.log(`\n===== context L${errLine-6} .. L${errLine+50} =====`);
for (let i = Math.max(1, errLine - 6); i <= Math.min(errLine + 50, bodyLines.length); i++) {
  const mark = i === errLine ? '>>' : '  ';
  console.log(`${mark} L${i}: ${bodyLines[i-1]}`);
}

// hexdump للتحقق من أحرف شاذة على السطر المكسور
const brokenLine = bodyLines[errLine - 1];
const bad = [...brokenLine].map((c, idx) => {
  const cp = c.codePointAt(0);
  return (cp > 126 && cp !== 0x0a) ? { idx, cp: 'U+' + cp.toString(16).toUpperCase().padStart(4,'0'), c } : null;
}).filter(Boolean);
if (bad.length) console.log('\n⚠️ non-ASCII على السطر المكسور:', bad);

// احسب موقع أول ' على السطر المكسور
const relCol = brokenLine.indexOf("'");
if (relCol === -1) { console.log('لم أجد \' على السطر — تحقق يدوي'); process.exit(0); }

let absPos = 0;
for (let i = 0; i < errLine - 1; i++) absPos += bodyLines[i].length + 1;
absPos += relCol;

// امسح للأمام بحثاً عن ' القافلة
let i2 = absPos + 1, esc = false, closePos = -1;
while (i2 < body.length) {
  const ch = body[i2];
  if (esc) { esc = false; i2++; continue; }
  if (ch === '\\') { esc = true; i2++; continue; }
  if (ch === "'") { closePos = i2; break; }
  i2++;
}

if (closePos === -1) {
  console.log('\n❌ لم أجد \' قافلة — السلسلة تبتلع باقي السكربت. سنصلحها يدوياً بناءً على السياق.');
  process.exit(0);
}

const linesBefore = body.slice(0, closePos).split('\n');
const closeLine = linesBefore.length;
const closeCol = linesBefore[linesBefore.length - 1].length;
console.log(`\n✅ القافلة المفترضة: L${closeLine} عمود ${closeCol}`);
console.log(`   محتوى القافلة: ${bodyLines[closeLine-1].slice(Math.max(0, closeCol-60), closeCol+5).replace(/\n/g,'⏎')}`);

const inner = body.slice(absPos + 1, closePos);
const hasBacktick = /`/.test(inner);
const hasDollarBrace = /\$\{/.test(inner);
console.log(`\nتحقق: backtick داخل النص=${hasBacktick}, \${ داخل النص=${hasDollarBrace}`);
console.log(`طول النص الداخلي: ${inner.length} حرف، ${inner.split('\n').length} سطر`);

// لو مررنا --fix، نطبق الإصلاح
if (process.argv.includes('--fix')) {
  const escaped = inner.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const newBody = body.slice(0, absPos) + '`' + escaped + '`' + body.slice(closePos + 1);
  const newHtml = html.slice(0, bodyStart) + newBody + html.slice(bodyStart + body.length);
  fs.writeFileSync('index.html.bak', html, 'utf8');
  fs.writeFileSync('index.html', newHtml, 'utf8');
  console.log('\n✅ FIX APPLIED: index.html محدّث، backup في index.html.bak');
}
