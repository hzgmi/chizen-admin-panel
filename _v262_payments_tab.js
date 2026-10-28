const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

if (h.includes('data-tab="payments"')) { console.log('already added'); process.exit(0); }

// 1. إضافة التبويب
const ordersTab = '<button class="vtab" data-tab="orders">📦 الطلبات</button>';
if (!h.includes(ordersTab)) { console.log('❌ orders tab not found'); process.exit(1); }
h = h.replace(ordersTab,
  '<button class="vtab" data-tab="payments">💳 الدفع<span class="vtab-badge" id="paymentsBadge" style="display:none">0</span></button>\n    ' + ordersTab
);

// 2. ربط في renderTab
const renderTabM = "else if (tab === 'orders'){ c.innerHTML = renderOrders(); bindOrderChips(); }";
if (!h.includes(renderTabM)) { console.log('❌ renderTab not found'); process.exit(1); }
h = h.replace(renderTabM,
  "else if (tab === 'payments'){ c.innerHTML = renderPayments(); bindPaymentActions(); }\n  " + renderTabM
);

// 3. إضافة الدوال قبل renderAccountant
const accM = 'function renderAccountant(){';
if (!h.includes(accM)) { console.log('❌ accountant not found'); process.exit(1); }

const paymentCode = `
function renderPayments(){
  var pending = state.orders.filter(function(o){ 
    return (o.payment && o.payment.status === 'pending') || o.workflowStatus === 'awaiting_verification';
  });
  
  if (!pending.length) {
    return '<div class="vst">💳 تأكيد الدفع</div><div class="vempty"><div class="vempty-icon">✨</div><div class="vempty-txt">لا توجد طلبات بانتظار تأكيد الدفع</div></div>';
  }
  
  var html = pending.map(function(o){
    var receiptUrl = (o.payment && o.payment.receiptUrl) || o.receiptUrl || o.sanadUrl || '';
    var total = Number(o.total) || 0;
    
    var allItems = [];
    if (o.categories) {
      Object.keys(o.categories).forEach(function(cat){
        var catData = o.categories[cat];
        if (catData && catData.items) {
          catData.items.forEach(function(item){
            allItems.push({name: item.name, qty: item.qty||1, price: item.price||0, subtotal: (item.price||0)*(item.qty||1)});
          });
        }
      });
    }
    if (!allItems.length && o.items) {
      o.items.forEach(function(item){
        allItems.push({name: item.name, qty: item.qty||1, price: item.price||0, subtotal: (item.price||0)*(item.qty||1)});
      });
    }
    
    var itemsHtml = allItems.map(function(item){
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11px;border-bottom:1px solid rgba(155,77,255,0.1)">'
        + '<span style="color:#fff">' + (item.name||'') + ' × ' + item.qty + '</span>'
        + '<span style="color:#a78bfa">' + item.subtotal.toFixed(0) + ' ر</span>'
        + '</div>';
    }).join('');
    
    return '<div class="vreview" data-oid="' + o.id + '">'
      + '<div class="vreview-head">'
      +   (receiptUrl 
          ? '<img src="' + receiptUrl + '" onclick="__viewReceipt(this.src)" class="vreview-img" style="cursor:pointer;object-fit:cover;border:2px solid rgba(155,77,255,0.4)" onerror="this.style.opacity=0.3">'
          : '<div class="vreview-img" style="display:flex;align-items:center;justify-content:center;font-size:24px;background:rgba(155,77,255,0.1)">📄</div>')
      +   '<div class="vreview-meta">'
      +     '<div class="vreview-name">#' + o.id.slice(-6) + ' — ' + (o.customerName || 'عميل') + '</div>'
      +     '<div class="vreview-sub">📞 ' + (o.phone || o.customerPhone || '—') + '</div>'
      +     '<div class="vreview-sub" style="color:#ec4899;font-weight:800;font-size:14px">💰 ' + total.toFixed(0) + ' ر.ي</div>'
      +   '</div>'
      + '</div>'
      + '<div style="background:rgba(10,8,37,0.7);border-radius:10px;padding:10px;margin-bottom:10px;max-height:180px;overflow-y:auto">'
      +   '<div style="font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px">المنتجات (' + allItems.length + '):</div>'
      +   (itemsHtml || '<div style="font-size:11px;color:#a78bfa;text-align:center">لا توجد منتجات</div>')
      + '</div>'
      + '<input class="vreview-reason" data-reason-for="' + o.id + '" placeholder="سبب الرفض (عند الرفض فقط)">'
      + '<div class="vreview-actions">'
      +   '<button class="vreview-btn approve" data-verify="' + o.id + '">✓ تأكيد الدفع</button>'
      +   '<button class="vreview-btn reject" data-reject-payment="' + o.id + '">✗ رفض الدفع</button>'
      + '</div>'
      + '</div>';
  }).join('');
  
  return '<div class="vst">💳 تأكيد الدفع (' + pending.length + ')</div>' + html;
}

function bindPaymentActions(){
  document.querySelectorAll('[data-verify]').forEach(function(btn){
    btn.onclick = function(){ verifyPayment(this.dataset.verify); };
  });
  document.querySelectorAll('[data-reject-payment]').forEach(function(btn){
    btn.onclick = function(){
      var id = this.dataset.rejectPayment;
      var reasonInput = document.querySelector('[data-reason-for="' + id + '"]');
      var reason = reasonInput ? reasonInput.value.trim() : '';
      if (!reason){ toast('⚠️ أدخل سبب الرفض', 'error'); return; }
      rejectPayment(id, reason);
    };
  });
}

window.__viewReceipt = function(url){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999999;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  var img = document.createElement('img');
  img.src = url;
  img.style.cssText = 'max-width:100%;max-height:100%;border-radius:8px';
  overlay.appendChild(img);
  document.body.appendChild(overlay);
  overlay.onclick = function(){ overlay.remove(); };
};

async function verifyPayment(orderId){
  if (!confirm('تأكيد الدفع لهذا الطلب؟')) return;
  try {
    var order = state.orders.find(function(o){ return o.id === orderId; });
    if (!order) return;
    
    var updates = {
      workflowStatus: 'awaiting_categories',
      'payment.status': 'verified',
      'payment.verifiedBy': state.user.uid,
      'payment.verifiedAt': firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (order.categories) {
      Object.keys(order.categories).forEach(function(cat){
        updates['categories.' + cat + '.status'] = 'pending';
      });
    }
    
    await db.collection('orders').doc(orderId).update(updates);
    
    var custId = order.customerId || order.userId;
    if (custId) {
      db.collection('notifications').add({
        userId: custId,
        title: '✅ تم تأكيد دفعتك',
        body: 'طلبك #' + orderId.slice(-6) + ' قيد المعالجة',
        type: 'order', event: 'payment_verified', icon: '✅',
        read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function(){});
    }
    
    if (order.categories) {
      var cats = Object.keys(order.categories);
      for (var i = 0; i < cats.length; i++) {
        try {
          var mgrs = await db.collection('users').where('role', '==', 'cat_manager').where('assignedCategory', '==', cats[i]).get();
          mgrs.forEach(function(mgr){
            db.collection('notifications').add({
              userId: mgr.id,
              title: '📦 طلب جديد في قسمك',
              body: 'طلب #' + orderId.slice(-6) + ' — تحقق من التوفر',
              type: 'order', event: 'cat_order_pending', icon: '📦',
              read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(){});
          });
        } catch(e){}
      }
    }
    
    toast('✅ تم تأكيد الدفع', 'success');
    await reloadData();
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

async function rejectPayment(orderId, reason){
  if (!confirm('رفض الدفع؟ السبب: ' + reason)) return;
  try {
    var order = state.orders.find(function(o){ return o.id === orderId; });
    if (!order) return;
    
    await db.collection('orders').doc(orderId).update({
      workflowStatus: 'payment_rejected',
      'payment.status': 'rejected',
      'payment.rejectedReason': reason,
      'payment.rejectedBy': state.user.uid,
      'payment.rejectedAt': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    var custId = order.customerId || order.userId;
    if (custId) {
      db.collection('notifications').add({
        userId: custId,
        title: '❌ تم رفض دفعتك',
        body: 'طلب #' + orderId.slice(-6) + ' — السبب: ' + reason,
        type: 'warning', event: 'payment_rejected', icon: '❌', important: true,
        read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function(){});
    }
    
    toast('تم رفض الدفع', 'error');
    await reloadData();
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

function updatePaymentsBadge(){
  var pending = state.orders.filter(function(o){ 
    return (o.payment && o.payment.status === 'pending') || o.workflowStatus === 'awaiting_verification';
  });
  var badge = document.getElementById('paymentsBadge');
  if (!badge) return;
  if (pending.length > 0) {
    badge.textContent = pending.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

`;

h = h.replace(accM, paymentCode + accM);

// 4. استدعاء updatePaymentsBadge مع بدء التطبيق
h = h.replace(
  "    updateReviewBadge();\n  } catch(e){",
  "    updateReviewBadge();\n    updatePaymentsBadge();\n  } catch(e){"
);

// 5. استدعاء updatePaymentsBadge في reloadData
h = h.replace(
  "    updateReviewBadge();\n    toast('✅ تم التحديث', 'success');",
  "    updateReviewBadge();\n    updatePaymentsBadge();\n    toast('✅ تم التحديث', 'success');"
);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v262 added | ' + before + ' -> ' + h.length);
