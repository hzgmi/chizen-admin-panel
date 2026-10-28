const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v210 = `
<script id="v210-pending">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 200) return setTimeout(hook, 150);
    if(typeof firebase === 'undefined' || !firebase.firestore) return setTimeout(hook, 150);
    if(window.__v210Ready) return;
    window.__v210Ready = true;

    var db = firebase.firestore();
    var origCollection = db.collection.bind(db);
    var cachedRole = null;

    firebase.auth().onAuthStateChanged(function(u){
      if (!u) { cachedRole = null; return; }
      db.collection('users').doc(u.uid).get().then(function(d){
        cachedRole = d.exists ? (d.data().role || 'customer') : 'customer';
      }).catch(function(){});
    });

    db.collection = function(name){
      var ref = origCollection(name);
      if (name === 'products' && !ref.__v210) {
        ref.__v210 = true;
        var origAdd = ref.add.bind(ref);
        ref.add = function(data){
          if (data && data.name && !data.status) {
            var u = firebase.auth().currentUser;
            if (cachedRole === 'super_admin') {
              // السوبر أدمن ينشر مباشرة
              data.status = 'live';
              data.active = true;
              data.reviewedBy = { uid: u.uid, name: u.displayName || u.email || '', at: firebase.firestore.FieldValue.serverTimestamp() };
            } else {
              // مدير القسم → بانتظار المراجعة
              data.status = 'pending_review';
              data.active = false;
              data.submittedBy = {
                uid: u.uid, name: u.displayName || u.email || '',
                at: firebase.firestore.FieldValue.serverTimestamp()
              };
              setTimeout(function(){
                origCollection('users').where('role','==','super_admin').get().then(function(snap){
                  snap.forEach(function(d){
                    origCollection('notifications').add({
                      userId: d.id,
                      title: '📦 منتج جديد بانتظار المراجعة',
                      body: data.name + ' — قسم ' + (data.category || ''),
                      type: 'product', event: 'product_pending_review', icon: '📦',
                      read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(function(){});
                  });
                }).catch(function(){});
              }, 400);
            }
          }
          return origAdd(data);
        };
      }
      return ref;
    };
    console.log('[V210] Product review workflow active');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v210 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ v210: دورة المراجعة مفعلة');
