const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف v202 الذي فشل
h = h.replace(/<script id="v202-js">[\s\S]*?<\/script>/g, '');

const v203 = `
<script id="v203-perpetual">
(function(){
  var WORKER_URL = "https://chizen-uploader.hazimchat.workers.dev";
  
  function compressImage(file, maxDim, quality) {
    return new Promise(function(resolve, reject){
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function(){
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if(w > maxDim || h > maxDim){
          if(w > h){ h = Math.round(h*maxDim/w); w = maxDim; }
          else { w = Math.round(w*maxDim/h); h = maxDim; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(b){ b ? resolve(b) : reject(new Error('compress')); }, 'image/jpeg', quality);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('load')); };
      img.src = url;
    });
  }
  
  async function uploadToWorker(file) {
    var blob = await compressImage(file, 1200, 0.82);
    var res = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
    if(!res.ok) throw new Error('فشل الرفع: ' + res.status);
    var data = await res.json();
    if(!data.url) throw new Error('لا رابط');
    return data.url;
  }
  
  // نسخة الرفع عبر Cloudflare
  var workerUpload = async function(files, category, callbacks){
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
  
  // زر التأكيد المُصلح
  var fixedConfirm = async function(orderId){
    var state = window.catMgrApp.state;
    var o = state.pending.find(function(x){ return x.id === orderId; });
    if(!o) return;
    var db = firebase.firestore();
    try {
      await db.runTransaction(async function(tx){
        var ref = db.collection('orders').doc(orderId);
        var doc = await tx.get(ref);
        if(!doc.exists) throw new Error('MISSING_DOC');
        var data = doc.data();
        var catObj = Object.assign({}, (data.categories||{})[state.cat]||{});
        catObj.items = (catObj.items||[]).map(function(i){ return Object.assign({}, i, {_catStatus: i._catStatus !== false}); });
        catObj.status = 'confirmed';
        catObj.confirmedBy = state.user.uid;
        catObj.confirmedByName = state.user.name || '';
        catObj.confirmedAt = firebase.firestore.FieldValue.serverTimestamp();
        var updates = {};
        updates['categories.' + state.cat] = catObj;
        var merged = Object.assign({}, data.categories || {});
        merged[state.cat] = catObj;
        var allResolved = Object.keys(merged).every(function(k){ var s = merged[k] && merged[k].status; return s === 'confirmed' || s === 'rejected'; });
        var anyRejected = Object.keys(merged).some(function(k){ return merged[k] && merged[k].status === 'rejected'; });
        if(allResolved) updates.workflowStatus = anyRejected ? 'payment_rejected' : 'ready_to_send';
        tx.update(ref, updates);
      });
      if(o.customerId){
        db.collection('notifications').add({
          userId: o.customerId, title: '✅ تم تأكيد توفر منتجاتك', body: 'طلبك #' + String(orderId).slice(-6) + ' جاهز',
          type: 'order', event: 'cat_confirmed', icon: '✅', read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(){});
      }
      db.collection('users').where('role','==','delivery_mgr').get().then(function(s){
        s.forEach(function(u){
          db.collection('notifications').add({
            userId: u.id, title: '📦 طلب بحاجة لجدولة توصيل', body: '#' + String(orderId).slice(-6) + ' — أكّد',
            type: 'order', event: 'cat_confirmed', icon: '📦', read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(function(){});
        });
      });
      alert('✅ تم التأكيد بنجاح');
    } catch(e) {
      if(e.message && e.message.indexOf('MISSING_DOC') !== -1){
        state.pending = state.pending.filter(function(x){ return x.id !== orderId; });
        if(window.__v100Tab) window.__v100Tab(state.activeTab || 'pending');
        alert('⚠️ الطلب لم يعد موجوداً.');
        return;
      }
      alert('❌ خطأ: ' + (e.message || 'حدث خطأ'));
    }
  };
  
  // زر الرفض المُصلح
  var fixedReject = async function(orderId){
    var state = window.catMgrApp.state;
    var o = state.pending.find(function(x){ return x.id === orderId; });
    if(!o) return;
    var el = document.getElementById('v100-reason-' + orderId);
    var reason = el ? el.value.trim() : '';
    if(!reason){ alert('⚠️ أدخل سبب الرفض'); if(el) el.focus(); return; }
    var db = firebase.firestore();
    try {
      await db.runTransaction(async function(tx){
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
      if(o.customerId){
        db.collection('notifications').add({
          userId: o.customerId, title: '⚠️ تحديث بخصوص طلبك', body: 'قسم: ' + reason,
          type: 'warning', event: 'cat_rejected', icon: '⚠️', important: true, read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(){});
      }
      alert('تم الرفض');
    } catch(e) {
      if(e.message && e.message.indexOf('MISSING_DOC') !== -1){
        state.pending = state.pending.filter(function(x){ return x.id !== orderId; });
        if(window.__v100Tab) window.__v100Tab(state.activeTab || 'pending');
        alert('⚠️ الطلب لم يعد موجوداً.');
        return;
      }
      alert('❌ خطأ: ' + (e.message || 'حدث خطأ'));
    }
  };
  
  var noTokenModal = function(){ return Promise.resolve("no-token-needed"); };
  
  // ═══ الفارض الأبدي: يعيد الفرض كل 300ms ═══
  // هذا يضمن أن أي سكربت قديم يعيد الكتابة، سيُطغى عليه بعد 300ms
  setInterval(function(){
    try {
      if(window.catMgrApp){
        if(window.catMgrApp.confirm !== fixedConfirm) window.catMgrApp.confirm = fixedConfirm;
        if(window.catMgrApp.reject !== fixedReject) window.catMgrApp.reject = fixedReject;
      }
      if(window.__v102c_uploadBatch !== workerUpload) window.__v102c_uploadBatch = workerUpload;
      if(window.__v102b_showTokenModal !== noTokenModal) window.__v102b_showTokenModal = noTokenModal;
    } catch(e){}
  }, 300);
  
  // فرض فوري عند التحميل
  var quick = setInterval(function(){
    if(window.catMgrApp && window.__v102c_uploadBatch){
      window.catMgrApp.confirm = fixedConfirm;
      window.catMgrApp.reject = fixedReject;
      window.__v102c_uploadBatch = workerUpload;
      window.__v102b_showTokenModal = noTokenModal;
      clearInterval(quick);
    }
  }, 100);
  
  console.log('[V203] Perpetual enforcer active');
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v203 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ v203: الفارض الأبدي مفعل');
