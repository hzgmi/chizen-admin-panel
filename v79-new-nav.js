const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;
let ops = [];

// ═══ 1) Replace 19 tabs with 4 ═══
const oldTabsStart = h.indexOf('<div class="tbs">');
if (oldTabsStart === -1) { console.log('❌ tbs not found'); process.exit(1); }
const oldTabsEnd = h.indexOf('</div>', h.indexOf('<button class="tb" onclick="A.tab(\'pickup\'', oldTabsStart));
if (oldTabsEnd === -1) { console.log('❌ tbs end not found'); process.exit(1); }
const tabsEndFull = oldTabsEnd + 6;

const newTabs = `<div class="tbs">
<button class="tb active" data-tab="dash" onclick="A.tab('dash',this)">🏠 الرئيسية</button>
<button class="tb" data-tab="orders" onclick="A.tab('orders',this)">🛒 الطلبات</button>
<button class="tb" data-tab="team" onclick="A.tab('team',this)">👥 الفريق</button>
<button class="tb" data-tab="more" onclick="A.tab('more',this)">➕ المزيد</button>
</div>`;

h = h.slice(0, oldTabsStart) + newTabs + h.slice(tabsEndFull);
ops.push('tab bar replaced (19 → 4)');

// ═══ 2) Insert new screens before sc-dash ═══
// Find sc-dash start
const dashIdx = h.indexOf('id="sc-dash"');
if (dashIdx === -1) { console.log('❌ sc-dash not found'); process.exit(1); }

// Find the opening backtick before sc-dash
const dashOpen = h.lastIndexOf('`<div class="sc active" id="sc-dash">', dashIdx);
if (dashOpen === -1) {
  // Try alternative: find the `<div class="sc active" id="sc-dash">` exactly
  const altOpen = h.lastIndexOf('<div class="sc active" id="sc-dash">', dashIdx);
  if (altOpen === -1) { console.log('❌ dash container not found'); process.exit(1); }
}

// Find where sc-dash ENDS — next `'<div class="sc"` or backtick close
let dashEnd = -1;
const afterDash = h.indexOf("'<div class=\"sc\" id=\"sc-reports\">'", dashIdx);
if (afterDash !== -1) {
  dashEnd = afterDash;
} else {
  // Find next '</script>' as fallback — not ideal
  dashEnd = h.indexOf('</script>', dashIdx);
}

console.log('Dash region:', dashIdx, 'to', dashEnd);

// Insert sc-team and sc-more BEFORE sc-dash (right before the backtick that opens sc-dash)
// Actually, insert them as separate concatenated strings AFTER sc-reports start
// Better: insert right before sc-dash's backtick — but need to be in same template string

// Let me take a different approach — find the backtick that starts sc-dash
const backtickBeforeDash = h.lastIndexOf('`', dashIdx);
if (backtickBeforeDash === -1) { console.log('❌ backtick not found'); process.exit(1); }

// Insert team + more screens BEFORE the backtick (so they go into concat chain)
const newScreens = `
'<div class="sc" id="sc-team">'+
'<div class="ib">👥 الفريق والأقسام — مراقبة بصرية</div>'+
'<div id="team-content"></div>'+
'</div>'+
'<div class="sc" id="sc-more">'+
'<div class="ib">➕ كل الأدوات</div>'+
'<div class="more-grid" id="more-grid"></div>'+
'</div>'+
`;

h = h.slice(0, backtickBeforeDash) + newScreens + h.slice(backtickBeforeDash);
ops.push('sc-team + sc-more inserted');

// ═══ 3) Replace sc-dash content with new dashboard ═══
// Get current sc-dash block
const dashStart = h.indexOf('`<div class="sc active" id="sc-dash">');
if (dashStart === -1) {
  // Try after our insertion, the backtick pattern
  const altStart = h.indexOf('`<div class="sc active" id="sc-dash">');
  if (altStart === -1) { console.log('❌ dash backtick not found'); process.exit(1); }
}

const dashBlockStart = h.indexOf('`<div class="sc active" id="sc-dash">');
if (dashBlockStart !== -1) {
  // Find the matching end — next backtick at same level
  const backtickEnd = h.indexOf('`', dashBlockStart + 1);
  if (backtickEnd > dashBlockStart) {
    const newDash = `\`<div class="sc active" id="sc-dash">
<div id="dash-v2"></div>
\``;
    h = h.slice(0, dashBlockStart) + newDash + h.slice(backtickEnd + 1);
    ops.push('sc-dash content replaced');
  }
}

