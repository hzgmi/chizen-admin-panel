const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف v212 (السبب المحتمل)
let removed = 0;
const v212Re = /<style id="v212-css">[\s\S]*?<\/style>/g;
const matches = h.match(v212Re);
if (matches) {
  removed = matches.length;
  h = h.replace(v212Re, '');
  console.log('✅ حذف v212:', removed, 'كتلة');
}

// 2. v213 آمن جداً — فقط ألوان دون لمس layout
const safeCss = `
<style id="v213-css">
/* v213: Ultra-safe — colors only, NO layout/font changes */
#am { background-color: #0a0825 !important; }

#am .scd {
  background-color: #1a1230 !important;
  border: 1px solid rgba(155,77,255,0.25) !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
}
#am .cd {
  background-color: #1a1230 !important;
  border: 1px solid rgba(155,77,255,0.2) !important;
  border-radius: 16px !important;
}
#am .sv { color: #ffffff !important; }
#am .sl { color: #a78bfa !important; }
#am .ss { color: #6b5a8a !important; }
#am .ib { color: #ffffff !important; }
#am .ctl { color: #ffffff !important; }
#am .gl {
  background: linear-gradient(135deg, #7c3aed, #ec4899) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}
#am .tb {
  background-color: rgba(155,77,255,0.08) !important;
  color: #a78bfa !important;
  border: 1px solid rgba(155,77,255,0.2) !important;
  border-radius: 12px !important;
}
#am .tb.active, #am .tb.on {
  background: linear-gradient(135deg, #7c3aed, #ec4899) !important;
  color: #ffffff !important;
  border-color: transparent !important;
  box-shadow: 0 6px 20px rgba(168,85,247,0.4) !important;
}
</style>
`;

if (!h.includes('v213-css')) {
  h = h.replace('</head>', safeCss + '\n</head>');
  console.log('✅ أضيف v213 (آمن)');
}

fs.writeFileSync('index.html', h);
console.log('الحجم:', before, '->', h.length);
