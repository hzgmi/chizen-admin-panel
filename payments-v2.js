/* payments-v2.js — وحدة المدفوعات النظيفة */
(function() {
  'use strict';
  const state = { orders: [], filter: 'pending', db: null, loaded: false };

  function init() {
    state.db = window.db || (window.firebase && firebase.firestore());
    if (!state.db) return;
    window.PaymentsV2 = { renderSection, verify, reject, refresh, _setFilter: (f) => { state.filter = f; renderSection(); } };
  }

  // الدالة التي تُستدعى عند فتح التبويب
  async function refresh() {
    if (!state.db) return;
    
    // 1. إذا كانت البيانات موجودة في الذاكرة، اعرضها فوراً (بدون انتظار)
    if (state.loaded) {
      renderSection();
      _fetchAndUpdate(); // تحديث في الخلفية
      return;
    }

    // 2. إذا كانت أول مرة، اجلب البيانات واعرضها
    await _fetchAndUpdate();
  }

  async function _fetchAndUpdate() {
    try {
      const snap = await state.db.collection('orders').orderBy('createdAt', 'desc').limit(500).get();
      state.orders = [];
      snap.forEach(d => { const o = d.data(); o.id = d.id; state.orders.push(o); });
      state.loaded = true;

      // تحديث العداد
      const pendingCount = state.orders.filter(o => 
        (o.payment && o.payment.status === 'pending') || o.workflowStatus === 'awaiting_verification'
      ).length;
      
      const badges = document.querySelectorAll('[data-tab="payments"] .nav-badge, #paymentsBadge');
      badges.forEach(b => {
        b.textContent = pendingCount;
        b.style.display = pendingCount > 0 ? 'block' : 'none';
      });

      // إذا كنا في تبويب الدفع، أعد الرسم
      if (state.activeTab === 'payments') renderSection();
    } catch(e) {
      console.error('[PaymentsV2] fetch failed:', e);
    }
  }

  function renderSection() {
    const c = document.getElementById('content');
    if (!c) return;

    const pending = state.orders.filter(o => 
      (o.payment && o.payment.status === 'pending') || o.workflowStatus === 'awaiting_verification'
    );
    const verified = state.orders.filter(o => 
      (o.payment && o.payment.status === 'verified') || o.workflowStatus === 'awaiting_categories' || o.workflowStatus === 'payment_confirmed'
    );
    const rejected = state.orders.filter(o => 
      (o.payment && o.payment.status === 'rejected') || o.workflowStatus === 'payment_rejected'
    );

    let html = '<div style="padding:15px; max-width:800px; margin:0 auto;">';
    
    html += '<div style="display:flex; gap:10px; margin-bottom:20px;">';
    html += `<button onclick="PaymentsV2._setFilter('pending')" style="flex:1; padding:10px; border-radius:8px; border:none; background:${state.filter==='pending'?'#FF3D9A':'#333'}; color:white; font-weight:bold;">⏳ معلقة (${pending.length})</button>`;
    html += `<button onclick="PaymentsV2._setFilter('verified')" style="flex:1; padding:10px; border-radius:8px; border:none; background:${state.filter==='verified'?'#10b981':'#333'}; color:white; font-weight:bold;">✅ مؤكدة (${verified.length})</button>`;
    html += `<button onclick="PaymentsV2._setFilter('rejected')" style="flex:1; padding:10px; border-radius:8px; border:none; background:${state.filter==='rejected'?'#ef4444':'#333'}; color:white; font-weight:bold;">❌ مرفوضة (${rejected.length})</button>`;
    html += '</div>';

    let list = state.filter === 'pending' ? pending : (state.filter === 'verified' ? verified : rejected);
    
    if (!list.length) {
      html += '<div style="text-align:center; padding:40px; color:#9ca3af;">لا توجد طلبات في هذا القسم</div>';
    } else {
      list.forEach(o => {
        html += '<div style="background:#1f2937; border-radius:12px; padding:15px; margin-bottom:15px; color:white; border:1px solid #374151;">';
        html += `<div style="font-weight:bold; margin-bottom:5px;">طلب #${o.id.slice(-6)}</div>`;
        html += `<div style="font-size:14px; color:#9ca3af; margin-bottom:10px;">${o.customerName || o.userName || 'عميل'}</div>`;
        
        if (state.filter === 'pending') {
          html += `<button onclick="PaymentsV2.verify('${o.id}')" style="background:#10b981; color:white; border:none; padding:8px 15px; border-radius:6px; margin-left:5px;">✅ تأكيد</button>`;
          html += `<button onclick="PaymentsV2.reject('${o.id}')" style="background:#ef4444; color:white; border:none; padding:8px 15px; border-radius:6px;">❌ رفض</button>`;
        }
        html += '</div>';
      });
    }
    html += '</div>';
    c.innerHTML = html;
  }

  async function verify(orderId) {
    if (!confirm('تأكيد الدفع لهذا الطلب؟')) return;
    try {
      await state.db.collection('orders').doc(orderId).update({
        workflowStatus: 'awaiting_categories',
        status: 'payment_verified',
        'payment.status': 'verified',
        'payment.verifiedAt': firebase.firestore.FieldValue.serverTimestamp()
      });
      if (window.toast) toast('✅ تم تأكيد الدفع', 'success');
      await _fetchAndUpdate();
    } catch(e) {
      if (window.toast) toast('❌ فشل التأكيد: ' + e.message, 'error');
    }
  }

  async function reject(orderId) {
    const reason = prompt('أدخل سبب الرفض:');
    if (!reason) return;
    try {
      await state.db.collection('orders').doc(orderId).update({
        workflowStatus: 'payment_rejected',
        'payment.status': 'rejected',
        'payment.rejectedReason': reason,
        'payment.rejectedAt': firebase.firestore.FieldValue.serverTimestamp()
      });
      if (window.toast) toast('✅ تم رفض الدفع', 'success');
      await _fetchAndUpdate();
    } catch(e) {
      if (window.toast) toast('❌ فشل الرفض: ' + e.message, 'error');
    }
  }

  window.PaymentsV2 = { renderSection, verify, reject, refresh, _setFilter: (f) => { state.filter = f; renderSection(); } };
  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
