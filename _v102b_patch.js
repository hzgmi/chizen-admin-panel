const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
if (h.includes('id="v102b-main"')) { console.log('already patched'); process.exit(0); }
const js = fs.readFileSync('_v102b_js.js', 'utf8');
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
const block = '\n<script id="v102b-main">' + safeJs + '<\/script>\n';
// حقن قبل </body>
const idx = h.lastIndexOf('</body>');
if (idx === -1) { console.log('❌ </body> not found'); process.exit(1); }
h = h.slice(0, idx) + block + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ patched:', before, '->', h.length);
