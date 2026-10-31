/* ═══════════════════════════════════════════════════════════════
   CHIZEN — Commission Engine
   يحسب العمولات المستحقة ويضيفها لمحافظ الموظفين
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var CE = window.CommissionEngine = window.CommissionEngine || {};

  // ═══ Config ═══
  CE.RATES = {
    cat_manager: 5,     // 5% من قيمة المنتجات
    delivery_mgr: 10,   // 10 ر.س ثابت لكل طلب
    bookings_mgr: 2     // 2% من قيمة الحجز
  };
  CE.RETURN_WINDOW_DAYS = 3;
  CE.LAST_RUN_KEY = 'chizen_ce_last_run';
  CE.RUN_COOLDOWN_MS = 5 * 60 * 1000; // 5 دقائق

  // ═══ Helpers ═══
  CE.isEligible = function(order) {
    if (!order) return false;
    if (order.status === 'cancelled') return false;
    if (order.status === 'returned') return false;
    if (order.workflowStatus !== 'delivered') return false;
    if (!order.payment || order.payment.status !== 'verified') return false;
    if (!order.deliveredAt) return false;
    var deliveredMs = order.deliveredAt.seconds ? order.deliveredAt.seconds * 1000 : 0;
    if (!deliveredMs) return false;
    return ((Date.now() - deliveredMs) / (1000 * 60 * 60 * 24)) >= CE.RETURN_WINDOW_DAYS;
  };

  CE.getCategoriesAmounts = function(order) {
    var amounts = {};
    (order.items || []).forEach(function(it) {
      var cat = it.category || it.cat || 'other';
      var price = Number(it.price) || 0;
      var qty = Number(it.qty) || Number(it.quantity) || 1;
      amounts[cat] = (amounts[cat] || 0) + (price * qty);
    });
    if (order.categories && typeof order.categories === 'object') {
      Object.keys(order.categories).forEach(function(cat) {
        var data = order.categories[cat];
        if (data && data.items && Array.isArray(data.items) && !amounts[cat]) {
          var sum = 0;
          data.items.forEach(function(it) {
            sum += (Number(it.price) || 0) * (Number(it.qty) || 1);
          });
          amounts[cat] = sum;
        }
      });
    }
    return amounts;
  };

  CE.findCategoryManager = async function(db, category) {
    try {
      var snap = await db.collection('users')
        .where('role', '==', 'cat_manager')
        .where('assignedCategory', '==', category)
        .limit(1).get();
      if (snap.empty) return null;
      var d = snap.docs[0];
      return { id: d.id, name: d.data().name || d.data().email || 'موظف' };
    } catch(e) { return null; }
  };

  CE.findDeliveryManager = async function(db, order) {
    if (order.deliveryInfo && order.deliveryInfo.assignedBy) {
      try {
        var doc = await db.collection('users').doc(order.deliveryInfo.assignedBy).get();
        if (doc.exists) return { id: doc.id, name: doc.data().name || 'مندوب' };
      } catch(e) {}
    }
    try {
      var snap = await db.collection('users').where('role', '==', 'delivery_mgr').limit(1).get();
      if (!snap.empty) {
        var d = snap.docs[0];
        return { id: d.id, name: d.data().name || 'مندوب' };
      }
    } catch(e) {}
    return null;
  };

  CE.buildCommissionsForOrder = async function(db, order) {
    var results = [];
    var catAmounts = CE.getCategoriesAmounts(order);
    for (var cat of Object.keys(catAmounts)) {
      var amount = catAmounts[cat];
      if (amount < 1) continue;
      var mgr = await CE.findCategoryManager(db, cat);
      if (!mgr) continue;
      var commAmount = Math.round(amount * CE.RATES.cat_manager / 100);
      if (commAmount < 1) continue;
      results.push({
        docId: order.id + '_cat_' + mgr.id,
        employeeId: mgr.id, employeeName: mgr.name,
        employeeRole: 'cat_manager', category: cat,
        orderTotal: Number(order.total) || 0,
        baseAmount: amount, commissionRate: CE.RATES.cat_manager,
        commissionAmount: commAmount
      });
    }
    var delMgr = await CE.findDeliveryManager(db, order);
    if (delMgr) {
      results.push({
        docId: order.id + '_del_' + delMgr.id,
        employeeId: delMgr.id, employeeName: delMgr.name,
        employeeRole: 'delivery_mgr',
        orderTotal: Number(order.total) || 0,
        baseAmount: (order.deliveryInfo && order.deliveryInfo.deliveryFee) || 0,
        commissionRate: 0,
        commissionAmount: CE.RATES.delivery_mgr
      });
    }
    return results;
  };

  CE.createCommission = async function(db, order, c) {
    var existing = await db.collection('commissions').doc(c.docId).get();
    if (existing.exists) return { skipped: true, id: c.docId };
    await db.collection('commissions').doc(c.docId).set({
      orderId: order.id,
      employeeId: c.employeeId, employeeName: c.employeeName,
      employeeRole: c.employeeRole, category: c.category || null,
      orderTotal: c.orderTotal, baseAmount: c.baseAmount,
      commissionRate: c.commissionRate, commissionAmount: c.commissionAmount,
      status: 'earned',
      deliveredAt: order.deliveredAt,
      earnedAt: firebase.firestore.FieldValue.serverTimestamp(),
      paidAt: null, paymentId: null, paidBy: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { created: true, id: c.docId };
  };

  CE.sendNotification = async function(db, employeeId, amount, orderId) {
    try {
      var fmt = Number(amount).toLocaleString('ar-EG');
      await db.collection('employee_messages').add({
        from: 'system', fromName: 'نظام العمولات',
        to: employeeId,
        subject: '💰 عمولة جديدة',
        body: 'ممتاز! تمت إضافة ' + fmt + ' ر.س إلى محفظتك من الطلب #' + String(orderId).substring(0, 8),
        type: 'reward', read: false, readAt: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.warn('[CE] notify:', e.message); }
  };

  CE.process = async function(options) {
    options = options || {};
    var db = firebase.firestore();
    if (!options.force) {
      var lastRun = Number(localStorage.getItem(CE.LAST_RUN_KEY) || 0);
      if (Date.now() - lastRun < CE.RUN_COOLDOWN_MS) {
        return { skipped: true, reason: 'cooldown' };
      }
    }
    console.log('[CE] processing commissions...');
    localStorage.setItem(CE.LAST_RUN_KEY, Date.now());
    try {
      var snap = await db.collection('orders')
        .where('workflowStatus', '==', 'delivered')
        .orderBy('deliveredAt', 'desc').limit(100).get();
      var stats = { processed: 0, created: 0, skipped: 0, errors: 0 };
      for (var doc of snap.docs) {
        var order = doc.data(); order.id = doc.id;
        if (!CE.isEligible(order)) continue;
        stats.processed++;
        try {
          var commissions = await CE.buildCommissionsForOrder(db, order);
          for (var c of commissions) {
            var result = await CE.createCommission(db, order, c);
            if (result.created) {
              stats.created++;
              await CE.sendNotification(db, c.employeeId, c.commissionAmount, order.id);
            } else { stats.skipped++; }
          }
        } catch(e) { stats.errors++; }
      }
      console.log('[CE] done:', stats);
      return stats;
    } catch(e) {
      return { error: e.message };
    }
  };

  CE.getWallet = async function(employeeId) {
    var db = firebase.firestore();
    var snap = await db.collection('commissions').where('employeeId', '==', employeeId).get();
    var wallet = { total: 0, thisMonth: 0, pending: 0, earned: 0, paid: 0, cancelled: 0, ordersCount: 0, items: [] };
    var monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    snap.docs.forEach(function(doc) {
      var c = doc.data(); c.id = doc.id;
      wallet.items.push(c);
      var amount = Number(c.commissionAmount) || 0;
      if (c.status === 'pending') wallet.pending += amount;
      else if (c.status === 'earned') wallet.earned += amount;
      else if (c.status === 'paid') wallet.paid += amount;
      else if (c.status === 'cancelled') wallet.cancelled += amount;
      if (c.status !== 'cancelled') {
        wallet.total += amount;
        if (c.earnedAt && c.earnedAt.seconds) {
          if (new Date(c.earnedAt.seconds * 1000) >= monthStart) wallet.thisMonth += amount;
        }
      }
      wallet.ordersCount++;
    });
    wallet.items.sort(function(a, b) {
      return (b.earnedAt ? b.earnedAt.seconds : 0) - (a.earnedAt ? a.earnedAt.seconds : 0);
    });
    return wallet;
  };

  console.log('[CE] Commission Engine loaded successfully.');
})();
