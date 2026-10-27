const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('// ═══ WIRE ORDERS v1')) { console.log('already'); process.exit(0); }

const script = `

<script>
// ═══ WIRE ORDERS v1 ═══
(function(){
  function hook(){
    if (!window.A || !window.notifyCustomer) { setTimeout(hook, 500); return; }
    if (window.A._orderHooksWired) return;
    window.A._orderHooksWired = true;
    
    // Helper: read order after status change
    async function notifyOrder(orderId, event, extraData) {
      try {
        var snap = await FB.db.collection('orders').where('id', '==', orderId).get();
        if (snap.empty) {
          var doc = await FB.db.collection('orders').doc(orderId).get();
          if (!doc.exists) return;
          var o = doc.data();
          await window.notifyCustomer(o.customerId, event, Object.assign({
            id: orderId.substring(0, 8).toUpperCase(),
            total: o.total
          }, extraData || {}));
          return;
        }
        var o = snap.docs[0].data();
        await window.notifyCustomer(o.customerId, event, Object.assign({
          id: orderId.substring(0, 8).toUpperCase(),
          total: o.total
        }, extraData || {}));
      } catch(e) { console.warn('[notify order]', e.message); }
    }
    
    // ═══ 1. verifyPayment → order.verified ═══
    var origVerify = window.A.verifyPayment;
    if (origVerify) {
      window.A.verifyPayment = async function(orderId) {
        var r = await origVerify.apply(this, arguments);
        setTimeout(function(){ notifyOrder(orderId, 'order.verified'); }, 800);
        return r;
      };
    }
    
    // ═══ 2. rejectPayment → order.payment_rejected ═══
    var origReject = window.A.rejectPayment;
    if (origReject) {
      window.A.rejectPayment = async function(orderId) {
        var r = await origReject.apply(this, arguments);
        setTimeout(function(){
          notifyOrder(orderId, 'order.payment_rejected', { reason: 'غير محدد — تواصل معنا' });
        }, 800);
        return r;
      };
    }
    
    // ═══ 3. markDelivered → order.delivered ═══
    var origDelivered = window.A.markDelivered;
    if (origDelivered) {
      window.A.markDelivered = async function(orderId) {
        var r = await origDelivered.apply(this, arguments);
        setTimeout(function(){ notifyOrder(orderId, 'order.delivered'); }, 800);
        return r;
      };
    }
    
    // ═══ 4. sendToCustomer → order.sent_to_customer ═══
    var origSend = window.A.sendToCustomer || window.A.assignDriver || window.A.dispatchOrder;
    if (origSend) {
      window.A.sendToCustomer = async function(orderId) {
        var r = await origSend.apply(this, arguments);
        setTimeout(function(){ notifyOrder(orderId, 'order.sent_to_customer'); }, 800);
        return r;
      };
    }
    
    console.log('[wire orders] ✓ hooks applied');
  }
  hook();
})();
</script>

`;

h = h.slice(0, h.lastIndexOf('</body>')) + script + '\n' + h.slice(h.lastIndexOf('</body>'));

fs.writeFileSync(p, h);
console.log('✅ Order hooks added');
console.log('size:', before, '->', h.length);