// ═══ 4) CSS ═══
const css = `<style id="chz-admin-v79-css">
/* ═══ Dashboard v2 ═══ */
.dash-alerts { margin-bottom: 16px; }
.dash-alerts-title {
  font-size: 13px; font-weight: 900; color: #f87171;
  margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
  font-family: 'Tajawal', sans-serif;
}
.dash-alert {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.06));
  border: 1.5px solid rgba(239,68,68,0.25);
  border-radius: 12px; margin-bottom: 8px;
  cursor: pointer; transition: transform 0.15s ease;
  font-family: 'Tajawal', sans-serif;
}
.dash-alert:active { transform: scale(0.985); }
.dash-alert-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
  background: rgba(239,68,68,0.15);
}
.dash-alert-body { flex: 1; min-width: 0; }
.dash-alert-title {
  font-size: 12.5px; font-weight: 900;
  color: #fca5a5; margin-bottom: 2px;
}
.dash-alert-sub {
  font-size: 10.5px; color: #9ca3af; font-weight: 600;
}
.dash-alert-arrow { color: #f87171; font-size: 14px; flex-shrink: 0; }

.dash-kpis {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 10px; margin-bottom: 16px;
}
.dash-kpi {
  padding: 14px 12px;
  background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(255,61,154,0.05));
  border: 1.5px solid rgba(168,85,247,0.2);
  border-radius: 14px; text-align: center;
  font-family: 'Tajawal', sans-serif;
}
.dash-kpi-icon { font-size: 22px; margin-bottom: 6px; }
.dash-kpi-value {
  font-size: 20px; font-weight: 900;
  background: linear-gradient(135deg, #FF3D9A, #9B4DFF);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin-bottom: 2px; line-height: 1;
}
.dash-kpi-label {
  font-size: 10.5px; color: #9ca3af; font-weight: 700;
}

.dash-team {
  padding: 14px; margin-bottom: 16px;
  background: rgba(168,85,247,0.05);
  border: 1.5px solid rgba(168,85,247,0.15);
  border-radius: 14px;
  font-family: 'Tajawal', sans-serif;
}
.dash-team-title {
  font-size: 12px; font-weight: 900; color: #c084fc;
  margin-bottom: 10px; display: flex; align-items: center;
  justify-content: space-between;
}
.dash-team-title button {
  background: none; border: none; color: #a855f7;
  font-size: 11px; font-weight: 800; cursor: pointer;
  font-family: inherit;
}
.dash-team-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(168,85,247,0.1);
  font-size: 11.5px;
}
.dash-team-row:last-child { border-bottom: none; }
.dash-team-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.dash-team-dot.green { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
.dash-team-dot.yellow { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.5); }
.dash-team-dot.red { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
.dash-team-name { flex: 1; color: #e5e7eb; font-weight: 700; }
.dash-team-count {
  font-size: 10.5px; color: #9ca3af; font-weight: 700;
}

.dash-activity {
  padding: 14px; margin-bottom: 16px;
  background: rgba(77,140,255,0.04);
  border: 1.5px solid rgba(77,140,255,0.15);
  border-radius: 14px;
  font-family: 'Tajawal', sans-serif;
}
.dash-activity-title {
  font-size: 12px; font-weight: 900; color: #60a5fa;
  margin-bottom: 10px;
}
.dash-activity-item {
  display: flex; gap: 10px; padding: 7px 0;
  font-size: 11px; border-bottom: 1px solid rgba(77,140,255,0.1);
}
.dash-activity-item:last-child { border-bottom: none; }
.dash-activity-time { color: #6b7280; font-weight: 700; min-width: 55px; }
.dash-activity-text { color: #e5e7eb; flex: 1; }

/* ═══ Team screen ═══ */
.team-tabs {
  display: flex; gap: 8px; margin-bottom: 14px;
  overflow-x: auto; scrollbar-width: none;
}
.team-tabs::-webkit-scrollbar { display: none; }
.team-tab {
  padding: 8px 16px;
  background: rgba(168,85,247,0.08);
  border: 1.5px solid rgba(168,85,247,0.2);
  border-radius: 10px;
  color: #9ca3af; font-weight: 800; font-size: 11.5px;
  cursor: pointer; font-family: 'Tajawal', sans-serif;
  white-space: nowrap;
}
.team-tab.active {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff; border-color: transparent;
}

.team-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; margin-bottom: 10px;
  background: rgba(20,15,45,0.85);
  border: 1.5px solid rgba(168,85,247,0.15);
  border-radius: 12px;
  font-family: 'Tajawal', sans-serif;
  position: relative;
}
.team-card.warning { border-color: rgba(245,158,11,0.3); }
.team-card.danger { border-color: rgba(239,68,68,0.35); }
.team-card-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(255,61,154,0.15));
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.team-card-body { flex: 1; min-width: 0; }
.team-card-title {
  font-size: 13px; font-weight: 900; color: #e5e7eb;
  margin-bottom: 3px; display: flex; align-items: center; gap: 6px;
}
.team-card-title .status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.team-card-title .status-dot.green { background: #10b981; }
.team-card-title .status-dot.yellow { background: #f59e0b; }
.team-card-title .status-dot.red { background: #ef4444; }
.team-card-meta {
  font-size: 10.5px; color: #9ca3af; font-weight: 600;
  line-height: 1.5;
}
.team-card-meta strong { color: #e5e7eb; }
.team-card-warn {
  margin-top: 6px; padding: 6px 10px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  border-radius: 8px;
  font-size: 10.5px; color: #fbbf24; font-weight: 800;
}
.team-card-warn.danger {
  background: rgba(239,68,68,0.1);
  border-color: rgba(239,68,68,0.3);
  color: #fca5a5;
}

/* ═══ More screen ═══ */
.more-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.more-tile {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px;
  padding: 18px 12px;
  background: linear-gradient(135deg, rgba(168,85,247,0.06), rgba(255,61,154,0.04));
  border: 1.5px solid rgba(168,85,247,0.15);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Tajawal', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.more-tile:active {
  transform: scale(0.96);
  background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(255,61,154,0.08));
}
.more-tile-icon { font-size: 28px; }
.more-tile-label {
  font-size: 11.5px; font-weight: 800;
  color: #e5e7eb; text-align: center;
}

/* Loading state */
.dash-loading {
  text-align: center; padding: 40px 20px;
  color: #9ca3af; font-size: 12px;
  font-family: 'Tajawal', sans-serif;
}
.dash-loading-spinner {
  display: inline-block; width: 24px; height: 24px;
  border: 3px solid rgba(168,85,247,0.2);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: dash-spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes dash-spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 359px) {
  .dash-kpis { gap: 8px; }
  .dash-kpi { padding: 10px 8px; }
  .dash-kpi-value { font-size: 17px; }
  .dash-kpi-label { font-size: 9.5px; }
  .more-tile { padding: 14px 8px; }
  .more-tile-icon { font-size: 24px; }
  .more-tile-label { font-size: 10.5px; }
}
</style>

`;
const cssAnchor = '</style>';
// Insert before the LAST </style> (or before </head>)
const headEnd = h.indexOf('</head>');
if (headEnd === -1) { console.log('❌ no head'); process.exit(1); }
h = h.slice(0, headEnd) + css + h.slice(headEnd);
ops.push('CSS added');

