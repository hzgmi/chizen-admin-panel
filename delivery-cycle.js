/* CHIZEN | delivery-cycle.js — المرحلة 5: دورة المندوب الكاملة */
(function() {
  'use strict';

  function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

  function fmtDate(ts) {
    if (!ts) return '—';
    try {
      var d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
      return d.toLocaleDateString('ar-YE') + ' ' + d.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
    } catch(e) { return '—'; }
  }

  async function notifyCustomer(cid, title, body, event, icon) {
    if (!cid) return;
    try {
      await firebase.firestore().collection('notifications').add({
        userId: cid, title: title, body: body,
        type: 'order', event: event, icon: icon || '📦',
        read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.warn('[notify]', e.message); }
  }

  // ═══ 1. استلام من المورد ═══
  window.__dlvPickupFromSupplier = async function(orderId) {
    if (!confirm('هل استلمت جميع المنتجات من المورد؟\n\nسيتم تحويل الطلب إلى "بدء التوصيل".')) return;
    try {
      var db = firebase.firestore();
      var user = firebase.auth().currentUser;
      if (!user) { alert('يجب تسجيل الدخول'); return; }
      var orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) { alert('الطلب غير موجود'); return; }
      var o = orderDoc.data();

      await db.collection('orders').doc(orderId).update({
        fulfillmentStage: 'picked_up',
        workflowStatus: 'sent_to_customer',
        pickedUpAt: firebase.firestore.FieldValue.serverTimestamp(),
        pickedUpBy: user.uid
      });

      if (window.FulfillmentEngine) {
        try { await FulfillmentEngine.advance(orderId, 'picked_up', { role: 'delivery_mgr' }); } catch(e) { console.warn('[fh pickup]', e.message); }
      }

      await notifyCustomer(o.customerId || o.userId,
        '📦 تم استلام طلبك من المورد',
        'طلبك #' + orderId.slice(-6) + ' جاهز للتوصيل',
        'order_picked_up', '📦');

      alert('✅ تم الاستلام — يمكنك الآن بدء التوصيل');
      if (window.renderContent) window.renderContent();
    } catch(e) {
      console.error('[pickup]', e);
      alert('❌ ' + (e.message || e.code || 'خطأ'));
    }
  };

  // ═══ 2. بدء التوصيل (مع توليد OTP) ═══
  window.__dlvStartDelivery = async function(orderId) {
    if (!confirm('هل أنت في الطريق إلى العميل الآن؟\n\nسيتم إشعار العميل.')) return;
    try {
      var db = firebase.firestore();
      var user = firebase.auth().currentUser;
      if (!user) { alert('يجب تسجيل الدخول'); return; }
      var orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) { alert('الطلب غير موجود'); return; }
      var o = orderDoc.data();

      var otp = genOTP();
      await db.collection('orders').doc(orderId).update({
        fulfillmentStage: 'on_the_way',
        workflowStatus: 'sent_to_customer',
        onTheWayAt: firebase.firestore.FieldValue.serverTimestamp(),
        deliveryStartedBy: user.uid,
        deliveryOTP: otp,
        deliveryOTPAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (window.FulfillmentEngine) {
        try { await FulfillmentEngine.advance(orderId, 'on_the_way', { role: 'delivery_mgr' }); } catch(e) { console.warn('[fh on_way]', e.message); }
      }

      await notifyCustomer(o.customerId || o.userId,
        '🚚 طلبك في الطريق إليك',
        'رمز التسليم: ' + otp + ' — يرجى إعطاؤه للمندوب عند الاستلام',
        'order_on_the_way', '🚚');

      alert('✅ بدأ التوصيل\n\n🔐 رمز التسليم للعميل: ' + otp + '\n\n(تم إشعار العميل بالرمز — اطلبه منه عند التسليم)');
      if (window.renderContent) window.renderContent();
    } catch(e) {
      console.error('[start-delivery]', e);
      alert('❌ ' + (e.message || e.code || 'خطأ'));
    }
  };

  // ═══ 3. تسليم مع تحقق OTP ═══
  window.__dlvDeliverWithOTP = async function(orderId) {
    try {
      var db = firebase.firestore();
      var user = firebase.auth().currentUser;
      if (!user) { alert('يجب تسجيل الدخول'); return; }
      var orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) { alert('الطلب غير موجود'); return; }
      var o = orderDoc.data();
      var expected = o.deliveryOTP;

      if (!expected) {
        if (!confirm('لم يُولَّد رمز التسليم لهذا الطلب.\n\nهل تريد توليد رمز الآن وعرضه للعميل؟')) return;
        expected = genOTP();
        await db.collection('orders').doc(orderId).update({
          deliveryOTP: expected,
          deliveryOTPAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('🔐 رمز التسليم: ' + expected + '\n\nاعرضه للعميل ليتأكد');
      }

      var entered = prompt('🔐 أدخل رمز التسليم من العميل:');
      if (!entered) return;
      if (String(entered).trim() !== String(expected)) {
        alert('❌ رمز خاطئ — لم يتم التسليم');
        return;
      }

      await db.collection('orders').doc(orderId).update({
        fulfillmentStage: 'delivered',
        workflowStatus: 'delivered',
        status: 'completed',
        deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
        deliveredBy: user.uid,
        deliveryOTPVerified: true
      });

      if (window.FulfillmentEngine) {
        try { await FulfillmentEngine.advance(orderId, 'delivered', { role: 'delivery_mgr' }); } catch(e) { console.warn('[fh delivered]', e.message); }
      }

      await notifyCustomer(o.customerId || o.userId,
        '✅ تم تسليم طلبك بنجاح',
        'شكراً لثقتك في CHIZEN — افتح التطبيق لعرض سند الاستلام',
        'order_delivered', '✅');

      // محاولة احتساب العمولة (إن كان المحرك جاهز)
      if (window.CommissionEngine && typeof CommissionEngine.computeForOrder === 'function') {
        try { await CommissionEngine.computeForOrder(orderId); } catch(e) { console.warn('[commission]', e.message); }
      }

      alert('✅ تم التسليم بنجاح');
      setTimeout(function() { window.__dlvShowReceipt(orderId); }, 500);
      if (window.renderContent) window.renderContent();
    } catch(e) {
      console.error('[deliver]', e);
      alert('❌ ' + (e.message || e.code || 'خطأ'));
    }
  };

  // ═══ 4. عرض سند الاستلام ═══
  window.__dlvShowReceipt = async function(orderId) {
    try {
      var db = firebase.firestore();
      var orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) { alert('الطلب غير موجود'); return; }
      var o = orderDoc.data();
      o.id = orderId;

      var itemsHtml = (o.items || []).map(function(it) {
        return '<tr>' +
          '<td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">' + (it.name || 'منتج') + '</td>' +
          '<td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">×' + (it.qty || 1) + '</td>' +
          '<td style="padding:10px;border-bottom:1px solid #eee;text-align:left;">' + ((it.price || 0) * (it.qty || 1)) + ' ر.س</td>' +
        '</tr>';
      }).join('') || '<tr><td colspan="3" style="padding:15px;text-align:center;color:#999;">لا منتجات</td></tr>';

      var html =
        '<div style="max-width:620px;margin:0 auto;background:#fff;padding:30px;font-family:sans-serif;direction:rtl;color:#111;border-radius:16px;">' +
          '<div style="text-align:center;border-bottom:3px solid #ec4899;padding-bottom:20px;margin-bottom:20px;">' +
            '<h1 style="margin:0;background:linear-gradient(90deg,#FF8A00,#FF3D9A,#9B4DFF,#4D8CFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:32px;font-weight:900;">CHIZEN</h1>' +
            '<p style="margin:8px 0 0;color:#666;font-size:14px;">سند استلام طلب</p>' +
          '</div>' +
          '<div style="margin-bottom:20px;padding:15px;background:#f9fafb;border-radius:10px;line-height:1.9;font-size:13px;">' +
            '<div><strong>رقم الطلب:</strong> #' + String(orderId).slice(-10) + '</div>' +
            '<div><strong>العميل:</strong> ' + (o.name || '—') + '</div>' +
            '<div><strong>الهاتف:</strong> ' + (o.phone || '—') + '</div>' +
            '<div><strong>العنوان:</strong> ' + (o.pickup || '—') + '</div>' +
            '<div><strong>تاريخ التسليم:</strong> ' + fmtDate(o.deliveredAt) + '</div>' +
          '</div>' +
          '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">' +
            '<thead><tr style="background:#ec4899;color:#fff;">' +
              '<th style="padding:10px;text-align:right;">المنتج</th>' +
              '<th style="padding:10px;text-align:center;">الكمية</th>' +
              '<th style="padding:10px;text-align:left;">السعر</th>' +
            '</tr></thead><tbody>' + itemsHtml + '</tbody>' +
          '</table>' +
          '<div style="text-align:center;padding:15px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border-radius:10px;margin-bottom:20px;">' +
            '<div style="font-size:12px;opacity:0.9;">الإجمالي</div>' +
            '<div style="font-size:28px;font-weight:900;">' + (o.total || 0) + ' <span style="font-size:14px;">ر.س</span></div>' +
          '</div>' +
          '<div style="text-align:center;padding:20px;background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;">' +
            '<div style="font-size:16px;font-weight:900;color:#92400e;">✅ تم استلام الطلب بنجاح</div>' +
            '<div style="font-size:11px;color:#78350f;margin-top:6px;">شكراً لثقتك في CHIZEN</div>' +
          '</div>' +
          '<div style="text-align:center;margin-top:20px;font-size:10px;color:#999;">' +
            'رقم السند: ' + String(orderId).slice(-8) + '-' + Date.now() +
          '</div>' +
        '</div>';

      var ov = document.createElement('div');
      ov.id = 'chz-receipt-overlay';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:999999;overflow-y:auto;padding:20px;';
      ov.innerHTML =
        '<div style="max-width:640px;margin:0 auto;">' +
          '<button onclick="document.getElementById(\'chz-receipt-overlay\').remove()" style="width:100%;padding:14px;background:#ef4444;color:#fff;border:none;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;margin-bottom:10px;font-family:inherit;">✕ إغلاق</button>' +
          '<button onclick="window.print()" style="width:100%;padding:14px;background:#3b82f6;color:#fff;border:none;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;margin-bottom:15px;font-family:inherit;">🖨️ طباعة / حفظ PDF</button>' +
          html +
        '</div>';
      document.body.appendChild(ov);
    } catch(e) {
      console.error('[receipt]', e);
      alert('❌ ' + (e.message || 'خطأ في توليد السند'));
    }
  };

  console.log('[CHIZEN] delivery-cycle.js v1 loaded');
})();
