const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('// ═══ WIRE BOOKINGS v1')) { console.log('already'); process.exit(0); }

const script = `

<script>
// ═══ WIRE BOOKINGS v1 ═══
(function(){
  function hook(){
    if (!window.A || !window.notifyCustomer) { setTimeout(hook, 500); return; }
    if (window.A._bookingHooksWired) return;
    window.A._bookingHooksWired = true;
    
    async function notifyBooking(bookingId, event, extraData) {
      try {
        var doc = await FB.db.collection('bookings').doc(bookingId).get();
        if (!doc.exists) return;
        var b = doc.data();
        await window.notifyCustomer(b.userId, event, Object.assign({
          id: bookingId.substring(0, 8).toUpperCase(),
          amount: b.priceQuote && b.priceQuote.amount ? b.priceQuote.amount : (b.estimatedPrice || 0)
        }, extraData || {}));
      } catch(e) { console.warn('[notify booking]', e.message); }
    }
    
    // ═══ confirmBooking → booking.confirmed ═══
    var origConfirm = window.A.confirmBooking;
    if (origConfirm) {
      window.A.confirmBooking = async function(bookingId) {
        var r = await origConfirm.apply(this, arguments);
        setTimeout(function(){ notifyBooking(bookingId, 'booking.confirmed'); }, 800);
        return r;
      };
    }
    
    // ═══ cancelBooking → booking.cancelled ═══
    var origCancel = window.A.cancelBooking;
    if (origCancel) {
      window.A.cancelBooking = async function(bookingId) {
        var r = await origCancel.apply(this, arguments);
        setTimeout(function(){ notifyBooking(bookingId, 'booking.cancelled', { amount: 0 }); }, 800);
        return r;
      };
    }
    
    // ═══ completeBooking → booking.completed ═══
    var origComplete = window.A.completeBooking;
    if (origComplete) {
      window.A.completeBooking = async function(bookingId) {
        var r = await origComplete.apply(this, arguments);
        setTimeout(function(){ notifyBooking(bookingId, 'booking.completed'); }, 800);
        return r;
      };
    }
    
    console.log('[wire bookings] ✓ hooks applied');
  }
  hook();
})();
</script>

`;

h = h.slice(0, h.lastIndexOf('</body>')) + script + '\n' + h.slice(h.lastIndexOf('</body>'));

fs.writeFileSync(p, h);
console.log('✅ Booking hooks added');
console.log('size:', before, '->', h.length);
