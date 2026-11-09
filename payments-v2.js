/* payments-v2.js — وحدة المدفوعات النظيفة (مع التفاصيل والسند) */
(function() {
  'use strict';
  const state = { orders: [], filter: 'pending', db: null, loaded: false };

  function init() {
    state.db = window.db || (window.firebase && firebase.firestore());
    if (!state.db) return;
    window.PaymentsV2 = { renderSection, verify, reject, refresh, _setFilter: (f) => { state.filter = f; renderSection(); } };
  }

  async function refresh(force = false) {
    if (!state.db) return;
    if (state.loaded && !force) {
      renderSection();
      _fetchAndUpdate();
      return;
    }
    const c = document.getElementById('content');
    if (c && !state.loaded) c.innerHTML = '<div style="text-align:center;padding:40px;">⏳ جاري التحميل...</div>';
    await _fetchAndUpdate();
  }

  async function _fetchAndUpdate() {
    try {
      const snap = await state.db.collection('orders').orderBy('createdAt', 'desc').limit(500).get();
      state.orders = [];
      snap.forEach(d => { const o = d.data(); o.id = d.id; state.orders.push(o); });
      state.loaded = true;

      const pendingCount = state.orders.filter(o => 
        (o.payment && o.payment.status === 'pending') || o.workflowStatus === 'awaiting_verification'
      ).length;
      
      const badges = document.querySelectorAll('[data-tab="payments"] .nav-badge, #paymentsBadge');
      badges.forEach(b => {
        b.textContent = pendingCount;
        b.style.display = pendingCount > 0 ? 'block' : 'none';
      });

      renderSection();
    } catch(e) {
      console.error('[PaymentsV2] fetch failed:', e);
    }
  }

  function getReceiptUrl(o) {
    return (o.payment && o.payment.receiptUrl) || o.receiptUrl || o.sanadUrl || '';
  }

  function fmtDate(ts) {
    try {
      var d = ts && ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('ar-YE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
    } catch(e) { return ''; }
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
    
    // أزرار التبديل
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
        const receiptUrl = getReceiptUrl(o);
        const custName = o.customerName || o.userName || o.name || 'عميل';
        const phone = o.phone || o.customerPhone || '';
        const total = o.total || o.amount || o.price || 0;
        const bank = (o.payment && (o.payment.bankName || o.payment.method)) || '—';
        const date = fmtDate(o.createdAt);

        html += '<div style="background:#1f2937; border-radius:12px; padding:15px; margin-bottom:15px; color:white; border:1px solid #374151;">';
        
        // رأس البطاقة
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">`;
        html += `<div style="font-weight:bold; font-size:16px;">طلب #${o.id.slice(-6)}</div>`;
        html += `<div style="font-size:12px; color:#9ca3af;">${date}</div>`;
        html += `</div>`;

        // التفاصيل
        html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:14px; margin-bottom:12px;">`;
        html += `<div>👤 <strong>${custName}</strong></div>`;
        html += `<div>📱 ${phone || '—'}</div>`;
        html += `<div>💰 ${total} ريال</div>`;
        html += `<div>🏦 ${bank}</div>`;
        html += `</div>`;

        // صورة السند
        if (receiptUrl) {
          html += `<div style="margin-bottom:12px;">`;
          html += `<a href="${receiptUrl}" target="_blank" style="display:inline-block; background:#374151; color:#FF3D9A; padding:8px 12px; border-radius:6px; text-decoration:none; font-size:13px; border:1px solid #FF3D9A;">📸 عرض السند</a>`;
          html += `</div>`;
        } else {
          html += `<div style="margin-bottom:12px; color:#ef4444; font-size:13px;">⚠️ لا يوجد سند</div>`;
        }

        // الأزرار (للمعلقة فقط)
        if (state.filter === 'pending') {
          html += `<div style="display:flex; gap:8px;">`;
          html += `<button onclick="PaymentsV2.verify('${o.id}')" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold;">✅ تأكيد</button>`;
          html += `<button onclick="PaymentsV2.reject('${o.id}')" style="flex:1; background:#ef4444; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold;">❌ رفض</button>`;
          html += `</div>`;
        }

        // سبب الرفض (للمرفوضة فقط)
        if (state.filter === 'rejected' && o.payment && o.payment.rejectedReason) {
          html += `<div style="margin-top:10px; padding:8px; background:#7f1d1d; border-radius:6px; font-size:13px;">سبب الرفض: ${o.payment.rejectedReason}</div>`;
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
        status: 'confirmed',
        'payment.status': 'verified',
        fulfillmentStage: 'preparing',
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
        status: 'rejected',
        fulfillmentStage: 'payment_rejected',
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
