const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('v218-css')) { console.log('exists'); process.exit(0); }

const css = `
<style id="v218-css">
/* V218: 3 قواعد فقط — شريط ملون فوق البطاقات */
#am .sg > .scd {
  position: relative !important;
  overflow: hidden !important;
}
#am .sg > .scd::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #7c3aed, #ec4899) !important;
}
</style>
`;

h = h.replace('</head>', css + '\n</head>');
fs.writeFileSync('index.html', h);
console.log('✅ v218: 3 قواعد CSS فقط |', before, '->', h.length);
