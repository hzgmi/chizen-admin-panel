const fs = require('fs');
function check(path) {
  const h = fs.readFileSync(path, 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0, errs = 0;
  while ((m = re.exec(h)) !== null) {
    i++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) { errs++; console.log('FAIL block ' + i + ': ' + e.message); }
  }
  console.log('OK ' + path + ' | blocks: ' + i + ' | errors: ' + errs);
}
check(process.argv[2]);
