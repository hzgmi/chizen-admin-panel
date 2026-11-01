const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97F_DASHBOARD -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<style id="v97f-css">
.v97f-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 16px; margin-top: 10px; }
.v97f-card { background: linear-gradient(135deg, #1e1533 0%, #151b3a 100%); border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; padding: 20px 12px; text-align: center; cursor: pointer; transition: transform 0.1s; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.v97f-card:active { transform: scale(0.95); background: rgba(168,85,247,0.2); }
.v97f-icon { font-size: 32px; margin-bottom: 8px; display: block; }
.v97f-label { font-size: 13px; font-weight: 700; color: #fff; }
</style>
<script id="v97f-dashboard">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 150) return;
    if(!window.catMgrApp) return setTimeout(hook, 100);
    if(window.__v97fReady) return;
    window.__v97fReady = true;
    var db = firebase.firestore();

    window.catMgrApp.loadProducts = async function(){
      var st = window.catMgrApp.state;
      try {
        var snap = await db.collection('products').get();
        st.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
          .filter(function(p){ return p.category === st.cat || (Array.isArray(p.categories) && p.categories.indexOf(st.cat) !== -1); });
        var kp = document.getElementById('cm-kpi-products');
        if(kp) kp.textContent = st.products.length;
        if(st.activeTab === 'home') renderHome();
      } catch(e){ console.warn('[V97F] products:', e); }
    };

    window.catMgrApp.subscribeOrders = function(){
      var st = window.catMgrApp.state;
      if(st.unsub) st.unsub();
      st.unsub = db.collection('orders')
        .where('workflowStatus','==','awaiting_categories')
        .onSnapshot(function(snap){
          var pending = [];
          snap.forEach(function(d){
            var data = d.data();
            var c = data.categories && data.categories[st.cat];
            if(c && c.status === 'pending') pending.push(Object.assign({id:d.id}, data));
          });
          st.pending = pending;
          var ko = document.getElementById('cm-kpi-orders');
          if(ko) ko.textContent = pending.length;
          if(st.activeTab === 'home') renderHome();
          if(st.activeTab === 'pending') window.catMgrApp.switchTab('pending');
        }, function(err){ console.warn('[V97F] orders:', err); });
    };

    function renderHome(){
      var st = window.catMgrApp.state;
      var content = document.getElementById('cm-content');
      if(!content) return;
      
      var html = '';
      html += '<div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:20px;border-radius:20px;margin:0 16px 16px;color:#fff;box-shadow:0 8px 24px rgba(168,85,247,0.3);">';
      html += '<h2 style="margin:0 0 6px;font-size:20px;">👋 أهلاً ' + (st.user.name || 'مدير القسم') + '</h2>';
      html += '<p style="margin:0;opacity:0.9;font-size:14px;">قسم: ' + st.cat + '</p>';
      html += '</div>';

      html += '<div class="v97f-grid">';
      var btn = function(icon, label, onclick){
        return '<div class="v97f-card" onclick="' + onclick + '">' +
               '<span class="v97f-icon">' + icon + '</span>' +
               '<div class="v97f-label">' + label + '</div></div>';
      };

      html += btn('➕', 'إضافة منتج', 'window.__v97cOpenForm()');
      html += btn('🏭', 'إضافة مورد', 'window.__v97fAddSupplier()');
      html += btn('🏷️', 'إضافة ماركة', 'window.__v97fAddBrand()');
      html += btn('📦', 'طلبات (' + st.pending.length + ')', 'window.catMgrApp.switchTab(\\'pending\\')');
      html += btn('🛍️', 'منتجاتي (' + st.products.length + ')', 'window.catMgrApp.switchTab(\\'products\\')');
      html += btn('🚪', 'تسجيل خروج', 'window.catMgrApp.back()');

      html += '</div>';
      content.innerHTML = html;
    }

    var origSwitch = window.catMgrApp.switchTab;
    window.catMgrApp.switchTab = function(t){
      var st = window.catMgrApp.state;
      st.activeTab = t;
      document.querySelectorAll('.cm-tabs button').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-cm-tab') === t);
      });
      if(t === 'home'){
        var fab = document.getElementById('v97e-fab');
        if(fab) fab.style.display = 'none';
        renderHome();
        return;
      }
      origSwitch.call(window.catMgrApp, t);
    };

    window.__v97fAddSupplier = async function(){
      var name = prompt('اسم المورد:');
      if(!name) return;
      var phone = prompt('رقم الهاتف (اختياري):') || '';
      try {
        var docRef = db.collection('config').doc('suppliers');
        var doc = await docRef.get();
        var list = doc.exists ? (doc.data().list || []) : [];
        list.push({
          id: 'sup_' + Date.now(),
          name: name.trim(),
          phone: phone.trim(),
          categories: [window.catMgrApp.state.cat],
          balance: 0, history: [], products: []
        });
        await docRef.set({list: list, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge: true});
        alert('✅ تم إضافة المورد');
      } catch(e){ alert('❌ ' + e.message); }
    };

    window.__v97fAddBrand = async function(){
      var nameAr = prompt('اسم الماركة (بالعربي):');
      if(!nameAr) return;
      var nameEn = prompt('اسم الماركة (بالإنجليزي - اختياري):') || nameAr;
      try {
        var docRef = db.collection('config').doc('brands');
        var doc = await docRef.get();
        var list = doc.exists ? (doc.data().list || []) : [];
        list.push({nameAr: nameAr.trim(), nameEn: nameEn.trim(), active: true});
        await docRef.set({list: list, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge: true});
        alert('✅ تم إضافة الماركة');
      } catch(e){ alert('❌ ' + e.message); }
    };

    setTimeout(function(){
      var tabs = document.querySelector('.cm-tabs');
      if(tabs && !tabs.querySelector('[data-cm-tab="home"]')){
        var hb = document.createElement('button');
        hb.setAttribute('data-cm-tab', 'home');
        hb.textContent = '🏠 الرئيسية';
        hb.onclick = function(){ window.catMgrApp.switchTab('home'); };
        tabs.insertBefore(hb, tabs.firstChild);
      }
      window.catMgrApp.switchTab('home');
    }, 1200);

    console.log('[V97F] ready');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97f patched. size:', h.length);
