const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;
let ops = [];

if (h.includes('sc-haraj')) { console.log('already'); process.exit(0); }

// ═══ 1) Add tab button after orders ═══
const ordersBtn = '<button class="tb" onclick="A.tab(\'orders\',this)">🛒 الطلبات</button>';
if (!h.includes(ordersBtn)) { console.log('❌ orders btn not found'); process.exit(1); }
h = h.replace(ordersBtn, ordersBtn + '\n<button class="tb" onclick="A.tab(\'haraj\',this)">🏪 حراج شيزن</button>');
ops.push('tab button added');

// ═══ 2) Fix banners duplicate button text ═══
const bannerBug = '">🖼️ البانرات</button>🖼️ البانرات</button>';
if (h.includes(bannerBug)) {
  h = h.replace(bannerBug, '">🖼️ البانرات</button>');
  ops.push('banners duplicate fixed');
}

// ═══ 3) Add screen HTML after sc-orders ═══
const ordersScreenStart = '<div class="sc" id="sc-orders">';
if (!h.includes(ordersScreenStart)) { console.log('❌ sc-orders not found'); process.exit(1); }

// Find end of sc-orders screen
const ordersStartIdx = h.indexOf(ordersScreenStart);
// We know next screen is sc-sups
const supsStart = h.indexOf("'<div class=\"sc\" id=\"sc-sups\">'", ordersStartIdx);
if (supsStart === -1) { console.log('❌ sc-sups not found'); process.exit(1); }

const harajScreen = `'<div class="sc" id="sc-haraj">'+
        '<div class="sw"><svg class="sic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="si" id="h-search" placeholder="ابحث بالعنوان، البائع، المدينة، الهاتف..." oninput="A.harajSearchInput(this.value)"></div>'+
        '<div id="h-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;"></div>'+
        '<div class="ch">'+
          '<div class="cp active" onclick="A.filterHaraj(\\'all\\',this)">الكل</div>'+
          '<div class="cp" onclick="A.filterHaraj(\\'active\\',this)">✅ نشط</div>'+
          '<div class="cp" onclick="A.filterHaraj(\\'sold\\',this)">💰 مباع</div>'+
          '<div class="cp" onclick="A.filterHaraj(\\'reserved\\',this)">⏸️ محجوز</div>'+
          '<div class="cp" onclick="A.filterHaraj(\\'paused\\',this)">⏹️ موقوف</div>'+
          '<div class="cp" onclick="A.filterHaraj(\\'removed\\',this)">🗑️ محذوف</div>'+
        '</div>'+
        '<div id="h-list"></div>'+
      '</div>'+
      `;

h = h.slice(0, supsStart) + harajScreen + h.slice(supsStart);
ops.push('haraj screen added');

// ═══ 4) Update A.tab function map ═══
const tabMapOld = "orders:this.renderOrders,dispatcher:this.renderDispatcher";
if (h.includes(tabMapOld)) {
  h = h.replace(tabMapOld, "orders:this.renderOrders,haraj:this.renderHaraj,dispatcher:this.renderDispatcher");
  ops.push('tab map updated');
} else {
  console.warn('⚠️ tab map pattern not found');
}

fs.writeFileSync(p, h);
ops.forEach(o => console.log('✅ ' + o));
console.log('size:', before, '->', h.length, '(', h.length - before, ')');
