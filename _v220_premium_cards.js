const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('<!-- v220-applied -->')) { console.log('already applied'); process.exit(0); }

// ═══ 1. بطاقة الترحيب بعد #dash-v2 ═══
const dashAnchor = '<div id="dash-v2"></div>';
if (h.indexOf(dashAnchor) === -1) { console.log('❌ dash-v2 not found'); process.exit(1); }

const welcomeCard = '<div style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);border-radius:22px;padding:24px 20px;margin:0 0 18px;color:#fff;box-shadow:0 12px 36px rgba(168,85,247,0.4);position:relative;overflow:hidden">'
  + '<div style="font-size:32px;margin-bottom:8px;line-height:1">👋</div>'
  + '<h2 style="margin:0 0 6px;font-size:19px;font-weight:900;color:#fff;letter-spacing:-0.3px">مرحباً بك في CHIZEN</h2>'
  + '<p style="margin:0;font-size:12px;opacity:0.95;color:#fff;font-weight:500">لوحة الإدارة العامة — نظرة سريعة على أداء اليوم</p>'
  + '</div>';

h = h.replace(dashAnchor, dashAnchor + welcomeCard);

// ═══ 2. استبدال شبكة KPI بـ Glassmorphism ═══
const sgStart = "'<div class=\"sg\">'+";
const sgEnd = "'<div class=\"sg3\">'+";
const startIdx = h.indexOf(sgStart);
const endIdx = h.indexOf(sgEnd, startIdx);

if (startIdx === -1 || endIdx === -1) { console.log('❌ sg markers not found'); process.exit(1); }

function card(id, idSuffix, icon, label, defaultVal, colorMain, colorLight) {
  return "'<div class=\"scd\" style=\"background:linear-gradient(135deg,rgba(" + colorMain + ",0.15) 0%,rgba(10,8,37,0.4) 100%);border:1px solid rgba(" + colorMain + ",0.35);border-radius:16px;padding:16px 12px;position:relative;box-shadow:0 6px 24px rgba(" + colorMain + ",0.15)\">"
    + "<div style=\"font-size:24px;margin-bottom:8px;line-height:1\">" + icon + "</div>"
    + "<div class=\"sv\" id=\"" + id + "\" style=\"font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;line-height:1.1\">" + defaultVal + "</div>"
    + "<div class=\"sl\" style=\"font-size:11px;color:" + colorLight + ";font-weight:800;letter-spacing:0.3px\">" + label + "</div>"
    + "<div class=\"ss\" id=\"" + id + "-s\" style=\"font-size:10px;color:#a78bfa;margin-top:4px;opacity:0.7\">—</div>"
    + "</div>'+";
}

const newGrid = "        '<div class=\"sg\" style=\"display:grid !important;grid-template-columns:repeat(auto-fit,minmax(140px,1fr)) !important;gap:12px !important;margin-bottom:18px\">'+\n"
  + "          " + card('d-sales', 's', '💰', 'المبيعات', '0 ر.س', '236,72,153', '#f0abfc') + "\n"
  + "          " + card('d-orders', 's', '📦', 'الطلبات', '0', '124,58,237', '#c4b5fd') + "\n"
  + "          " + card('d-products', 's', '🛍️', 'المنتجات', '0', '168,85,247', '#d8b4fe') + "\n"
  + "          " + card('d-users', 's', '👥', 'المستخدمين', '0', '6,182,212', '#67e8f9') + "\n"
  + "        '</div>'+\n        ";

h = h.slice(0, startIdx) + newGrid + h.slice(endIdx);

// ═══ 3. علامة التطبيق ═══
h = h.replace('</head>', '<!-- v220-applied -->\n</head>');

fs.writeFileSync('index.html', h);
console.log('✅ v220: بطاقة ترحيب + 4 KPI premium |', before, '->', h.length);
