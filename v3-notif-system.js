const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('// ═══ NOTIFICATION SYSTEM v1')) { console.log('already'); process.exit(0); }

// Insert before closing </script> — at end of main script
const mainScriptEnd = h.lastIndexOf('</script>');
if (mainScriptEnd === -1) { console.log('❌ no script'); process.exit(1); }

const notifSystem = `

  // ═══ NOTIFICATION SYSTEM v1 ═══
  // Central messaging hub - رسائل جاهزة لكل حالة
  
  window.CHIZEN_MESSAGES = {
    // ─── Order events ───
    'order.awaiting_verification': {
      title: '⏳ تم استلام طلبك',
      body: 'طلبك #{{id}} قيد المراجعة. سنؤكد الدفع قريباً.',
      type: 'order', icon: '⏳', important: false,
      deepLink: 'orders/{{id}}'
    },
    'order.verified': {
      title: '✅ تم تأكيد دفعتك',
      body: 'طلبك #{{id}} قيد التجهيز الآن. سننبهك عند الشحن.',
      type: 'order', icon: '✅', important: true,
      deepLink: 'orders/{{id}}'
    },
    'order.payment_rejected': {
      title: '⚠️ الدفع لم يُؤكد',
      body: 'طلبك #{{id}} — سبب الرفض: {{reason}}. يرجى إعادة الإرسال.',
      type: 'order', icon: '⚠️', important: true,
      deepLink: 'orders/{{id}}'
    },
    'order.ready_to_send': {
      title: '📦 طلبك جاهز',
      body: 'طلبك #{{id}} جاهز للإرسال. في الطريق إليك قريباً.',
      type: 'order', icon: '📦', important: false,
      deepLink: 'orders/{{id}}'
    },
    'order.sent_to_customer': {
      title: '🚚 طلبك في الطريق',
      body: 'طلبك #{{id}} في الطريق. توجه إلى المكان الأقرب لك الذي اخترته.',
      type: 'order', icon: '🚚', important: false,
      deepLink: 'orders/{{id}}'
    },
    'order.delivered': {
      title: '🎉 تم تسليم طلبك',
      body: 'شكراً لثقتك بشيزن! نأمل أن تستمتع بطلبك.',
      type: 'order', icon: '🎉', important: true,
      deepLink: 'orders/{{id}}'
    },
    'order.cancelled': {
      title: '❌ تم إلغاء طلبك',
      body: 'طلبك #{{id}} تم إلغاؤه. للاستفسار تواصل معنا.',
      type: 'order', icon: '❌', important: true,
      deepLink: 'orders/{{id}}'
    },
    'order.on_hold': {
      title: '⏸️ طلبك معلق',
      body: 'طلبك #{{id}} معلق مؤقتاً. سنعود لك قريباً.',
      type: 'order', icon: '⏸️', important: false,
      deepLink: 'orders/{{id}}'
    },
    
    // ─── Booking events ───
    'booking.pending': {
      title: '⏳ تم استلام حجزك',
      body: 'حجزك قيد المراجعة. سنراجع التفاصيل ونرسل السعر قريباً.',
      type: 'booking', icon: '⏳', important: false,
      deepLink: 'booking'
    },
    'booking.quoted': {
      title: '💰 عرض السعر جاهز',
      body: 'حجزك — السعر المؤكد: {{amount}} ر.س. يتطلب موافقتك.',
      type: 'booking', icon: '💰', important: true,
      deepLink: 'booking'
    },
    'booking.accepted': {
      title: '✅ وافقت على السعر',
      body: 'شكراً! جاري تأكيد الحجز مع المزود.',
      type: 'booking', icon: '✅', important: false,
      deepLink: 'booking'
    },
    'booking.confirmed': {
      title: '🎉 تم تأكيد حجزك',
      body: 'حجزك مؤكد! رقم الحجز: {{id}}. رحلة سعيدة!',
      type: 'booking', icon: '🎉', important: true,
      deepLink: 'booking'
    },
    'booking.completed': {
      title: '✅ تمت الرحلة',
      body: 'رحلة سعيدة! نشكرك على ثقتك بشيزن.',
      type: 'booking', icon: '✅', important: false,
      deepLink: 'booking'
    },
    'booking.cancelled': {
      title: '❌ تم إلغاء حجزك',
      body: 'حجزك #{{id}} تم إلغاؤه. المبلغ المسترد: {{amount}} ر.س.',
      type: 'booking', icon: '❌', important: true,
      deepLink: 'booking'
    },
    
    // ─── Listing events ───
    'listing.active': {
      title: '✅ إعلانك منشور',
      body: 'إعلان "{{title}}" منشور الآن في حراج شيزن.',
      type: 'listing', icon: '✅', important: false,
      deepLink: 'commerce'
    },
    'listing.sold': {
      title: '💰 تم بيع إعلانك',
      body: '"{{title}}" تم بيعه! مبروك.',
      type: 'listing', icon: '💰', important: true,
      deepLink: 'commerce'
    },
    'listing.paused': {
      title: '⏸️ إعلانك موقوف',
      body: '"{{title}}" موقوف مؤقتاً. للاستفسار: واتساب.',
      type: 'listing', icon: '⏸️', important: true,
      deepLink: 'commerce'
    },
    'listing.removed': {
      title: '⚠️ تم حذف إعلانك',
      body: 'إعلان "{{title}}" حُذف. السبب: {{reason}}.',
      type: 'listing', icon: '⚠️', important: true,
      deepLink: 'commerce'
    },
    
    // ─── Points events ───
    'points.approved': {
      title: '💎 تم تأكيد تحويلك',
      body: '+{{amount}} نقطة أضيفت إلى حسابك. شكراً!',
      type: 'points', icon: '💎', important: true,
      deepLink: 'points'
    },
    'points.rejected': {
      title: '❌ تم رفض طلب النقاط',
      body: 'سبب الرفض: {{reason}}. تواصل معنا للمساعدة.',
      type: 'points', icon: '❌', important: true,
      deepLink: 'points'
    },
    
    // ─── Account ───
    'account.verified': {
      title: '✅ تم توثيق حسابك',
      body: 'حسابك موثق الآن. استمتع بمزايا إضافية!',
      type: 'account', icon: '✅', important: true,
      deepLink: 'profile'
    },
    'account.banned': {
      title: '🚫 تم تعليق حسابك',
      body: 'حسابك معلق. للاستفسار: {{phone}}.',
      type: 'account', icon: '🚫', important: true,
      deepLink: 'profile'
    },
    'account.points_earned': {
      title: '💎 +{{amount}} نقاط',
      body: 'كسبت نقاطاً من شرائك الأخير. استبدلها بعروض رائعة!',
      type: 'account', icon: '💎', important: false,
      deepLink: 'points'
    }
  };

  // ─── Central notify function ───
  window.notifyCustomer = async function(customerId, event, data) {
    data = data || {};
    if (!customerId) { console.warn('[notify] no customerId for', event); return; }
    
    var template = window.CHIZEN_MESSAGES[event];
    if (!template) { console.warn('[notify] unknown event:', event); return; }
    
    // Replace placeholders
    function fill(str) {
      return String(str || '').replace(/\\{\\{(\\w+)\\}\\}/g, function(_, k) {
        return data[k] != null ? String(data[k]) : '';
      });
    }
    
    var title = fill(template.title);
    var body = fill(template.body);
    var deepLink = template.deepLink ? fill(template.deepLink) : null;
    
    // Check user preference (only for non-important events)
    var skipPush = false;
    if (!template.important && window.FB && FB.db) {
      try {
        var userDoc = await FB.db.collection('users').doc(customerId).get();
        if (userDoc.exists) {
          var prefs = userDoc.data().notif_prefs || {};
          if (prefs.externalDisabled === true) {
            skipPush = true;
            console.log('[notify] external disabled for', customerId.slice(-6), '- event:', event);
          }
        }
      } catch(e) { console.warn('[notify] prefs read error:', e.message); }
    }
    
    // Always save to internal notifications
    var notifPromise = FB.db.collection('notifications').add({
      userId: customerId,
      title: title,
      body: body,
      type: template.type,
      event: event,
      icon: template.icon,
      important: !!template.important,
      deepLink: deepLink,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Push only if not skipped
    var pushPromise = skipPush ? Promise.resolve(null) : FB.db.collection('push_queue').add({
      userId: customerId,
      title: title,
      body: body,
      type: template.type,
      event: event,
      important: !!template.important,
      data: { deepLink: deepLink, event: event, type: template.type },
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    await Promise.all([notifPromise, pushPromise]);
    console.log('[notify] ✓', event, '→', customerId.slice(-6), skipPush ? '(no push)' : '(push sent)');
  };

  // ─── Helper: get customerId from order/booking ───
  window.getOrderCustomerId = async function(orderId) {
    try {
      var snap = await FB.db.collection('orders').where('id', '==', orderId).get();
      if (snap.empty) return null;
      return snap.docs[0].data().customerId;
    } catch(e) { return null; }
  };
  window.getBookingUserId = async function(bookingId) {
    try {
      var doc = await FB.db.collection('bookings').doc(bookingId).get();
      if (!doc.exists) return null;
      return doc.data().userId;
    } catch(e) { return null; }
  };

  console.log('[notify system] ✓ loaded', Object.keys(window.CHIZEN_MESSAGES).length, 'templates');

`;

h = h.slice(0, mainScriptEnd) + notifSystem + h.slice(mainScriptEnd);

fs.writeFileSync(p, h);
console.log('✅ Notification system added');
console.log('size:', before, '->', h.length);
