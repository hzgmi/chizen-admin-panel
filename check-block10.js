const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('index.html', 'utf8');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (i !== 10) continue;
  if (/src\s*=/.test(sc[1])) continue;
  const lines = sc[2].split('\n');
  console.log('═══ block #10 — الأسطر 40-60 ═══');
  for (let j = 39; j < Math.min(lines.length, 60); j++) {
    console.log((j + 1) + ': ' + lines[j]);
  }
  break;
}
