const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف v214 CSS
h = h.replace(/<style id="v214-css">[\s\S]*?<\/style>/g, '');
// 2. حذف v214 JS
h = h.replace(/<script id="v214-js">[\s\S]*?<\/script>/g, '');
// 3. حذف أي بقايا
h = h.replace(/id="v214-welcome"/g, '');
h = h.replace(/id="v214-css"/g, '');

// 4. تأكيد أن v213 موجود (لو حُذف، نعيده)
if (!h.includes('v213-css')) {
  const safeCss = `
<style id="v213-css">
#am { background-color: #0a0825 !important; }
#am .scd { background-color: #1a1230 !important; border: 1px solid rgba(155,77,255,0.25) !important; border-radius: 16px !important; }
#am .cd { background-color: #1a1230 !important; border: 1px solid rgba(155,77,255,0.2) !important; border-radius: 16px !important; }
#am .sv { color: #ffffff !important; }
#am .sl { color: #a78bfa !important; }
#am .ss { color: #6b5a8a !important; }
#am .ib { color: #ffffff !important; }
#am .ctl { color: #ffffff !important; }
#am .gl { background: linear-gradient(135deg, #7c3aed, #ec4899) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; }
#am .tb { background-color: rgba(155,77,255,0.08) !important; color: #a78bfa !important; border: 1px solid rgba(155,77,255,0.2) !important; border-radius: 12px !important; }
#am .tb.active, #am .tb.on { background: linear-gradient(135deg, #7c3aed, #ec4899) !important; color: #ffffff !important; border-color: transparent !important; }
</style>
`;
  h = h.replace('</head>', safeCss + '\n</head>');
  console.log('✅ v213 أعيد');
}

fs.writeFileSync('index.html', h);
console.log('✅ v214 محذوف |', before, '->', h.length);
