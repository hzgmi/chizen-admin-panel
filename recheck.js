const fs = require('fs');
const { execSync } = require('child_process');
const html = fs.readFileSync('index.html', 'utf8');
const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
let fail = 0;
tags.forEach((m, i) => {
  if (/src=/.test(m[1]) || !m[2].trim()) return;
  fs.writeFileSync('.chk.js', m[2]);
  try { execSync('node --check .chk.js', { stdio: 'pipe' }); }
  catch (e) {
    fail++;
    console.log(`❌ #${i+1}`);
    console.log((e.stderr||e.stdout||'').toString().split('\n').slice(0,6).join('\n'));
  }
});
fs.unlinkSync('.chk.js');
console.log(fail === 0 ? '✅ ALL INLINE SCRIPTS PASS' : `❌ ${fail} FAILED`);
process.exit(fail ? 1 : 0);
