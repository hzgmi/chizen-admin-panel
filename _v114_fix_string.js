const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. استبدال النص المسبب للمشكلة في كل الملف (حتى في الأكواد القديمة المدفونة)
h = h.replace(/اختفى/g, 'MISSING_DOC');
console.log('✅ تم استبدال كلمة اختفى بـ MISSING_DOC في كل الملف');

// 2. إضافة سكربت v114 النهائي (يضمن التقاط MISSING_DOC وتحديث الواجهة)
const v114 = `
<script id="v114-final-fix">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 400) return setTimeout(hook, 100);
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v114Ready) return;
    window.__v114Ready = true;

    var db = firebase.firestore();

    window.catMgrApp.confirm = async function(orderId){
      var state = window.catMgrApp.state;
      var o = state.pending.find(x => x.id === orderId);
      if(!o) return;

      try {
        await db.runTransaction(async tx => {
          var ref = db.collection('orders').doc(orderId);
          var doc = await tx.get(ref);
          if(!doc.exists) throw new Error('MISSING_DOC');
          
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
        if(e.message === 'MISSING_DOC' || e.message.indexOf('MISSING_DOC') !== -1) {
          state.pending = state.pending.filter(x => x.id !== orderId);
          if(window.__v100Tab) window.__v100Tab(state.activeTab || 'pending');
          alert('⚠️ هذا الطلب لم يعد موجوداً (تم تأكيده أو حذفه). تم تحديث القائمة.');
          return;
        }
        alert('❌ خطأ: ' + (e.message || 'حدث خطأ'));
      }
    };

    window.catMgrApp.reject = async function(orderId){
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
          if(!doc.exists) throw new Error('MISSING_DOC');
          
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
        if(e.message === 'MISSING_DOC' || e.message.indexOf('MISSING_DOC') !== -1) {
          state.pending = state.pending.filter(x => x.id !== orderId);
          if(window.__v100Tab) window.__v100Tab(state.activeTab || 'pending');
          alert('⚠️ هذا الطلب لم يعد موجوداً (تم تأكيده أو حذفه). تم تحديث القائمة.');
          return;
        }
        alert('❌ خطأ: ' + (e.message || 'حدث خطأ'));
      }
    };
    console.log('[V114] Final missing order handler ready.');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v114 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v114 وتحديث النصوص |', before, '->', h.length);
