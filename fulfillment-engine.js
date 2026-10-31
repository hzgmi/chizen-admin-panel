/* CHIZEN | fulfillment-engine.js
   نظام دورة الطلب الجديد — طبقة موازية لا تكسر الوظائف القديمة
   المرحلة: 2 (foundation) — لا واجهة، لا ربط */
(function() {
  'use strict';

  const STAGES = {
    pending_payment:            { ar: 'بانتظار تأكيد الدفع',       order: 1,  color: '#f59e0b' },
    payment_confirmed:          { ar: 'تم تأكيد الدفع',            order: 2,  color: '#10b981' },
    checking_availability:      { ar: 'جارٍ التحقق من التوفر',     order: 3,  color: '#3b82f6' },
    awaiting_customer_decision: { ar: 'بانتظار قرار العميل',       order: 4,  color: '#f59e0b' },
    confirmed:                  { ar: 'تم تأكيد الطلب',            order: 5,  color: '#10b981' },
    preparing:                  { ar: 'المورد يجهز الطلب',         order: 6,  color: '#3b82f6' },
    ready_for_pickup:           { ar: 'جاهز للاستلام',             order: 7,  color: '#8b5cf6' },
    assigned_to_courier:        { ar: 'مُسند للمندوب',             order: 8,  color: '#8b5cf6' },
    partially_picked_up:        { ar: 'استلام جزئي من المورد',     order: 9,  color: '#f59e0b' },
    picked_up:                  { ar: 'تم استلام كل المنتجات',    order: 10, color: '#10b981' },
    on_the_way:                 { ar: 'في الطريق',                 order: 11, color: '#ec4899' },
    delivered:                  { ar: 'تم التسليم',                order: 12, color: '#10b981' },
    completed:                  { ar: 'مكتمل',                     order: 13, color: '#059669' },
    problem:                    { ar: 'مشكلة',                     order: 14, color: '#ef4444' },
    cancelled:                  { ar: 'ملغي',                      order: 15, color: '#6b7280' },
    refund_pending:             { ar: 'بانتظار استرداد',           order: 16, color: '#f59e0b' },
    refunded:                   { ar: 'تم الاسترداد',              order: 17, color: '#6b7280' }
  };

  const LEGACY_MAP = {
    'awaiting_verification': 'pending_payment',
    'awaiting_categories':   'checking_availability',
    'ready_to_send':         'ready_for_pickup',
    'sent_to_customer':      'on_the_way',
    'delivered':             'delivered',
    'payment_rejected':      'cancelled',
    'cancelled':             'cancelled',
    'completed':             'completed'
  };

  const TRANSITIONS = {
    pending_payment:            { to: ['payment_confirmed', 'cancelled'],                    roles: ['super_admin', 'accountant'] },
    payment_confirmed:          { to: ['checking_availability'],                             roles: ['system'] },
    checking_availability:      { to: ['confirmed', 'awaiting_customer_decision', 'problem'], roles: ['cat_manager'] },
    awaiting_customer_decision: { to: ['confirmed', 'cancelled', 'refund_pending'],          roles: ['customer', 'cat_manager'] },
    confirmed:                  { to: ['preparing'],                                          roles: ['system'] },
    preparing:                  { to: ['ready_for_pickup', 'problem'],                        roles: ['supplier', 'cat_manager'] },
    ready_for_pickup:           { to: ['assigned_to_courier'],                                roles: ['super_admin', 'delivery_mgr'] },
    assigned_to_courier:        { to: ['partially_picked_up', 'picked_up', 'problem'],        roles: ['delivery_mgr'] },
    partially_picked_up:        { to: ['picked_up', 'problem'],                               roles: ['delivery_mgr'] },
    picked_up:                  { to: ['on_the_way'],                                          roles: ['delivery_mgr'] },
    on_the_way:                 { to: ['delivered', 'problem'],                                roles: ['delivery_mgr'] },
    delivered:                  { to: ['completed', 'refund_pending', 'problem'],             roles: ['super_admin', 'accountant'] },
    problem:                    { to: ['cancelled', 'refund_pending', 'delivered'],           roles: ['super_admin'] },
    cancelled:                  { to: ['refund_pending'],                                      roles: ['super_admin', 'accountant'] },
    refund_pending:             { to: ['refunded'],                                            roles: ['super_admin', 'accountant'] },
    refunded:                   { to: [],                                                      roles: [] },
    completed:                  { to: [],                                                      roles: [] }
  };

  const API = {
    STAGES, LEGACY_MAP, TRANSITIONS,

    getCurrentStage: function(order) {
      if (!order) return null;
      if (order.fulfillmentStage && STAGES[order.fulfillmentStage]) return order.fulfillmentStage;
      var legacy = order.workflowStatus || order.status;
      return LEGACY_MAP[legacy] || 'pending_payment';
    },

    canTransition: function(fromStage, toStage, role) {
      var rule = TRANSITIONS[fromStage];
      if (!rule) return { ok: false, reason: 'مرحلة غير معروفة: ' + fromStage };
      if (rule.to.indexOf(toStage) === -1) return { ok: false, reason: 'انتقال غير مسموح: ' + fromStage + ' → ' + toStage };
      if (role && rule.roles.indexOf(role) === -1 && rule.roles.indexOf('system') === -1) {
        return { ok: false, reason: 'الدور (' + role + ') غير مصرح له بهذا الانتقال' };
      }
      return { ok: true };
    },

    advance: async function(orderId, toStage, actor, payload) {
      if (!window.firebase || !firebase.firestore) throw new Error('Firebase غير محمّل');
      var db = firebase.firestore();
      var user = firebase.auth && firebase.auth().currentUser;
      if (!user) throw new Error('يجب تسجيل الدخول');
      var actorUid = user.uid;
      var actorRole = (actor && actor.role) || window.CURRENT_ROLE || 'unknown';
      var actorName = (actor && actor.name) || user.displayName || user.email || '';

      return db.runTransaction(async function(tx) {
        var ref = db.collection('orders').doc(orderId);
        var snap = await tx.get(ref);
        if (!snap.exists) throw new Error('الطلب غير موجود');
        var order = snap.data();
        var fromStage = API.getCurrentStage(order);
        var check = API.canTransition(fromStage, toStage, actorRole);
        if (!check.ok) throw new Error(check.reason);

        var historyKey = 'fh_' + Date.now();
        var update = {
          fulfillmentStage: toStage,
          fulfillmentUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          ['fulfillmentHistory.' + historyKey]: {
            from: fromStage, to: toStage, by: actorUid, role: actorRole, name: actorName,
            at: firebase.firestore.FieldValue.serverTimestamp(),
            payload: payload || null
          }
        };
        tx.update(ref, update);

        var logRef = db.collection('activity_log').doc();
        tx.set(logRef, {
          orderId: orderId, fromStage: fromStage, toStage: toStage,
          actorUid: actorUid, actorRole: actorRole, actorName: actorName,
          payload: payload || null,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          type: 'stage_transition'
        });

        return { from: fromStage, to: toStage };
      });
    },

    selfTest: function() {
      var stages = Object.keys(STAGES);
      var errors = [];
      stages.forEach(function(s) {
        if (!TRANSITIONS[s]) errors.push('مرحلة بدون قواعد انتقال: ' + s);
      });
      Object.keys(TRANSITIONS).forEach(function(s) {
        if (!STAGES[s]) errors.push('قاعدة انتقال لمرحلة غير معروفة: ' + s);
      });
      return { total: stages.length, errors: errors, ok: errors.length === 0 };
    }
  };

  window.FulfillmentEngine = API;
  console.log('[CHIZEN] FulfillmentEngine v1 loaded — ' + Object.keys(STAGES).length + ' stages');

  // شارة تشخيص — تظهر فقط عند ?debug=1
  try {
    if (window.location && window.location.search.indexOf('debug=1') !== -1) {
      var showBadge = function() {
        if (!document.body) { setTimeout(showBadge, 300); return; }
        var test = API.selfTest();
        var bg = test.ok ? '#10b981' : '#ef4444';
        var txt = test.ok ? ('✅ المحرك يعمل — ' + test.total + ' حالة') : ('❌ أخطاء: ' + test.errors.join(' | '));
        var el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:10px;left:10px;background:' + bg + ';color:#fff;padding:10px 16px;border-radius:12px;font-weight:900;font-size:13px;z-index:9999999;box-shadow:0 6px 20px rgba(0,0,0,0.4);font-family:sans-serif;direction:rtl;';
        el.textContent = txt;
        document.body.appendChild(el);
        setTimeout(function() { try { el.remove(); } catch(e){} }, 8000);
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(showBadge, 1500); });
      } else {
        setTimeout(showBadge, 1500);
      }
    }
  } catch(e) { console.warn('[FH] badge error:', e); }
})();
