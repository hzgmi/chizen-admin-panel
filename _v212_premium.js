const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

if (h.includes('id="v212-css"')) { console.log('⚠️ مطبق مسبقاً'); process.exit(0); }

const css = `
<style id="v212-css">
/* ═══════════ V212 PREMIUM ADMIN ═══════════ */

/* خلفية متدرجة فخمة */
body, #am {
  background: #0a0825 !important;
  font-family: 'Tajawal', system-ui, -apple-system, sans-serif !important;
}
#am {
  min-height: 100vh !important;
  background: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, rgba(236,72,153,0.05) 30%, transparent 60%), #0a0825 !important;
}

/* ═══ الشعار ═══ */
.gl, #am .gl {
  font-weight: 900 !important;
  letter-spacing: 3px !important;
  background: linear-gradient(135deg, #7c3aed, #ec4899) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}
.gt, #am .gt {
  color: #a78bfa !important;
  letter-spacing: 4px !important;
  font-size: 10px !important;
  font-weight: 700 !important;
}

/* ═══ التبويبات (الرئيسية/الطلبات/... ) ═══ */
.tb {
  background: rgba(155,77,255,0.08) !important;
  border: 1px solid rgba(155,77,255,0.2) !important;
  color: #a78bfa !important;
  border-radius: 14px !important;
  padding: 10px 16px !important;
  font-weight: 800 !important;
  font-family: inherit !important;
  font-size: 13px !important;
  transition: all 0.25s ease !important;
  cursor: pointer !important;
}
.tb:hover { background: rgba(155,77,255,0.15) !important; }
.tb.active, .tb.on {
  background: linear-gradient(135deg, #7c3aed, #ec4899) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 8px 24px rgba(168,85,247,0.4) !important;
}

/* ═══ شريط ملون فوق لوحة التحكم ═══ */
#sc-dash::before {
  content: '' !important;
  display: block !important;
  height: 4px !important;
  background: linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed) !important;
  border-radius: 3px !important;
  margin: 4px 4px 18px !important;
  box-shadow: 0 0 20px rgba(168,85,247,0.5) !important;
}

/* ═══ شبكات الإحصائيات ═══ */
.sg {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 12px !important;
  margin-bottom: 16px !important;
}
.sg3 {
  display: grid !important;
  grid-template-columns: 1fr 1fr 1fr !important;
  gap: 10px !important;
  margin-bottom: 16px !important;
}

/* ═══ بطاقات الإحصائيات ═══ */
.scd {
  background: linear-gradient(135deg, #1a1230 0%, #121028 100%) !important;
  border: 1px solid rgba(155,77,255,0.25) !important;
  border-radius: 18px !important;
  padding: 16px 12px !important;
  position: relative !important;
  overflow: hidden !important;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important;
}
.scd::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important; left: 0 !important; right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #7c3aed, #ec4899) !important;
  opacity: 0.9 !important;
}
.scd:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 32px rgba(168,85,247,0.2) !important;
  border-color: rgba(168,85,247,0.45) !important;
}

/* ═══ الأرقام والعناوين ═══ */
.sv {
  color: #fff !important;
  font-size: 22px !important;
  font-weight: 900 !important;
  margin: 4px 0 !important;
  line-height: 1.15 !important;
}
.sl {
  color: #a78bfa !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: uppercase !important;
}
.ss {
  color: #6b5a8a !important;
  font-size: 10px !important;
  margin-top: 4px !important;
}

/* ═══ عناوين الأقسام ═══ */
.ib {
  color: #fff !important;
  font-size: 15px !important;
  font-weight: 900 !important;
  margin: 8px 0 14px 0 !important;
  padding-bottom: 10px !important;
  border-bottom: 1px solid rgba(155,77,255,0.15) !important;
}

/* ═══ البطاقات العامة ═══ */
.cd {
  background: linear-gradient(135deg, #1a1230 0%, #121028 100%) !important;
  border: 1px solid rgba(155,77,255,0.2) !important;
  border-radius: 18px !important;
  padding: 16px !important;
  margin-bottom: 14px !important;
}
.cti {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 12px !important;
}
.ctl {
  color: #fff !important;
  font-size: 14px !important;
  font-weight: 800 !important;
}

/* ═══ الأزرار ═══ */
.btn {
  border-radius: 12px !important;
  padding: 10px 18px !important;
  font-weight: 800 !important;
  font-family: inherit !important;
  font-size: 12px !important;
  cursor: pointer !important;
  transition: transform 0.15s, background 0.2s !important;
  border: none !important;
}
.btn:active { transform: scale(0.96) !important; }
.bg2 {
  background: rgba(155,77,255,0.15) !important;
  color: #a78bfa !important;
  border: 1px solid rgba(155,77,255,0.3) !important;
}
.bsm { padding: 8px 14px !important; font-size: 11px !important; }

/* ═══ شبكة الأدوات (المزيد) ═══ */
.more-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 10px !important;
}
.more-grid > * {
  background: linear-gradient(135deg, #1a1230 0%, #121028 100%) !important;
  border: 1px solid rgba(155,77,255,0.2) !important;
  border-radius: 16px !important;
  padding: 16px 10px !important;
  text-align: center !important;
  cursor: pointer !important;
  transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s !important;
  color: #fff !important;
  font-weight: 700 !important;
  font-size: 12px !important;
}
.more-grid > *:active {
  transform: scale(0.95) !important;
  border-color: #a78bfa !important;
  box-shadow: 0 8px 24px rgba(168,85,247,0.3) !important;
}

/* ═══ بطاقات الطلبات الأخيرة والمخزون ═══ */
#recent-orders > *, #low-stock-list > * {
  background: rgba(155,77,255,0.05) !important;
  border: 1px solid rgba(155,77,255,0.1) !important;
  border-radius: 12px !important;
  padding: 10px 12px !important;
  margin-bottom: 8px !important;
  color: #ccc !important;
  font-size: 12px !important;
}
#recent-orders > *:last-child, #low-stock-list > *:last-child {
  margin-bottom: 0 !important;
}

/* ═══ شريط التمرير ═══ */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(155,77,255,0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(155,77,255,0.5); }
</style>
`;

h = h.replace('</head>', css + '\n</head>');
fs.writeFileSync('index.html', h);
console.log('✅ v212: التصميم الفخم مطبق');
