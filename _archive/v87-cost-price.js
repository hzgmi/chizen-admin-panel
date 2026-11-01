const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-cost-v87')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-cost-v87">
(function(){
  'use strict';
  console.log('[v87] cost price system loading...');
  
  function install() {
    if (!window.A || typeof window.A.productForm !== 'function') {
      return setTimeout(install, 300);
    }
    if (window.A._v87Installed) return;
    window.A._v87Installed = true;
    
    var _esc = window.esc || function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
    
    // ═══ REPLACE productForm ═══
    window.A.productForm = function(id) {
      var p = null;
      if (id) this.products.forEach(function(pr){ if (String(pr.id) === String(id)) p = pr; });
      var isEdit = !!p;
      p = p || { id: 'p_' + Date.now(), name: '', brand: '', category: this.cats[0] ? this.cats[0].key : 'home', price: '', old: '', badge: '', img: '', desc: '', features: [], stock: '', active: true, featured: false, costPrice: '', supplierId: '' };
      
      var catOpts = '';
      this.cats.forEach(function(c){ catOpts += '<option value="' + _esc(c.key) + '"' + (p.category === c.key ? ' selected' : '') + '>' + _esc(c.name) + '</option>'; });
      
      // Suppliers dropdown
      var supOpts = '<option value="">— بدون مورد —</option>';
      (window.A.sups || []).forEach(function(s){
        supOpts += '<option value="' + _esc(s.id) + '" data-name="' + _esc(s.name) + '"' + (p.supplierId === s.id ? ' selected' : '') + '>' + _esc(s.name) + (s.phone ? ' (' + _esc(s.phone) + ')' : '') + '</option>';
      });
      
      var feats = Array.isArray(p.features) ? p.features.join('\\n') : (p.features || '');
      var imgsText = Array.isArray(p.imgs) ? p.imgs.join('\\n') : '';
      
      // ═══ Calculate initial margin ═══
      var costVal = Number(p.costPrice) || 0;
      var sellVal = Number(p.price) || 0;
      var profitVal = sellVal - costVal;
      var marginPct = sellVal > 0 ? ((profitVal / sellVal) * 100).toFixed(1) : '0.0';
      var marginColor = profitVal > 0 ? (parseFloat(marginPct) >= 20 ? '#10b981' : (parseFloat(marginPct) >= 10 ? '#f59e0b' : '#ef4444')) : '#9ca3af';
      
      var html =
        // ─── Basic info ───
        '<div class="fl"><label class="fll">الاسم *</label><input class="fi" id="f-name" value="' + _esc(p.name || '') + '"></div>' +
        '<div class="fr"><div class="fl"><label class="fll">الماركة</label><select class="fi" id="f-brand"><option value="">بدون ماركة</option></select></div>' +
        '<div class="fl"><label class="fll">القسم</label><select class="fi" id="f-cat">' + catOpts + '</select></div></div>' +
        
        // ─── ═══ FINANCIAL SECTION (NEW) ═══ ───
        '<div style="margin:16px 0 8px;padding:12px 14px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.04));border:1.5px solid rgba(245,158,11,0.3);border-radius:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<span style="font-size:18px;">💰</span>' +
            '<span style="font-size:12px;font-weight:900;color:#f59e0b;">بيانات المورد والأرباح</span>' +
            '<span style="margin-right:auto;padding:2px 8px;background:rgba(245,158,11,0.2);border-radius:8px;font-size:9px;font-weight:800;color:#f59e0b;">🔒 سري — للمحاسب فقط</span>' +
          '</div>' +
          '<div class="fl"><label class="fll">🏢 المورد</label><select class="fi" id="f-supplier">' + supOpts + '</select></div>' +
          '<div class="fr">' +
            '<div class="fl"><label class="fll">💵 سعر الجملة (ر.س) *</label><input class="fi" type="number" id="f-cost" value="' + _esc(p.costPrice || '') + '" placeholder="0" oninput="window.__v87CalcProfit()"></div>' +
            '<div class="fl"><label class="fll">💵 سعر البيع (ر.س) *</label><input class="fi" type="number" id="f-price" value="' + _esc(p.price || '') + '" placeholder="0" oninput="window.__v87CalcProfit()"></div>' +
          '</div>' +
          '<div id="v87-profit-box" style="padding:10px 14px;background:rgba(20,15,45,0.8);border-radius:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(168,85,247,0.2);">' +
            '<div>' +
              '<div style="font-size:10px;color:#9ca3af;font-weight:700;margin-bottom:2px;">📈 الربح / الهامش</div>' +
              '<div id="v87-profit-value" style="font-size:16px;font-weight:900;color:' + marginColor + ';">' + profitVal.toLocaleString('ar-EG') + ' ر.س (' + marginPct + '%)</div>' +
            '</div>' +
            '<div id="v87-profit-badge" style="padding:6px 12px;border-radius:8px;font-size:10px;font-weight:800;background:' + (profitVal > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)') + ';color:' + marginColor + ';">' +
              (profitVal > 0 ? (parseFloat(marginPct) >= 20 ? '✅ ممتاز' : (parseFloat(marginPct) >= 10 ? '⚠️ متوسط' : '❗ منخفض')) : '—') +
            '</div>' +
          '</div>' +
        '</div>' +
        
        // ─── Prices/stock/colors ───
        '<div class="fr3">' +
          '<div class="fl"><label class="fll">السعر القديم (اختياري)</label><input class="fi" type="number" id="f-old" value="' + _esc(p.old || '') + '"></div>' +
          '<div class="fl"><label class="fll">المخزون</label><input class="fi" type="number" id="f-stock" value="' + _esc(typeof p.stock === 'number' ? p.stock : '') + '"></div>' +
          '<div class="fl"><label class="fll">الألوان (مفصولة بفاصلة)</label><input class="fi" id="f-colors" placeholder="أحمر, أزرق"></div>' +
        '</div>' +
        
        // ─── Badge ───
        '<div class="fl"><label class="fll">شارة</label><input class="fi" id="f-badge" value="' + _esc(p.badge || '') + '" placeholder="-30%"></div>' +
        
        // ─── Image ───
        '<div class="fl"><label class="fll">رابط الصورة الرئيسية</label><input class="fi" id="f-img" value="' + _esc(p.img || '') + '" oninput="A.prevImg(this.value)"><div class="ipt' + (p.img ? ' hi' : '') + '" id="f-prev"><span>معاينة</span><img id="f-img-el" src="' + _esc(p.img || '') + '"></div></div>' +
        
        // ─── Additional images ───
        '<div class="fl"><label class="fll">🖼️ صور إضافية (مصغرات)</label><textarea class="fi" id="f-imgs" style="min-height:80px;font-family:monospace;font-size:11px;line-height:1.6;" placeholder="سطر لكل رابط">' + _esc(imgsText) + '</textarea></div>' +
        
        // ─── Description ───
        '<div class="fl"><label class="fll">الوصف</label><textarea class="fi" id="f-desc">' + _esc(p.desc || '') + '</textarea></div>' +
        '<div class="fl"><label class="fll">المميزات</label><textarea class="fi" id="f-feats">' + _esc(feats) + '</textarea></div>' +
        
        // ─── Active/Featured ───
        '<div class="fr">' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:13px;padding:10px;background:var(--bg2);border-radius:8px;cursor:pointer;"><input type="checkbox" id="f-active"' + (p.active !== false ? ' checked' : '') + ' style="width:20px;height:20px;"> مفعّل</label>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:13px;padding:10px;background:var(--bg2);border-radius:8px;cursor:pointer;"><input type="checkbox" id="f-featured"' + (p.featured ? ' checked' : '') + ' style="width:20px;height:20px;"> ⭐ مميز</label>' +
        '</div>';
      
      var actions = '<button class="btn bg2" onclick="A.cm()">إلغاء</button>' +
        '<button class="btn bp" onclick="A.saveProduct(\\'' + _esc(p.id) + '\\',' + isEdit + ')">' + (isEdit ? 'حفظ' : 'إضافة') + '</button>';
      
      this.modal(isEdit ? '✏️ تعديل منتج' : '➕ منتج جديد', html, actions);
    };
    
    // ═══ Profit calculator ═══
    window.__v87CalcProfit = function() {
      var cost = Number((document.getElementById('f-cost') || {}).value) || 0;
      var sell = Number((document.getElementById('f-price') || {}).value) || 0;
      var profit = sell - cost;
      var margin = sell > 0 ? (profit / sell * 100) : 0;
      
      var color = profit > 0 ? (margin >= 20 ? '#10b981' : (margin >= 10 ? '#f59e0b' : '#ef4444')) : '#9ca3af';
      var label = profit > 0 ? (margin >= 20 ? '✅ ممتاز' : (margin >= 10 ? '⚠️ متوسط' : '❗ منخفض')) : '—';
      var badgeBg = profit > 0 ? (margin >= 20 ? 'rgba(16,185,129,0.15)' : (margin >= 10 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)')) : 'rgba(107,114,128,0.15)';
      
      var valueEl = document.getElementById('v87-profit-value');
      var badgeEl = document.getElementById('v87-profit-badge');
      
      if (valueEl) {
        valueEl.textContent = profit.toLocaleString('ar-EG') + ' ر.س (' + margin.toFixed(1) + '%)';
        valueEl.style.color = color;
      }
      if (badgeEl) {
        badgeEl.textContent = label;
        badgeEl.style.color = color;
        badgeEl.style.background = badgeBg;
      }
    };
    
    // ═══ REPLACE saveProduct ═══
    window.A.saveProduct = async function(id, isEdit) {
      var name = (document.getElementById('f-name') || {}).value || '';
      var price = parseFloat((document.getElementById('f-price') || {}).value);
      var costPrice = parseFloat((document.getElementById('f-cost') || {}).value) || 0;
      
      name = name.trim();
      if (!name) return this.toast('أدخل الاسم', 'err');
      if (!price || price <= 0) return this.toast('أدخل سعر بيع صحيح', 'err');
      
      // Validate cost price
      if (costPrice > price) {
        if (!confirm('⚠️ سعر الجملة (' + costPrice + ') أعلى من سعر البيع (' + price + ')!\\n\\nسيسبب خسارة. متابعة؟')) return;
      }
      
      var imgsRaw = (document.getElementById('f-imgs') || {}).value || '';
      imgsRaw = imgsRaw.split('\\n').map(function(s){ return s.trim(); }).filter(function(s){ return s; });
      var mainImg = (document.getElementById('f-img') || {}).value || '';
      mainImg = mainImg.trim();
      if (mainImg && imgsRaw.indexOf(mainImg) === -1) imgsRaw.unshift(mainImg);
      
      var feats = (document.getElementById('f-feats') || {}).value || '';
      feats = feats.split('\\n').map(function(s){ return s.trim(); }).filter(function(s){ return s; });
      
      var stockV = (document.getElementById('f-stock') || {}).value;
      var supplierSelect = document.getElementById('f-supplier');
      var supplierId = supplierSelect ? supplierSelect.value : '';
      var supplierName = '';
      if (supplierSelect && supplierSelect.selectedOptions && supplierSelect.selectedOptions[0]) {
        supplierName = supplierSelect.selectedOptions[0].getAttribute('data-name') || supplierSelect.selectedOptions[0].textContent;
      }
      
      var profit = price - costPrice;
      var profitMargin = price > 0 ? Math.round((profit / price) * 100) : 0;
      
      var data = {
        name: name,
        brand: (document.getElementById('f-brand') || {}).value || '',
        category: (document.getElementById('f-cat') || {}).value || '',
        price: price,
        costPrice: costPrice,
        profit: profit,
        profitMargin: profitMargin,
        supplierId: supplierId,
        supplierName: supplierName,
        old: parseFloat((document.getElementById('f-old') || {}).value) || null,
        stock: stockV ? parseInt(stockV) : null,
        badge: ((document.getElementById('f-badge') || {}).value || '').trim(),
        rating: 4.5,
        reviews: 0,
        sold: 0,
        img: mainImg,
        colors: ((document.getElementById('f-colors') || {}).value || '').split(',').map(function(s){ return s.trim(); }).filter(function(s){ return s !== ''; }),
        desc: ((document.getElementById('f-desc') || {}).value || '').trim(),
        imgs: imgsRaw,
        features: feats,
        active: (document.getElementById('f-active') || {}).checked !== false,
        featured: (document.getElementById('f-featured') || {}).checked === true,
        updatedAt: new Date()
      };
      
      try {
        var savedId = id;
        if (isEdit) {
          await FB.updateProduct(id, data);
        } else {
          savedId = await FB.addProduct(data);
        }
        
        // Sync supplier purchasePrice
        if (supplierId && costPrice > 0) {
          try {
            var supDoc = await FB.db.collection('config').doc('suppliers').get();
            if (supDoc.exists) {
              var list = supDoc.data().list || [];
              list.forEach(function(s) {
                if (s.id === supplierId) {
                  if (!Array.isArray(s.products)) s.products = [];
                  var existing = s.products.find(function(pp){ return pp.id === savedId; });
                  if (existing) existing.purchasePrice = costPrice;
                  else s.products.push({ id: savedId, purchasePrice: costPrice, name: name });
                }
              });
              await FB.db.collection('config').doc('suppliers').set({ list: list }, { merge: true });
            }
          } catch(e) { console.warn('[v87] supplier sync:', e.message); }
        }
        
        this.toast(isEdit ? '✓ تم التحديث' : '✓ أُضيف', 'suc');
        this.cm();
        await this.loadData();
        this.renderProducts();
        this.renderDash();
      } catch(e) {
        this.toast('فشل: ' + (e.message || ''), 'err');
      }
    };
    
    console.log('[v87] ✓ cost price system installed');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 200); });
  } else {
    setTimeout(install, 200);
  }
  setTimeout(install, 2500);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v87 installed');
