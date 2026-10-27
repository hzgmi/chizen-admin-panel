const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-order-view-v85')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-order-view-v85">
(function(){
  'use strict';
  console.log('[v85] script starting...');
  
  var tries = 0;
  var MAX_TRIES = 150; // 30 seconds
  
  function tryInstall() {
    tries++;
    
    if (tries > MAX_TRIES) {
      console.error('[v85] GAVE UP after', MAX_TRIES, 'tries. window.A exists:', !!window.A);
      return;
    }
    
    // Not ready yet
    if (!window.A) {
      setTimeout(tryInstall, 200);
      return;
    }
    
    // A exists but not orderDetails yet
    if (typeof window.A.orderDetails !== 'function') {
      setTimeout(tryInstall, 200);
      return;
    }
    
    // Already installed?
    if (window.A.orderDetails._v85) {
      console.log('[v85] already installed');
      return;
    }
    
    console.log('[v85] installing... (try #' + tries + ')');
    
    var origOrderDetails = window.A.orderDetails;
    
    window.A.orderDetails = function(id) {
      console.log('[v85] orderDetails called with:', id);
      
      var o = null;
      this.orders.forEach(function(ord){ if (String(ord.id) === String(id)) o = ord; });
      if (!o) {
        console.warn('[v85] order not found');
        return origOrderDetails.call(this, id);
      }
      
      // Build products
      var products = [];
      var cats = o.categories || {};
      Object.keys(cats).forEach(function(catKey) {
        var catItems = cats[catKey].items || [];
        catItems.forEach(function(it) {
          products.push({
            catKey: catKey,
            id: it.id,
            name: it.name || 'منتج',
            img: it.img || '',
            price: Number(it.price) || 0,
            qty: Number(it.qty) || 1,
            subtotal: (Number(it.price) || 0) * (Number(it.qty) || 1)
          });
        });
      });
      
      if (!products.length && Array.isArray(o.items)) {
        o.items.forEach(function(it, idx) {
          var p = null;
          if (window.A && A.products) {
            A.products.forEach(function(pp){ if (String(pp.id) === String(it.id)) p = pp; });
          }
          var price = (p && p.price) ? Number(p.price) : (Number(it.price) || 0);
          products.push({
            catKey: '',
            id: it.id,
            name: (p && p.name) || it.name || ('منتج ' + (idx+1)),
            img: (p && p.img) || it.img || '',
            price: price,
            qty: Number(it.qty) || 1,
            subtotal: price * (Number(it.qty) || 1)
          });
        });
      }
      
      console.log('[v85] products found:', products.length);
      
      var expectedTotal = Number(o.total) || 0;
      var receiptUrl = o.receiptUrl || o.receipt || (o.payment && o.payment.receiptUrl) || '';
      
      // Escape helper
      function esc(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
      
      // Build products HTML with checkboxes
      var productsHtml = products.length ? products.map(function(pr) {
        var imgHtml = pr.img 
          ? '<img src="' + esc(pr.img) + '" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#2a1f4a;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\';"><div style="display:none;width:44px;height:44px;background:#2a1f4a;border-radius:8px;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📦</div>'
          : '<div style="width:44px;height:44px;background:#2a1f4a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📦</div>';
        
        return '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(20,15,45,0.6);border:1px solid rgba(168,85,247,0.15);border-radius:10px;margin-bottom:6px;cursor:pointer;">' +
          '<input type="checkbox" class="ord-prod-chk-v85" data-cat="' + esc(pr.catKey) + '" data-id="' + esc(pr.id) + '" data-name="' + esc(pr.name) + '" data-price="' + pr.subtotal + '" checked style="width:22px;height:22px;accent-color:#10b981;flex-shrink:0;" onchange="window.__v85Calc()">' +
          imgHtml +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:800;color:#e5e7eb;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(pr.name) + '</div>' +
            '<div style="font-size:10px;color:#9ca3af;">' + pr.qty + ' × ' + pr.price.toLocaleString('ar-EG') + ' ر.س</div>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:900;color:#a855f7;flex-shrink:0;">' + pr.subtotal.toLocaleString('ar-EG') + ' ر.س</div>' +
        '</label>';
      }).join('') : '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">لا منتجات</div>';
      
      // Receipt
      var receiptHtml = receiptUrl 
        ? '<div class="ds">' +
            '<div class="dt" style="color:#3b82f6;">🧾 سند التحويل <span style="font-size:10px;color:#9ca3af;font-weight:600;">(اضغط للتكبير)</span></div>' +
            '<a href="' + esc(receiptUrl) + '" target="_blank" style="display:block;">' +
              '<img src="' + esc(receiptUrl) + '" style="width:100%;max-height:280px;object-fit:contain;border-radius:10px;background:#0a0e1a;display:block;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'block\\';"><div style="display:none;padding:20px;text-align:center;color:#f87171;font-size:11px;background:rgba(239,68,68,0.1);border-radius:10px;">❌ تعذر تحميل السند</div>' +
            '</a>' +
          '</div>'
        : '<div class="ds" style="background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.3);">' +
            '<div class="dt" style="color:#ef4444;">⚠️ لا يوجد سند تحويل</div>' +
            '<div style="font-size:11px;color:#9ca3af;padding:4px 0;">العميل لم يرفع سند التحويل</div>' +
          '</div>';
      
      // Totals
      var totalsHtml = 
        '<div style="padding:14px;background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,61,154,0.04));border:1.5px solid rgba(168,85,247,0.3);border-radius:12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span style="font-size:12px;color:#9ca3af;font-weight:700;">💰 المتوقع:</span>' +
            '<span style="font-size:14px;font-weight:900;color:#a855f7;">' + expectedTotal.toLocaleString('ar-EG') + ' ر.س</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1.5px dashed rgba(168,85,247,0.25);">' +
            '<span style="font-size:13px;color:#e5e7eb;font-weight:900;">✅ المؤكد:</span>' +
            '<span id="ord-v85-total" style="font-size:20px;font-weight:900;color:#10b981;">' + expectedTotal.toLocaleString('ar-EG') + ' ر.س</span>' +
          '</div>' +
          '<div id="ord-v85-badge" style="margin-top:10px;padding:8px;border-radius:8px;text-align:center;font-size:11px;font-weight:800;display:none;"></div>' +
        '</div>';
      
      var body = 
        '<div class="ds">' +
          '<div class="dt">👤 العميل</div>' +
          '<div class="dr"><span class="dl">الاسم</span><span class="dv">' + esc(o.name || '-') + '</span></div>' +
          '<div class="dr"><span class="dl">الهاتف</span><span class="dv" style="direction:ltr;">' + esc(o.phone || '-') + '</span></div>' +
          '<div class="dr"><span class="dl">التسليم</span><span class="dv">' + esc(o.pickup || '-') + '</span></div>' +
        '</div>' +
        '<div class="ds">' +
          '<div class="dt">📦 المنتجات <span style="font-size:10px;color:#f59e0b;font-weight:600;">(أزل ✓ عن غير المتوفر)</span></div>' +
          productsHtml +
        '</div>' +
        receiptHtml +
        totalsHtml;
      
      var actions = 
        '<button class="btn bg2" onclick="A.cm()" style="flex:0.6;">إغلاق</button>' +
        (o.phone ? '<button class="btn bs" onclick="window.open(\\'https://wa.me/' + esc(String(o.phone).replace(/\\D/g,'')) + '\\',\\'_blank\\')" style="flex:0.5;">💬</button>' : '') +
        '<button class="btn" style="background:rgba(239,68,68,0.15);border:1.5px solid #ef4444;color:#ef4444;flex:1;" onclick="window.__v85Reject(\\'' + esc(o.id) + '\\')">❌ رفض</button>' +
        '<button class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;flex:1.5;" onclick="window.__v85Confirm(\\'' + esc(o.id) + '\\')">✅ تأكيد الدفع</button>';
      
      this.modal('الطلب #' + (o.id || '').substring(0, 14), body, actions);
      
      setTimeout(function(){ if (window.__v85Calc) window.__v85Calc(); }, 60);
    };
    
    window.A.orderDetails._v85 = true;
    
    // Calc function
    window.__v85Calc = function() {
      var cbs = document.querySelectorAll('.ord-prod-chk-v85');
      var total = 0, removedCount = 0, removedValue = 0;
      cbs.forEach(function(chk) {
        var v = Number(chk.dataset.price) || 0;
        if (chk.checked) total += v;
        else { removedCount++; removedValue += v; }
      });
      var el = document.getElementById('ord-v85-total');
      if (el) el.textContent = total.toLocaleString('ar-EG') + ' ر.س';
      var badge = document.getElementById('ord-v85-badge');
      if (badge) {
        if (removedCount > 0) {
          badge.style.display = 'block';
          badge.style.background = 'rgba(245,158,11,0.15)';
          badge.style.color = '#f59e0b';
          badge.style.border = '1px solid rgba(245,158,11,0.4)';
          badge.textContent = '⚠️ ' + removedCount + ' منتج ملغي — خصم ' + removedValue.toLocaleString('ar-EG') + ' ر.س';
        } else {
          badge.style.display = 'none';
        }
      }
    };
    
    // Confirm
    window.__v85Confirm = function(id) {
      var cbs = document.querySelectorAll('.ord-prod-chk-v85');
      var missing = [], available = [], newTotal = 0;
      cbs.forEach(function(chk) {
        var it = { id: chk.dataset.id, name: chk.dataset.name, catKey: chk.dataset.cat, price: Number(chk.dataset.price) };
        if (chk.checked) { available.push(it); newTotal += it.price; }
        else missing.push(it);
      });
      
      if (!available.length) return A.toast('كل المنتجات ملغاة', 'err');
      
      var msg = missing.length > 0
        ? 'تأكيد ' + available.length + ' منتج (' + newTotal.toLocaleString('ar-EG') + ' ر.س)?\\n' + missing.length + ' منتج سيُلغى.'
        : 'تأكيد الدفع (' + newTotal.toLocaleString('ar-EG') + ' ر.س)?';
      
      A.confirm('تأكيد الدفع', msg, function() {
        window.__v85DoConfirm(id, available, missing, newTotal);
      }, 'primary');
    };
    
    window.__v85DoConfirm = async function(id, available, missing, newTotal) {
      try {
        var snap = await FB.db.collection('orders').where('id', '==', id).get();
        if (snap.empty) return A.toast('الطلب غير موجود', 'err');
        
        var docRef = snap.docs[0].ref;
        var o = snap.docs[0].data();
        var customerId = o.customerId || o.userId;
        
        var update = {};
        
        Object.keys(o.categories || {}).forEach(function(catKey) {
          var cat = o.categories[catKey];
          var kept = (cat.items || []).filter(function(it) {
            return !missing.some(function(m){ return m.id === it.id; });
          });
          var sub = kept.reduce(function(s, it){ return s + (Number(it.price)||0) * (Number(it.qty)||1); }, 0);
          
          update['categories.' + catKey + '.items'] = kept;
          update['categories.' + catKey + '.subtotal'] = sub;
          
          if (kept.length === 0) {
            update['categories.' + catKey + '.status'] = 'cancelled';
            update['categories.' + catKey + '.cancelledReason'] = 'عدم اكتمال الدفع';
            update['categoryStatus.' + catKey] = 'cancelled';
          } else {
            update['categories.' + catKey + '.status'] = 'pending';
            update['categoryStatus.' + catKey] = 'pending';
          }
        });
        
        update['payment.status'] = 'verified';
        update['payment.verifiedBy'] = FB.currentUser ? FB.currentUser.uid : '';
        update['payment.verifiedAt'] = new Date();
        update['workflowStatus'] = 'awaiting_categories';
        update['total'] = newTotal;
        update['payment.confirmedAmount'] = newTotal;
        update['payment.cancelledItems'] = missing.map(function(m){ return { id: m.id, name: m.name, price: m.price }; });
        
        await docRef.update(update);
        
        if (customerId && window.notifyCustomer) {
          await window.notifyCustomer(customerId, 'order.verified', { id: id.substring(0, 8).toUpperCase() });
        }
        
        A.toast('✅ تم تأكيد الدفع' + (missing.length > 0 ? ' (' + missing.length + ' ملغي)' : ''), 'suc');
        A.cm();
        await A.loadData();
        A.renderOrders();
        A.renderDash();
      } catch(e) {
        console.error('[v85 confirm]', e);
        A.toast('فشل: ' + (e.message || ''), 'err');
      }
    };
    
    window.__v85Reject = function(id) {
      A.confirm('رفض الدفع', 'سيتم إبلاغ العميل. متابعة؟', async function() {
        try {
          var snap = await FB.db.collection('orders').where('id', '==', id).get();
          if (snap.empty) return;
          var o = snap.docs[0].data();
          var customerId = o.customerId || o.userId;
          
          await snap.docs[0].ref.update({
            'payment.status': 'rejected',
            'payment.verifiedBy': FB.currentUser ? FB.currentUser.uid : '',
            'payment.verifiedAt': new Date(),
            'workflowStatus': 'payment_rejected'
          });
          
          if (customerId && window.notifyCustomer) {
            await window.notifyCustomer(customerId, 'order.payment_rejected', { id: id.substring(0, 8).toUpperCase(), reason: 'تواصل معنا' });
          }
          
          A.toast('تم الرفض', 'suc');
          A.cm();
          await A.loadData();
          A.renderOrders();
          A.renderDash();
        } catch(e) {
          A.toast('فشل: ' + (e.message || ''), 'err');
        }
      }, 'danger');
    };
    
    console.log('[v85] ✓✓✓ INSTALLED SUCCESSFULLY');
  }
  
  // Start trying immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(tryInstall, 100); });
  } else {
    setTimeout(tryInstall, 100);
  }
  
  // Also start now
  tryInstall();
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);

fs.writeFileSync(p, h);
console.log('✅ v85 bulletproof added');
console.log('size:', before, '->', h.length);
