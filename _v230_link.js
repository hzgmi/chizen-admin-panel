const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

if (h.includes('v230-link')) { console.log('exists'); process.exit(0); }

// إضافة زر في buildSections — قبل #dash-v2
const anchor = '`<div class="sc active" id="sc-dash">';
if (h.indexOf(anchor) === -1) { console.log('❌ anchor not found'); process.exit(1); }

const btn = '<a href="dashboard.html" style="display:block;text-decoration:none;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:16px 18px;margin-bottom:16px;color:#fff;box-shadow:0 10px 30px rgba(168,85,247,0.35)"><div style="display:flex;align-items:center;gap:12px"><div style="font-size:28px">✨</div><div style="flex:1"><div style="font-size:15px;font-weight:900;margin-bottom:2px">لوحة حديثة</div><div style="font-size:11px;opacity:0.9">تجربة فخمة بإحصائيات فورية</div></div><div style="font-size:20px">→</div></div></a>';

h = h.replace(anchor, anchor + '\n' + btn);

h = h.replace('</head>', '<!-- v230-link -->\n</head>');
fs.writeFileSync('index.html', h);
console.log('✅ v230: زر لوحة حديثة');
