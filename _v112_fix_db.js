const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v112 = `
<script id="v112-fix-db">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v112Ready) return;
    window.__v112Ready = true;

    // إصلاح دالة التأكيد
    window.catMgrApp.confirm = async function(orderId){
      var db = firebase.firestore(); // تعريف قاعدة البيانات هنا
      var state = window.catMgrApp.state;
      var o = state.pending.find(x => x.id === orderId);
      if(!o) return;

      try {
        await db.runTransaction(async tx => {
          var ref = db.collection('orders').doc(orderId);
          var doc = await tx.get(ref);
          if(!doc.exists) throw new Error('اختفى');
          var data = doc.data();
          var catObj = Object.assign({}, (data.categories||{})[state.cat]||{});
          catObj.items = (catObj.items||[]).map(i => ({...i, _catStatus: i._catStatus !== false}));
          catObj.status = 'confirmed';
          catObj.confirmedBy = state.user.uid;
          catObj.confirmedByName = state.user.name || '';
          catObj.confirmedAt = firebase.firestore.FieldValue.serverTimestamp();
          var updates = {};
          updates['categories.' + state.cat] = catObj;
          
          var merged = Object.assign({}, data.categories || {}, {[state.cat]: catObj});
          var allResolved = Object.keys(merged).every(k => {
            var s = merged[k] && merged[k].status;
            return s === 'confirmed' || s === 'rejected';
          });
          var anyRejected = Object.keys(merged).some(k => merged[k] && merged[k].status === 'rejected');
          if(allResolved) updates.workflowStatus = anyRejected ? 'payment_rejected' : 'ready_to_send';
          tx.update(ref, updates);
        });

        if(o.customerId) {
          await db.collection('notifications').add({
            userId: o.customerId, title: '✅ تم تأكيد توفر منتجاتك', body: 'طلبك #' + String(orderId).slice(-6) + ' جاهز',
            type: 'order', event: 'cat_confirmed', icon: '✅', read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        var dSnap = await db.collection('users').where('role', '==', 'delivery_mgr').get();
        dSnap.forEach(u => {
          db.collection('notifications').add({
            userId: u.id, title: '📦 طلب بحاجة لجدولة توصيل', body: '#' + String(orderId).slice(-6) + ' — أكّد',
            type: 'order', event: 'cat_confirmed', icon: '📦', read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        alert('✅ تم التأكيد بنجاح');
      } catch(e) {
        console.error(e);
        alert('❌ خطأ: ' + (e.message || e.code || 'حدث خطأ'));
      }
    };

    // إصلاح دالة الرفض
    window.catMgrApp.reject = async function(orderId){
      var db = firebase.firestore();
      var state = window.catMgrApp.state;
      var o = state.pending.find(x => x.id === orderId);
      if(!o) return;
      var el = document.getElementById('v100-reason-' + orderId) || document.getElementById('cm-reason-' + orderId);
      var reason = el ? el.value.trim() : '';
      if(!reason) { alert('⚠️ أدخل سبب الرفض أولاً'); if(el) el.focus(); return; }

      try {
        await db.runTransaction(async tx => {
          var ref = db.collection('orders').doc(orderId);
          var doc = await tx.get(ref);
          if(!doc.exists) throw new Error('اختفى');
          var data = doc.data();
          var catObj = Object.assign({}, (data.categories||{})[state.cat]||{});
          catObj.status = 'rejected';
          catObj.rejectReason = reason;
          catObj.rejectedBy = state.user.uid;
          catObj.rejectedByName = state.user.name || '';
          catObj.rejectedAt = firebase.firestore.FieldValue.serverTimestamp();
          var updates = {};
          updates['categories.' + state.cat] = catObj;
          updates.workflowStatus = 'payment_rejected';
          tx.update(ref, updates);
        });

        if(o.customerId) {
          await db.collection('notifications').add({
            userId: o.customerId, title: '⚠️ تحديث بخصوص طلبك', body: 'قسم: ' + reason,
            type: 'warning', event: 'cat_rejected', icon: '⚠️', important: true, read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        alert('تم الرفض');
      } catch(e) {
        console.error(e);
        alert('❌ خطأ: ' + (e.message || e.code || 'حدث خطأ'));
      }
    };

    console.log('[V112] DB fix ready');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v112 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v112 لإصلاح خطأ db');
