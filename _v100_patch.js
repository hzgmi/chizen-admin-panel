const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v100-main"')) { console.log('already patched'); process.exit(0); }
if (h.includes('id="v100-css"')) { console.log('css exists but main missing — manual fix needed'); process.exit(1); }

const css = fs.readFileSync('_v100_css.css', 'utf8');
const js = fs.readFileSync('_v100_js.js', 'utf8');
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');

const block = '\n<style id="v100-css">' + css + '</style>\n<script id="v100-main">' + safeJs + '<\/script>\n';

const idx = h.lastIndexOf('</body>');
if (idx === -1) { console.log('❌ </body> not found'); process.exit(1); }

h = h.slice(0, idx) + block + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ patched:', before, '->', h.length, '(+' + (h.length - before) + ')');
