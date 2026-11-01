const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

const REMOVE_IDS = [
  'chz-acct-v88',
  'chz-acct-v89-css',
  'chz-acct-v89-logic',
  'chz-acct-v90-css',
  'chz-acct-v90',
  'chz-navbar-fix-v90',
  'chz-force-navbar-v91',
  'chz-autofix-v92-css',
  'chz-autofix-v92',
  'v92-debug-panel'
];

let totalRemoved = 0;

REMOVE_IDS.forEach(id => {
  let count = 0;
  
  // <script id="X">...</script>
  const scriptRe = new RegExp('<script[^>]*\\bid="' + id + '"[^>]*>[\\s\\S]*?<\\/script>', 'gi');
  h = h.replace(scriptRe, () => { count++; return ''; });
  
  // <style id="X">...</style>
  const styleRe = new RegExp('<style[^>]*\\bid="' + id + '"[^>]*>[\\s\\S]*?<\\/style>', 'gi');
  h = h.replace(styleRe, () => { count++; return ''; });
  
  // <div id="X">...</div>
  let searchFrom = 0;
  while (true) {
    const startIdx = h.indexOf('<div id="' + id + '"', searchFrom);
    if (startIdx === -1) break;
    let depth = 0, i = startIdx, endIdx = -1;
    while (i < h.length) {
      if (h.substr(i, 4) === '<div') { depth++; i += 4; continue; }
      if (h.substr(i, 6) === '</div>') { depth--; i += 6; if (depth === 0) { endIdx = i; break; } continue; }
      i++;
    }
    if (endIdx === -1) break;
    h = h.slice(0, startIdx) + h.slice(endIdx);
    count++;
    searchFrom = startIdx;
  }
  
  if (count > 0) {
    console.log('✅ Removed', count, 'element(s):', id);
    totalRemoved += count;
  }
});

// Also purge style id chz-navbar-fix-v90 (the JS version has data-v90=undefined, but style has id)
// And the actual v91 style had id, and v90-fix-navbar had both.

fs.writeFileSync(p, h);
console.log('');
console.log('Total removed:', totalRemoved, 'elements');
console.log('Size:', before, '->', h.length, '(', before - h.length, 'bytes saved)');
