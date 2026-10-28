const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
if (h.includes('id="v102d-main"')) { console.log('مطبق مسبقاً'); process.exit(0); }
const js = fs.readFileSync('_v102d_js.js', 'utf8');
const block = '\n<script id="v102d-main">' + js.replace(/<\/script>/gi, '<\\/script>') + '<\/script>\n';
const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + block + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ patched:', before, '->', h.length);
