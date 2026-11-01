const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-acct-v89-logic')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-acct-v89-logic">
(function(){
  'use strict';
  
  function install() {
    if (!window.__v88RenderProductsTab) return setTimeout(install, 500);
    if (window.__v88RenderProductsTab._v89) return;
    
    window.__v88RenderProductsTab = function() {
      var container = document.getElementById('ca-content-products');
      if (!container) return;
      
      var products = window.A.products || [];
      if (!products.length) {
        container.innerHTML = '<div class="emp">لا منتجات</div>';
        return;
      }
      
      var catNames = {};
      (window.A.cats || []).forEach(function(c){ catNames[c.key] = c.name; });
      
      // ═══ Compute stats with proper validation ═══
      var totalCost = 0, totalSell = 0, totalProfit = 0;
      var count = products.length;
      var withCost = 0, withoutCost = 0;
      
      products.forEach(function(p){
        var cost = Number(p.costPrice) || 0;
        var sell = Number(p.price) || 0;
        totalSell += sell;
        if (cost > 0) {
          totalCost += cost;
          totalProfit += (sell - cost);
          withCost++;
        } else {
          withoutCost++;
        }
      });
      
      var avgMargin = withCost > 0 && totalSell > 0 
        ? Math.round((totalProfit / (totalSell - (withoutCost > 0 ? 0 : 0))) * 100) 
        : 0;
      
      // Better margin calc: only for products with cost
      var soldWithCost = 0;
      products.forEach(function(p){
        if (Number(p.costPrice) > 0) soldWithCost += Number(p.price) || 0;
      });
      avgMargin = soldWithCost > 0 ? Math.round((totalProfit / soldWithCost) * 100) : 0;
      
      var html = '<div style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.04));border:1.5px solid rgba(245,158,11,0.3);border-radius:12px;">' +
        '<div style="font-size:11px;font-weight:900;color:#f59e0b;margin-bottom:10px;">📊 إحصائيات المنتجات (' + count + ')</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">' +
          '<div style="padding:10px;background:rgba(239,68,68,0.08);border-radius:10px;text-align:center;">' +
            '<div style="font-size:10px;color:#fca5a5;font-weight:700;margin-bottom:2px;">💰 قيمة الجملة</div>' +
            '<div style="font-size:14px;font-weight:900;color:#ef4444;">' + (withCost > 0 ? totalCost.toLocaleString('ar-EG') : '—') + '</div>' +
            '<div style="font-size:8.5px;color:#9ca3af;margin-top:2px;">' + withCost + ' منتج محدد</div>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(168,85,247,0.08);border-radius:10px;text-align:center;">' +
            '<div style="font-size:10px;color:#c084fc;font-weight:700;margin-bottom:2px;">💵 قيمة البيع</div>' +
            '<div style="font-size:14px;font-weight:900;color:#a855f7;">' + totalSell.toLocaleString('ar-EG') + '</div>' +
            '<div style="font-size:8.5px;color:#9ca3af;margin-top:2px;">' + count + ' منتج</div>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(16,185,129,0.08);border-radius:10px;text-align:center;grid-column:1/-1;">' +
            '<div style="font-size:10px;color:#34d399;font-weight:700;margin-bottom:2px;">📈 الربح المتوقع ' + (withCost > 0 ? '(هامش ' + avgMargin + '%)' : '') + '</div>' +
            '<div style="font-size:18px;font-weight:900;color:#10b981;">' + (withCost > 0 ? totalProfit.toLocaleString('ar-EG') + ' ر.س' : '—') + '</div>' +
          '</div>' +
        '</div>' +
        (withoutCost > 0 
          ? '<div style="margin-top:10px;padding:8px 10px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);border-radius:8px;font-size:10px;color:#fbbf24;text-align:center;">⚠️ ' + withoutCost + ' منتج بدون سعر جملة — عدّلها من مدير القسم</div>' 
          : '') +
      '</div>';
      
      // Search
      html += '<div style="margin-bottom:10px;"><input type="text" id="v88-prod-search" placeholder="🔍 ابحث باسم المنتج..." style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);background:rgba(20,15,45,0.8);color:#e5e7eb;font-size:12px;box-sizing:border-box;" oninput="window.__v88FilterProducts()"></div>';
      
      // Category tabs
      html += '<div style="display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;">' +
        '<button class="v88-cat-btn active" data-cat="all" onclick="window.__v88SetCat(\\'all\\',this)" style="flex-shrink:0;padding:6px 14px;border-radius:10px;border:1px solid #a855f7;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">الكل</button>';
      Object.keys(catNames).forEach(function(k){
        html += '<button class="v88-cat-btn" data-cat="' + k + '" onclick="window.__v88SetCat(\\'' + k + '\\',this)" style="flex-shrink:0;padding:6px 14px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);background:rgba(168,85,247,0.08);color:#9ca3af;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">' + (catNames[k] || k) + '</button>';
      });
      html += '</div>';
      
      // Products list
      html += '<div id="v88-products-list" style="max-height:calc(100vh - 380px);overflow-y:auto;">';
      products.forEach(function(prod){
        var cost = Number(prod.costPrice) || 0;
        var sell = Number(prod.price) || 0;
        var profit = sell - cost;
        var margin = cost > 0 && sell > 0 ? (profit / sell * 100).toFixed(1) : '—';
        var marginColor = cost > 0 
          ? (profit > 0 ? (parseFloat(margin) >= 20 ? '#10b981' : (parseFloat(margin) >= 10 ? '#f59e0b' : '#ef4444')) : '#ef4444')
          : '#6b7280';
        var supplier = prod.supplierName || '—';
        var costDisplay = cost > 0 ? cost.toLocaleString('ar-EG') : '—';
        var profitDisplay = cost > 0 ? '+' + profit.toLocaleString('ar-EG') : '—';
        var marginDisplay = cost > 0 ? margin + '%' : 'غير محدد';
        
        html += '<div class="v88-prod-row" data-cat="' + (prod.category || '') + '" data-name="' + (prod.name || '').toLowerCase() + '" style="padding:12px 14px;background:rgba(20,15,45,0.85);border:1px solid rgba(168,85,247,0.15);border-radius:10px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:12px;font-weight:800;color:#e5e7eb;margin-bottom:4px;">' + String(prod.name || 'منتج').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }) + '</div>' +
              '<div style="font-size:10px;color:#9ca3af;margin-bottom:6px;">🏢 ' + String(supplier).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }) + ' · 🗂️ ' + (catNames[prod.category] || prod.category || '—') + '</div>' +
              '<div style="display:flex;gap:12px;font-size:11px;flex-wrap:wrap;">' +
                '<div><span style="color:#9ca3af;">جملة:</span> <b style="color:' + (cost > 0 ? '#ef4444' : '#6b7280') + ';">' + costDisplay + '</b></div>' +
                '<div><span style="color:#9ca3af;">بيع:</span> <b style="color:#a855f7;">' + sell.toLocaleString('ar-EG') + '</b></div>' +
              '</div>' +
            '</div>' +
            '<div style="text-align:left;flex-shrink:0;">' +
              '<div style="font-size:14px;font-weight:900;color:' + marginColor + ';">' + profitDisplay + '</div>' +
              '<div style="font-size:9px;color:' + marginColor + ';font-weight:800;">' + marginDisplay + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
      
      container.innerHTML = html;
    };
    window.__v88RenderProductsTab._v89 = true;
    
    console.log('[v89] logic fixed — handles costPrice=0 correctly');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 1500); });
  } else {
    setTimeout(install, 1500);
  }
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v89 logic fix added');
