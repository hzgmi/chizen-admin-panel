const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (i !== 11) continue;
  if (/src\s*=/.test(sc[1])) continue;
  const lines = sc[2].split('\n');
  console.log('═══ block #11 — الأسطر 65-85 ═══');
  for (let j = 64; j < Math.min(lines.length, 85); j++) {
    const marker = (j + 1 === 72) ? ' ← الخطأ' : '';
    console.log((j + 1) + ': ' + lines[j] + marker);
  }
  break;
}