// ═══ 5) Update A.tab mapping ═══
const tabMapOld = "var f={dash:this.renderDash,reports:this.renderReports,products:this.renderProducts,cats:this.renderCats,pays:this.renderPays,orders:this.renderOrders,haraj:this.renderHaraj,dispatcher:this.renderDispatcher,flights:this.renderFlights,push:function(){},pickup:this.renderPickupAdmin,sups:this.renderSups,balances:this.renderBalances,delivery:this.renderDelivery,users:this.renderUsers,employees:this.renderEmployees,admins:this.renderAdmins,settings:this.renderSettings,banners:this.loadBanners}[n];";
const tabMapNew = "var f={dash:this.renderDash,team:this.renderTeam,more:this.renderMore,reports:this.renderReports,products:this.renderProducts,cats:this.renderCats,pays:this.renderPays,orders:this.renderOrders,haraj:this.renderHaraj,dispatcher:this.renderDispatcher,flights:this.renderFlights,push:function(){},pickup:this.renderPickupAdmin,sups:this.renderSups,balances:this.renderBalances,delivery:this.renderDelivery,users:this.renderUsers,employees:this.renderEmployees,admins:this.renderAdmins,settings:this.renderSettings,banners:this.loadBanners}[n];";

if (h.includes(tabMapOld)) {
  h = h.replace(tabMapOld, tabMapNew);
  ops.push('A.tab map updated');
} else {
  console.warn('⚠️ tab map pattern not found');
}

fs.writeFileSync(p, h);
ops.forEach(o => console.log('✅ ' + o));
console.log('size:', before, '->', h.length, '(', h.length - before, ')');
