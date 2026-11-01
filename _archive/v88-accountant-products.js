const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-acct-v88')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-acct-v88">
(function(){
  'use strict';
  
  function install() {
    if (!window.A || !window.A.products) {
      return setTimeout(install, 500);
    }
    if (window.A._v88Installed) return;
    window.A._v88Installed = true;
    
    var _esc = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
    
    // ═══ Add products tab to accountant ═══
    window.__v88RenderProductsTab = function() {
      var container = document.getElementById('ca-content-products');
      if (!container) return;
      
      var products = window.A.products || [];
      if (!products.length) {
        container.innerHTML = '<div class="emp">لا منتجات</div>';
        return;
      }
      
      // Group by category
      var catNames = {};
      (window.A.cats || []).forEach(function(c){ catNames[c.key] = c.name; });
      
      // Stats
      var totalCost = 0, totalSell = 0, totalProfit = 0, count = products.length;
      products.forEach(function(p){
        var cost = Number(p.costPrice) || 0;
        var sell = Number(p.price) || 0;
        totalCost += cost;
        totalSell += sell;
        totalProfit += (sell - cost);
      });
      var avgMargin = totalSell > 0 ? ((totalProfit / totalSell) * 100).toFixed(1) : 0;
      
      // Filter controls
      var html = '<div style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.04));border:1.5px solid rgba(245,158,11,0.3);border-radius:12px;">' +
        '<div style="font-size:11px;font-weight:900;color:#f59e0b;margin-bottom:10px;">📊 إحصائيات المنتجات (' + count + ')</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">' +
          '<div style="padding:10px;background:rgba(239,68,68,0.08);border-radius:10px;text-align:center;">' +
            '<div style="font-size:10px;color:#fca5a5;font-weight:700;margin-bottom:2px;">💰 قيمة الجملة</div>' +
            '<div style="font-size:14px;font-weight:900;color:#ef4444;">' + totalCost.toLocaleString('ar-EG') + '</div>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(168,85,247,0.08);border-radius:10px;text-align:center;">' +
            '<div style="font-size:10px;color:#c084fc;font-weight:700;margin-bottom:2px;">💵 قيمة البيع</div>' +
            '<div style="font-size:14px;font-weight:900;color:#a855f7;">' + totalSell.toLocaleString('ar-EG') + '</div>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(16,185,129,0.08);border-radius:10px;text-align:center;grid-column:1/-1;">' +
            '<div style="font-size:10px;color:#34d399;font-weight:700;margin-bottom:2px;">📈 الربح المتوقع (هامش ' + avgMargin + '%)</div>' +
            '<div style="font-size:18px;font-weight:900;color:#10b981;">' + totalProfit.toLocaleString('ar-EG') + ' ر.س</div>' +
          '</div>' +
        '</div>' +
      '</div>';
      
      // Search
      html += '<div style="margin-bottom:10px;"><input type="text" id="v88-prod-search" placeholder="🔍 ابحث باسم المنتج..." style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);background:rgba(20,15,45,0.8);color:#e5e7eb;font-size:12px;" oninput="window.__v88FilterProducts()"></div>';
      
      // Filter tabs
      html += '<div style="display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;padding-bottom:6px;">' +
        '<button class="v88-cat-btn active" data-cat="all" onclick="window.__v88SetCat(\\'all\\',this)" style="padding:6px 14px;border-radius:10px;border:1px solid rgba(168,85,247,0.3);background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">الكل</button>';
      Object.keys(catNames).forEach(function(k){
        html += '<button class="v88-cat-btn" data-cat="' + k + '" onclick="window.__v88SetCat(\\'' + k + '\\',this)" style="padding:6px 14px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);background:rgba(168,85,247,0.08);color:#9ca3af;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">' + _esc(catNames[k]) + '</button>';
      });
      html += '</div>';
      
      // Products list
      html += '<div id="v88-products-list" style="max-height:calc(100vh - 320px);overflow-y:auto;">';
      products.forEach(function(prod){
        var cost = Number(prod.costPrice) || 0;
        var sell = Number(prod.price) || 0;
        var profit = sell - cost;
        var margin = sell > 0 ? (profit / sell * 100).toFixed(1) : '—';
        var marginColor = profit > 0 ? (parseFloat(margin) >= 20 ? '#10b981' : (parseFloat(margin) >= 10 ? '#f59e0b' : '#ef4444')) : '#6b7280';
        var supplier = prod.supplierName || '—';
        
        html += '<div class="v88-prod-row" data-cat="' + _esc(prod.category || '') + '" data-name="' + _esc((prod.name || '').toLowerCase()) + '" style="padding:12px 14px;background:rgba(20,15,45,0.85);border:1px solid rgba(168,85,247,0.15);border-radius:10px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:12px;font-weight:800;color:#e5e7eb;margin-bottom:4px;">' + _esc(prod.name || 'منتج') + '</div>' +
              '<div style="font-size:10px;color:#9ca3af;margin-bottom:6px;">🏢 ' + _esc(supplier) + ' · 🗂️ ' + _esc(catNames[prod.category] || prod.category) + '</div>' +
              '<div style="display:flex;gap:12px;font-size:11px;">' +
                '<div><span style="color:#9ca3af;">جملة:</span> <b style="color:#ef4444;">' + cost.toLocaleString('ar-EG') + '</b></div>' +
                '<div><span style="color:#9ca3af;">بيع:</span> <b style="color:#a855f7;">' + sell.toLocaleString('ar-EG') + '</b></div>' +
              '</div>' +
            '</div>' +
            '<div style="text-align:left;flex-shrink:0;">' +
              '<div style="font-size:14px;font-weight:900;color:' + marginColor + ';">+' + profit.toLocaleString('ar-EG') + '</div>' +
              '<div style="font-size:9px;color:' + marginColor + ';font-weight:800;">' + margin + '%</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
      
      container.innerHTML = html;
    };
    
    window.__v88SetCat = function(cat, btn) {
      document.querySelectorAll('.v88-cat-btn').forEach(function(b){
        b.classList.remove('active');
        b.style.background = 'rgba(168,85,247,0.08)';
        b.style.color = '#9ca3af';
        b.style.borderColor = 'rgba(168,85,247,0.2)';
      });
      if (btn) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg,#a855f7,#7c3aed)';
        btn.style.color = '#fff';
        btn.style.borderColor = '#a855f7';
      }
      window.__v88FilterProducts(cat);
    };
    
    window.__v88FilterProducts = function(cat) {
      var activeCat = document.querySelector('.v88-cat-btn.active');
      var selectedCat = activeCat ? activeCat.dataset.cat : 'all';
      var searchVal = ((document.getElementById('v88-prod-search') || {}).value || '').toLowerCase();
      
      document.querySelectorAll('.v88-prod-row').forEach(function(row){
        var matchCat = selectedCat === 'all' || row.dataset.cat === selectedCat;
        var matchSearch = !searchVal || row.dataset.name.indexOf(searchVal) > -1;
        row.style.display = (matchCat && matchSearch) ? 'block' : 'none';
      });
    };
    
    // ═══ Patch __caSwitchTab to add products tab ═══
    function patchAccountantTab() {
      var origSwitch = window.__caSwitchTab;
      if (!origSwitch || origSwitch._v88Patched) return;
      
      window.__caSwitchTab = function(tab, btn) {
        origSwitch.call(this, tab, btn);
        if (tab === 'products') {
          setTimeout(window.__v88RenderProductsTab, 100);
        }
      };
      window.__caSwitchTab._v88Patched = true;
      
      console.log('[v88] accountant tab patched');
    }
    
    // ═══ Add tab button ═══
    function addProductsTabButton() {
      var navs = document.querySelectorAll('.ca-nav-btn');
      if (navs.length === 0) { setTimeout(addProductsTabButton, 500); return; }
      
      // Check if already exists
      for (var i = 0; i < navs.length; i++) {
        if (navs[i].getAttribute('data-tab') === 'products') return;
      }
      
      // Insert after "orders"
      var ordersBtn = null;
      navs.forEach(function(n){ if (n.getAttribute('data-tab') === 'orders') ordersBtn = n; });
      
      var newBtn = document.createElement('button');
      newBtn.className = 'ca-nav-btn';
      newBtn.setAttribute('data-tab', 'products');
      newBtn.setAttribute('onclick', 'window.__caSwitchTab(\\'products\\',this)');
      newBtn.innerHTML = '<span class="icon">📦</span><span class="label">المنتجات</span>';
      
      if (ordersBtn && ordersBtn.parentNode) {
        ordersBtn.parentNode.insertBefore(newBtn, ordersBtn.nextSibling);
      } else if (navs[0].parentNode) {
        navs[0].parentNode.appendChild(newBtn);
      }
      
      console.log('[v88] products tab button added');
      
      // Add content container
      var app = document.getElementById('accountant-mgr-app');
      if (app && !document.getElementById('ca-content-products')) {
        var container = document.createElement('div');
        container.id = 'ca-content-products';
        container.style.cssText = 'padding:14px;display:none;';
        app.appendChild(container);
      }
    }
    
    // Hook tab switching to show/hide products content
    var origCaSwitch = window.__caSwitchTab;
    if (origCaSwitch) {
      window.__caSwitchTab = function(tab, btn) {
        // Hide all content
        document.querySelectorAll('[id^="ca-content-"]').forEach(function(el){
          el.style.display = 'none';
        });
        // Show selected
        var target = document.getElementById('ca-content-' + tab);
        if (target) target.style.display = 'block';
        
        origCaSwitch.call(this, tab, btn);
        
        if (tab === 'products') {
          setTimeout(window.__v88RenderProductsTab, 100);
        }
      };
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(patchAccountantTab, 1000); setTimeout(addProductsTabButton, 1500); });
    } else {
      setTimeout(patchAccountantTab, 1000);
      setTimeout(addProductsTabButton, 1500);
    }
    setTimeout(patchAccountantTab, 3000);
    setTimeout(addProductsTabButton, 3000);
    
    console.log('[v88] ✓ accountant products tab installed');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 500); });
  } else {
    setTimeout(install, 500);
  }
  setTimeout(install, 3000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v88 installed');
