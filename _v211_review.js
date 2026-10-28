const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v211 = `
<style id="v211-css">
#v211-fab { position: fixed; top: 16px; left: 16px; z-index: 999998;
  background: linear-gradient(135deg,#7c3aed,#ec4899); color:#fff;
  padding: 10px 16px; border-radius: 30px; font-family: inherit;
  font-size: 13px; font-weight: 800; cursor: pointer;
  box-shadow: 0 8px 24px rgba(168,85,247,0.5);
  display: none; align-items: center; gap: 8px; }
#v211-fab.show { display: flex; }
#v211-overlay { position: fixed; inset: 0; z-index: 9999999;
  background: rgba(10,8,37,0.98); display: none; overflow-y: auto; font-family: inherit; }
#v211-overlay.show { display: block; }
</style>

<script id="v211-js">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 150);
    if(typeof firebase === 'undefined' || !firebase.firestore) return setTimeout(hook, 150);
    if(window.__v211Ready) return;
    window.__v211Ready = true;

    var db = firebase.firestore();
    var overlay, fab, badge, unsub;

    function build(){
      var user = firebase.auth().currentUser;
      if (!user) { setTimeout(build, 500); return; }
      db.collection('admins').doc(user.uid).get().then(function(adm){
        if (adm.exists) return doBuild();
        db.collection('users').doc(user.uid).get().then(function(u){
          if (u.exists && u.data().role === 'super_admin') doBuild();
        });
      }).catch(function(){ setTimeout(build, 500); });
    }

    function doBuild(){
      fab = document.createElement('div');
      fab.id = 'v211-fab';
      fab.innerHTML = '📋 <span>مراجعة المنتجات</span> <span id="v211-count" style="background:#ef4444;padding:2px 8px;border-radius:10px;font-size:11px;margin-right:4px;display:none">0</span>';
      document.body.appendChild(fab);
      badge = document.getElementById('v211-count');

      overlay = document.createElement('div');
      overlay.id = 'v211-overlay';
      overlay.innerHTML =
        '<div style="position:sticky;top:0;background:rgba(10,8,37,0.98);padding:16px;border-bottom:1px solid rgba(155,77,255,0.3);display:flex;align-items:center;justify-content:space-between;z-index:10">' +
          '<h2 style="margin:0;color:#fff;font-size:17px">📋 مراجعة المنتجات</h2>' +
          '<button id="v211-close" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px">✕</button>' +
        '</div><div id="v211-list" style="padding:16px"></div>';
      document.body.appendChild(overlay);

      document.getElementById('v211-close').onclick = function(){ overlay.classList.remove('show'); };
      fab.onclick = function(){ overlay.classList.add('show'); };

      unsub = db.collection('products').where('status','==','pending_review').onSnapshot(function(snap){
        var n = snap.size;
        if (n > 0) { fab.classList.add('show'); badge.style.display = 'inline-block'; badge.textContent = n; }
        else { fab.classList.remove('show'); }
        renderList(snap.docs);
      }, function(err){ console.warn('[V211]', err); });
    }

    function renderList(docs){
      var list = document.getElementById('v211-list');
      if (!list) return;
      if (docs.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#a78bfa"><div style="font-size:48px;margin-bottom:12px">✨</div><div>لا توجد منتجات بانتظار المراجعة</div></div>';
        return;
      }
      var html = '';
      docs.forEach(function(doc){
        var p = doc.data(), id = doc.id;
        var imgs = (p.imgs && p.imgs.length) ? p.imgs : (p.img ? [p.img] : []);
        var mainImg = imgs[0] || '';
        var features = Array.isArray(p.features) ? p.features : [];
        var profit = (Number(p.price)||0) - (Number(p.costPrice)||0);
        var margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;
        var subName = (p.submittedBy && p.submittedBy.name) || p.createdBy || '—';

        html += '<div style="background:linear-gradient(135deg,#1e1533,#151b3a);border:1px solid rgba(155,77,255,0.3);border-radius:16px;padding:16px;margin-bottom:14px">';
        html += '<div style="display:flex;gap:12px;margin-bottom:14px">';
        html += '<img src="'+mainImg+'" style="width:80px;height:80px;object-fit:cover;border-radius:12px;flex-shrink:0;background:#333" onerror="this.style.opacity=0.3">';
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="color:#fff;font-weight:800;font-size:15px;margin-bottom:4px">'+ (p.name||'—') +'</div>';
        html += '<div style="color:#a78bfa;font-size:12px;margin-bottom:2px">🏷️ '+ (p.brand||'—') +' · 📂 '+ (p.category||'—') +'</div>';
        html += '<div style="color:#a78bfa;font-size:12px">📤 '+ subName +'</div>';
        html += '</div></div>';

        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">';
        html += '<div style="background:rgba(10,8,37,0.7);padding:8px;border-radius:10px;text-align:center"><div style="color:#a78bfa;font-size:10px;margin-bottom:2px">جملة</div><div style="color:#fff;font-weight:800;font-size:14px">'+(Number(p.costPrice)||0).toFixed(0)+'</div></div>';
        html += '<div style="background:rgba(10,8,37,0.7);padding:8px;border-radius:10px;text-align:center"><div style="color:#a78bfa;font-size:10px;margin-bottom:2px">بيع</div><div style="color:#ec4899;font-weight:800;font-size:14px">'+(Number(p.price)||0).toFixed(0)+'</div></div>';
        html += '<div style="background:rgba(10,8,37,0.7);padding:8px;border-radius:10px;text-align:center"><div style="color:#a78bfa;font-size:10px;margin-bottom:2px">ربح '+margin+'%</div><div style="color:'+(profit>0?'#22c55e':'#ef4444')+';font-weight:800;font-size:14px">'+profit.toFixed(0)+'</div></div>';
        html += '</div>';

        html += '<div style="color:#a78bfa;font-size:12px;margin-bottom:8px">🏭 <span style="color:#fff">'+(p.supplierName||p.supplier||'—')+'</span></div>';
        if (p.desc) html += '<div style="color:#ccc;font-size:12px;margin-bottom:8px;line-height:1.5">'+p.desc+'</div>';
        if (features.length) {
          html += '<div style="margin-bottom:12px">';
          features.forEach(function(f){
            html += '<span style="display:inline-block;background:rgba(155,77,255,0.15);color:#a78bfa;padding:4px 10px;border-radius:12px;font-size:11px;margin:2px;font-weight:600">'+f+'</span>';
          });
          html += '</div>';
        }

        html += '<input type="text" id="v211-reason-'+id+'" placeholder="سبب الرفض (عند الرفض فقط)" style="width:100%;padding:10px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:10px;color:#fff;font-family:inherit;font-size:12px;margin-bottom:10px;box-sizing:border-box">';

        html += '<div style="display:flex;gap:8px">';
        html += '<button onclick="window.__v211Approve(\\''+id+'\\')" style="flex:1;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:12px;border-radius:11px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">✓ اعتماد</button>';
        html += '<button onclick="window.__v211Reject(\\''+id+'\\')" style="flex:1;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;padding:12px;border-radius:11px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">✗ رفض</button>';
        html += '</div>';

        html += '</div>';
      });
      list.innerHTML = html;
    }

    window.__v211Approve = function(pid){
      var u = firebase.auth().currentUser;
      db.collection('products').doc(pid).get().then(function(doc){
        if (!doc.exists) return;
        var p = doc.data();
        db.collection('products').doc(pid).update({
          status: 'live', active: true,
          reviewedBy: { uid: u.uid, name: u.displayName || u.email || '', at: firebase.firestore.FieldValue.serverTimestamp() },
          reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){
          if (window.__chizenToast) window.__chizenToast('تم اعتماد المنتج', 'success', 'سيظهر للعملاء الآن');
          if (p.submittedBy && p.submittedBy.uid) {
            db.collection('notifications').add({
              userId: p.submittedBy.uid,
              title: '✅ تم اعتماد منتجك', body: p.name + ' — أصبح متاحاً للعملاء',
              type: 'product', event: 'product_approved', icon: '✅',
              read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(){});
          }
        });
      });
    };

    window.__v211Reject = function(pid){
      var reason = (document.getElementById('v211-reason-'+pid) || {}).value || '';
      reason = reason.trim();
      if (!reason) { if (window.__chizenToast) window.__chizenToast('يرجى إدخال سبب الرفض', 'warning'); return; }
      var u = firebase.auth().currentUser;
      db.collection('products').doc(pid).get().then(function(doc){
        if (!doc.exists) return;
        var p = doc.data();
        db.collection('products').doc(pid).update({
          status: 'rejected', active: false, rejectionReason: reason,
          reviewedBy: { uid: u.uid, name: u.displayName || u.email || '', at: firebase.firestore.FieldValue.serverTimestamp() },
          reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){
          if (window.__chizenToast) window.__chizenToast('تم رفض المنتج', 'error', 'تم إشعار مدير القسم');
          if (p.submittedBy && p.submittedBy.uid) {
            db.collection('notifications').add({
              userId: p.submittedBy.uid,
              title: '❌ رُفض منتجك', body: p.name + ' — السبب: ' + reason,
              type: 'product', event: 'product_rejected', icon: '❌', important: true,
              read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(){});
          }
        });
      });
    };

    setTimeout(build, 1500);
    console.log('[V211] Review UI ready');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v211 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ v211: شاشة مراجعة المنتجات جاهزة');
