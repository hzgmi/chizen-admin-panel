const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v202 = `
<script id="v202-js">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v202Ready) return;
    window.__v202Ready = true;

    var db = firebase.firestore();
    var WORKER_URL = "https://chizen-uploader.hazimchat.workers.dev";

    // ═════════ 1. إصلاح رفع الصور (إلغاء التوكن) ═════════
    window.__v102b_showTokenModal = function(){ return Promise.resolve("worker-handled"); };

    async function uploadToWorker(file) {
      var compressed = await new Promise(function(resolve, reject){
        var img = new Image(); var url = URL.createObjectURL(file);
        img.onload = function(){
          URL.revokeObjectURL(url);
          var w = img.width, h = img.height;
          var maxDim = 1200;
          if(w > maxDim || h > maxDim){ if(w > h){ h = Math.round(h * maxDim / w); w = maxDim; } else { w = Math.round(w * maxDim / h); h = maxDim; } }
          var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(function(blob){ if(!blob) reject(new Error('compress failed')); else resolve(blob); }, 'image/jpeg', 0.82);
        };
        img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('load failed')); };
        img.src = url;
      });

      var res = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: compressed
      });
      if(!res.ok) throw new Error('فشل الرفع: ' + res.status);
      var data = await res.json();
      if(!data.url) throw new Error('لم يتم إرجاع رابط');
      return data.url;
    }

    window.__v102c_uploadBatch = async function(files, category, callbacks){
      callbacks = callbacks || {};
      var onProgress = callbacks.onProgress || function(){};
      var onUrl = callbacks.onUrl || function(){};
      var onError = callbacks.onError || function(e){ console.error(e); };
      var total = files.length, success = 0;
      for(var i=0; i<total; i++){
        try {
          var url = await uploadToWorker(files[i]);
          onUrl(url); success++;
          onProgress(Math.round((i+1)/total*100));
        } catch(e){ onError(e); }
      }
      if(success === 0 && total > 0) throw new Error('فشل رفع الصور');
    };

    // ═════════ 2. إصلاح زر التأكيد والرفض ═════════
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
          var allResolved = Object.keys(merged).every(k => { var s = merged[k] && merged[k].status; return s === 'confirmed' || s === 'rejected'; });
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
          alert('⚠️ هذا الطلب لم يعد موجوداً.');
          return;
        }
        alert('❌ خطأ: ' + (e.message || 'حدث خطأ'));
      }
    };

    window.catMgrApp.reject = async function(orderId){
      var state = window.catMgrApp.state;
      var o = state.pending.find(x => x.id === orderId);
      if(!o) return;
      var el = document.getElementById('v100-reason-' + orderId);
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
          alert('⚠️ هذا الطلب لم يعد موجوداً.');
          return;
        }
        alert('❌ خطأ: ' + (e.message || 'حدث خطأ'));
      }
    };

    console.log('[V202] Upload & Confirm/Reject Fixed.');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v202 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v202 (إصلاح الرفع والتأكيد)');
