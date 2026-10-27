const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-admin-simple-v86')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-admin-simple-v86">
(function(){
  'use strict';
  console.log('[v86] admin simplification loading...');
  
  function install() {
    if (!window.A || typeof window.A.orderDetails !== 'function') {
      return setTimeout(install, 300);
    }
    if (window.A._v86Installed) return;
    window.A._v86Installed = true;
    
    var _esc = window.esc || function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
    
    window.A.orderDetails = function(id) {
      var o = null;
      this.orders.forEach(function(ord){ if (String(ord.id) === String(id)) o = ord; });
      if (!o) return this.toast('الطلب غير موجود', 'err');
      
      var _esc = window.esc || function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      
      // Products (read-only)
      var products = [];
      var cats = o.categories || {};
      Object.keys(cats).forEach(function(catKey) {
        (cats[catKey].items || []).forEach(function(it) {
          products.push({
            catKey: catKey,
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
            name: (p && p.name) || it.name || ('منتج ' + (idx+1)),
            img: (p && p.img) || it.img || '',
            price: price,
            qty: Number(it.qty) || 1,
            subtotal: price * (Number(it.qty) || 1)
          });
        });
      }
      
      // Read-only products
      var productsHtml = products.map(function(pr) {
        var imgHtml = pr.img
          ? '<img src="' + _esc(pr.img) + '" style="width:44px;height:44px;border-radius:8px;object-fit:cover;background:#2a1f4a;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\';"><div style="display:none;width:44px;height:44px;background:#2a1f4a;border-radius:8px;align-items:center;justify-content:center;font-size:18px;">📦</div>'
          : '<div style="width:44px;height:44px;background:#2a1f4a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div>';
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(20,15,45,0.6);border:1px solid rgba(168,85,247,0.15);border-radius:10px;margin-bottom:6px;">' +
          imgHtml +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:800;color:#e5e7eb;margin-bottom:2px;">' + _esc(pr.name) + '</div>' +
            '<div style="font-size:10px;color:#9ca3af;">' + pr.qty + ' × ' + pr.price.toLocaleString('ar-EG') + ' ر.س</div>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:900;color:#a855f7;">' + pr.subtotal.toLocaleString('ar-EG') + ' ر.س</div>' +
        '</div>';
      }).join('');
      
      var expectedTotal = Number(o.total) || 0;
      var receiptUrl = o.receiptUrl || o.receipt || (o.payment && o.payment.receiptUrl) || '';
      var paymentStatus = (o.payment && o.payment.status) || 'pending';
      var wfStatus = o.workflowStatus || o.status || 'pending';
      
      var receiptHtml = receiptUrl
        ? '<div class="ds"><div class="dt" style="color:#3b82f6;">🧾 سند التحويل (اضغط للتكبير)</div><a href="' + _esc(receiptUrl) + '" target="_blank" style="display:block;"><img src="' + _esc(receiptUrl) + '" style="width:100%;max-height:280px;object-fit:contain;border-radius:10px;background:#0a0e1a;display:block;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'block\\';"><div style="display:none;padding:20px;text-align:center;color:#f87171;font-size:11px;background:rgba(239,68,68,0.1);border-radius:10px;">❌ تعذر تحميل السند</div></a></div>'
        : '<div class="ds" style="background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.3);"><div class="dt" style="color:#ef4444;">⚠️ لا يوجد سند</div></div>';
      
      // Category statuses
      var catStatusHtml = '';
      if (wfStatus === 'awaiting_categories' || wfStatus === 'ready_to_send') {
        var catNames = {
          electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
          sports: 'أدوات رياضية', beauty: 'جمال وعطور', kids: 'مستلزمات أطفال',
          tools: 'أدوات منزلية', home: 'منزل وأثاث'
        };
        var catStatusList = [];
        Object.keys(cats).forEach(function(k) {
          var cs = cats[k].status || 'pending';
          var icon = cs === 'confirmed' ? '✅' : (cs === 'rejected' || cs === 'cancelled' ? '❌' : '⏳');
          var label = { 'pending': 'بانتظار', 'confirmed': 'مؤكد', 'rejected': 'مرفوض', 'cancelled': 'ملغي' }[cs] || 'بانتظار';
          catStatusList.push('<div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(168,85,247,0.06);border-radius:8px;margin-bottom:4px;font-size:11px;"><span style="color:#e5e7eb;font-weight:800;">' + (catNames[k] || k) + '</span><span style="font-weight:800;color:' + (cs === 'confirmed' ? '#10b981' : (cs === 'cancelled' || cs === 'rejected' ? '#ef4444' : '#f59e0b')) + ';">' + icon + ' ' + label + '</span></div>');
        });
        catStatusHtml = '<div class="ds"><div class="dt">📊 قرار الأقسام</div>' + catStatusList.join('') + '</div>';
      }
      
      var body =
        '<div class="ds"><div class="dt">👤 العميل</div>' +
          '<div class="dr"><span class="dl">الاسم</span><span class="dv">' + _esc(o.name || '-') + '</span></div>' +
          '<div class="dr"><span class="dl">الهاتف</span><span class="dv" style="direction:ltr;">' + _esc(o.phone || '-') + '</span></div>' +
          '<div class="dr"><span class="dl">التسليم</span><span class="dv">' + _esc(o.pickup || '-') + '</span></div>' +
        '</div>' +
        '<div class="ds"><div class="dt">📦 المنتجات</div>' + productsHtml + '</div>' +
        receiptHtml +
        '<div class="ds" style="background:linear-gradient(135deg,rgba(168,85,247,0.1),rgba(255,61,154,0.05));border-color:rgba(168,85,247,0.3);">' +
          '<div class="dt">💳 الدفع</div>' +
          '<div class="dr"><span class="dl">المبلغ المتوقع</span><span class="dv" style="color:#a855f7;font-size:16px;font-weight:900;">' + expectedTotal.toLocaleString('ar-EG') + ' ر.س</span></div>' +
          '<div class="dr"><span class="dl">الحالة</span><span class="dv" style="color:' + (paymentStatus === 'verified' ? '#10b981' : paymentStatus === 'rejected' ? '#ef4444' : '#f59e0b') + ';font-weight:900;">' + ({ 'pending': '⏳ بانتظار', 'verified': '✅ مؤكد', 'rejected': '❌ مرفوض' }[paymentStatus] || '⏳ بانتظار') + '</span></div>' +
        '</div>' +
        catStatusHtml;
      
      // Actions depend on payment status
      var actions = '<button class="btn bg2" onclick="A.cm()" style="flex:0.6;">إغلاق</button>';
      
      if (o.phone) {
        actions += '<button class="btn bs" onclick="window.open(\\'https://wa.me/' + _esc(String(o.phone).replace(/\\D/g,'')) + '\\',\\'_blank\\')" style="flex:0.5;">💬</button>';
      }
      
      if (wfStatus === 'awaiting_verification' && paymentStatus === 'pending') {
        actions += '<button class="btn" style="background:rgba(239,68,68,0.15);border:1.5px solid #ef4444;color:#ef4444;flex:1;" onclick="window.__v86Reject(\\'' + _esc(o.id) + '\\')">❌ رفض الدفع</button>';
        actions += '<button class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;flex:1.5;" onclick="window.__v86Confirm(\\'' + _esc(o.id) + '\\')">✅ تأكيد الدفع</button>';
      } else if (wfStatus === 'awaiting_categories') {
        actions += '<div style="flex:2;text-align:center;padding:10px;color:#3b82f6;font-size:11px;font-weight:800;">⏳ بانتظار قرار الأقسام</div>';
      } else if (wfStatus === 'ready_to_send') {
        actions += '<button class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;flex:1.5;" onclick="A.openAssignDriver(\\'' + _esc(o.id) + '\\')">🚚 تعيين سائق</button>';
      }
      
      this.modal('الطلب #' + (o.id || '').substring(0, 14), body, actions);
    };
    
    // Confirm payment
    window.__v86Confirm = async function(id) {
      var self = window.A;
      self.confirm('تأكيد الدفع', 'سيُرسل الطلب إلى مديري الأقسام لمراجعة توفر المنتجات.', async function() {
        try {
          var snap = await FB.db.collection('orders').where('id', '==', id).get();
          if (snap.empty) return self.toast('الطلب غير موجود', 'err');
          
          var o = snap.docs[0].data();
          var customerId = o.customerId || o.userId;
          
          // Init category statuses to pending
          var catUpdates = {};
          Object.keys(o.categories || {}).forEach(function(catKey) {
            catUpdates['categories.' + catKey + '.status'] = 'pending';
            catUpdates['categoryStatus.' + catKey] = 'pending';
          });
          
          await snap.docs[0].ref.update(Object.assign({
            'payment.status': 'verified',
            'payment.verifiedBy': FB.currentUser ? FB.currentUser.uid : '',
            'payment.verifiedAt': new Date(),
            'workflowStatus': 'awaiting_categories'
          }, catUpdates));
          
          // Notify customer: payment received, products being checked
          if (customerId && window.notifyCustomer) {
            await window.notifyCustomer(customerId, 'order.verified', {
              id: id.substring(0, 8).toUpperCase()
            });
          }
          
          // Notify category managers
          try {
            var managers = {};
            var usersSnap = await FB.db.collection('users').where('role', '==', 'cat_manager').get();
            usersSnap.forEach(function(d) {
              var u = d.data();
              if (u.assignedCategory) managers[u.assignedCategory] = d.id;
            });
            
            var notifiedCats = {};
            Object.keys(o.categories || {}).forEach(function(catKey) {
              if (managers[catKey] && !notifiedCats[catKey]) {
                notifiedCats[catKey] = true;
                FB.db.collection('notifications').add({
                  userId: managers[catKey],
                  title: '🔔 طلب جديد في قسمك',
                  body: 'طلب #' + id.substring(0, 8) + ' — راجع توفر المنتجات',
                  type: 'order',
                  event: 'order.new_for_cat',
                  icon: '🔔',
                  important: true,
                  deepLink: 'cat-orders/' + id,
                  read: false,
                  createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(function(){});
              }
            });
          } catch(e) {}
          
          self.toast('✅ تم — بانتظار قرار الأقسام', 'suc');
          self.cm();
          await self.loadData();
          self.renderOrders();
          self.renderDash();
        } catch(e) {
          self.toast('فشل: ' + (e.message || ''), 'err');
        }
      }, 'primary');
    };
    
    // Reject payment
    window.__v86Reject = function(id) {
      var self = window.A;
      self.confirm('رفض الدفع', 'سيتم إبلاغ العميل بالرفض. متابعة؟', async function() {
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
            await window.notifyCustomer(customerId, 'order.payment_rejected', {
              id: id.substring(0, 8).toUpperCase(),
              reason: 'تواصل معنا'
            });
          }
          
          self.toast('تم الرفض', 'suc');
          self.cm();
          await self.loadData();
          self.renderOrders();
          self.renderDash();
        } catch(e) {
          self.toast('فشل: ' + (e.message || ''), 'err');
        }
      }, 'danger');
    };
    
    console.log('[v86] ✓ admin simplified');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 100); });
  } else {
    setTimeout(install, 100);
  }
  setTimeout(install, 3000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);

fs.writeFileSync(p, h);
console.log('✅ v86 admin simplified');
