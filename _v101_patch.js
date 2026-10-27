const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
if (h.includes('id="v101-main"')) { console.log('already patched'); process.exit(0); }
const css = fs.readFileSync('_v101_css.css', 'utf8');
const js = fs.readFileSync('_v101_js.js', 'utf8');
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
const block = '\n<style id="v101-css">' + css + '</style>\n<script id="v101-main">' + safeJs + '<\/script>\n';
const idx = h.lastIndexOf('</body>');
if (idx === -1) { console.log('❌ </body> not found'); process.exit(1); }
h = h.slice(0, idx) + block + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ patched:', before, '->', h.length, '(+' + (h.length - before) + ')');
