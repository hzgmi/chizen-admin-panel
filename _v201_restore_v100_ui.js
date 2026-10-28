const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// سكربت v100 (الواجهة الجميلة بالشريط السفلي)
const v100 = `
<style id="v201-css">
#cat-mgr-app .v100-header { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(10,8,37,.96); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(155,77,255,.2); }
#cat-mgr-app .v100-h-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
#cat-mgr-app .v100-h-cat { font-size: 17px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cat-mgr-app .v100-h-user { font-size: 11px; color: #a78bfa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cat-mgr-app .v100-h-logout { background: rgba(155,77,255,.15); color: #a78bfa; border: 1px solid rgba(155,77,255,.35); padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; flex-shrink: 0; }
#cat-mgr-app #v100-content { padding: 16px; min-height: calc(100vh - 200px); }
#cat-mgr-app .v100-welcome { background: linear-gradient(135deg,#7c3aed 0%,#ec4899 100%); border-radius: 20px; padding: 20px; color: #fff; margin-bottom: 20px; box-shadow: 0 8px 24px rgba(168,85,247,.25); }
#cat-mgr-app .v100-w-greeting { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
#cat-mgr-app .v100-w-user { font-size: 12px; opacity: .85; margin-bottom: 14px; }
#cat-mgr-app .v100-w-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
#cat-mgr-app .v100-w-stat { background: rgba(255,255,255,.15); border-radius: 12px; padding: 10px 6px; text-align: center; }
#cat-mgr-app .v100-w-stat b { display: block; font-size: 20px; font-weight: 800; line-height: 1; }
#cat-mgr-app .v100-w-stat small { font-size: 10px; opacity: .9; }
#cat-mgr-app .v100-section { margin-bottom: 20px; }
#cat-mgr-app .v100-sec-title { font-size: 14px; font-weight: 800; color: #a78bfa; margin-bottom: 10px; }
#cat-mgr-app .v100-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
#cat-mgr-app .v100-act { background: linear-gradient(135deg,#1e1533,#151b3a); border: 1px solid rgba(155,77,255,.3); border-radius: 16px; padding: 16px 10px; cursor: pointer; font-family: inherit; position: relative; transition: transform .1s; }
#cat-mgr-app .v100-act:active { transform: scale(.96); }
#cat-mgr-app .v100-act-icon { font-size: 28px; display: block; margin-bottom: 6px; }
#cat-mgr-app .v100-act-lbl { font-size: 13px; font-weight: 700; color: #fff; }
#cat-mgr-app .v100-act-count { position: absolute; top: 8px; left: 8px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 10px; min-width: 18px; text-align: center; }
#cat-mgr-app .v100-alert { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); color: #fca5a5; padding: 12px 14px; border-radius: 12px; font-size: 13px; margin-bottom: 16px; }
#cat-mgr-app .v100-empty { text-align: center; padding: 60px 20px; color: #a78bfa; }
#cat-mgr-app .v100-empty-icon { font-size: 48px; margin-bottom: 12px; }
#cat-mgr-app .v100-empty>div:nth-child(2) { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px; }
#cat-mgr-app .v100-empty-sub { font-size: 12px; opacity: .7; }
#cat-mgr-app .v100-order { background: linear-gradient(135deg,#1e1533,#151b3a); border: 1px solid rgba(155,77,255,.3); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
#cat-mgr-app .v100-ord-head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px dashed rgba(155,77,255,.2); margin-bottom: 12px; gap: 10px; }
#cat-mgr-app .v100-ord-id { font-size: 15px; font-weight: 800; color: #a78bfa; }
#cat-mgr-app .v100-ord-cust { font-size: 11px; color: #a78bfa; opacity: .7; margin-top: 2px; }
#cat-mgr-app .v100-ord-total { font-size: 18px; font-weight: 800; color: #ec4899; white-space: nowrap; }
#cat-mgr-app .v100-ord-total small { font-size: 11px; opacity: .7; }
#cat-mgr-app .v100-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(155,77,255,.1); cursor: pointer; }
#cat-mgr-app .v100-item:last-child { border-bottom: none; }
#cat-mgr-app .v100-item input[type=checkbox] { width: 22px; height: 22px; accent-color: #22c55e; flex-shrink: 0; cursor: pointer; }
#cat-mgr-app .v100-item img { width: 42px; height: 42px; object-fit: cover; border-radius: 8px; background: #eee; flex-shrink: 0; }
#cat-mgr-app .v100-item-info { flex: 1; min-width: 0; }
#cat-mgr-app .v100-item-info b { display: block; font-size: 12px; color: #fff; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#cat-mgr-app .v100-item-info span { font-size: 11px; color: #a78bfa; }
#cat-mgr-app .v100-item-price { font-size: 12px; font-weight: 700; color: #a78bfa; }
#cat-mgr-app .v100-reason { width: 100%; padding: 10px 12px; margin: 12px 0; background: rgba(10,8,37,.7); border: 1px solid rgba(155,77,255,.3); border-radius: 10px; color: #fff; font-family: inherit; font-size: 12px; box-sizing: border-box; }
#cat-mgr-app .v100-ord-foot { display: flex; gap: 8px; }
#cat-mgr-app .v100-ord-foot button { flex: 1; padding: 12px; border: none; border-radius: 11px; font-weight: 800; font-size: 13px; cursor: pointer; font-family: inherit; }
#cat-mgr-app .v100-btn-ok { background: linear-gradient(135deg,#22c55e,#16a34a); color: #fff; }
#cat-mgr-app .v100-btn-ok:disabled { opacity: .35; cursor: not-allowed; }
#cat-mgr-app .v100-btn-warn { background: linear-gradient(135deg,#ef4444,#dc2626); color: #fff; }
#cat-mgr-app .v100-products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
#cat-mgr-app .v100-prod { background: linear-gradient(135deg,#1e1533,#151b3a); border: 1px solid rgba(155,77,255,.2); border-radius: 14px; padding: 10px; overflow: hidden; cursor: pointer; }
#cat-mgr-app .v100-prod img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; background: #eee; margin-bottom: 8px; display: block; }
#cat-mgr-app .v100-prod-info b { font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; min-height: 32px; }
#cat-mgr-app .v100-prod-info>span { display: block; font-size: 10px; color: #a78bfa; margin-bottom: 2px; }
#cat-mgr-app .v100-stock { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; display: inline-block; margin-top: 4px; }
#cat-mgr-app .v100-stock-ok { background: rgba(34,197,94,.2); color: #4ade80; }
#cat-mgr-app .v100-stock-low { background: rgba(251,191,36,.2); color: #fbbf24; }
#cat-mgr-app .v100-stock-out { background: rgba(239,68,68,.2); color: #f87171; }
#cat-mgr-app .v100-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; background: rgba(10,8,37,.98); backdrop-filter: blur(12px); border-top: 1px solid rgba(155,77,255,.25); padding: 10px 0 14px; z-index: 20; }
#cat-mgr-app .v100-nav button { flex: 1; background: transparent; border: none; color: #6b5a8a; padding: 6px; cursor: pointer; font-family: inherit; display: flex; flex-direction: column; align-items: center; gap: 2px; position: relative; }
#cat-mgr-app .v100-nav button span { font-size: 22px; }
#cat-mgr-app .v100-nav button small { font-size: 11px; font-weight: 700; }
#cat-mgr-app .v100-nav button.active { color: #a78bfa; }
#cat-mgr-app .v100-nav button.active span { filter: drop-shadow(0 0 8px rgba(167,139,250,.6)); }
#cat-mgr-app .v100-badge { position: absolute; top: 0; right: 50%; transform: translateX(24px); background: #ef4444; color: #fff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 8px; min-width: 14px; text-align: center; font-style: normal; }
</style>

<script id="v201-js">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v201Ready) return;
    window.__v201Ready = true;
    
    var state = window.catMgrApp.state;

    function buildShell(){
      var app = document.getElementById('cat-mgr-app');
      if(!app) return;
      app.innerHTML = ''
        + '<div class="v100-header">'
        +   '<div class="v100-h-left">'
        +     '<div class="v100-h-cat" id="v100-cat-name">—</div>'
        +     '<div class="v100-h-user" id="v100-user-name">—</div>'
        +   '</div>'
        +   '<button class="v100-h-logout" id="v100-logout">🚪 خروج</button>'
        + '</div>'
        + '<main id="v100-content"></main>'
        + '<nav class="v100-nav">'
        +   '<button data-tab="home" class="active"><span>🏠</span><small>الرئيسية</small></button>'
        +   '<button data-tab="pending"><span>📦</span><small>طلباتي</small><i class="v100-badge" id="v100-badge" style="display:none"></i></button>'
        +   '<button data-tab="products"><span>🛍️</span><small>منتجاتي</small></button>'
        + '</nav>';
      document.getElementById('v100-logout').onclick = function(){ firebase.auth().signOut().then(function(){ location.reload(); }); };
      var navs = document.querySelectorAll('.v100-nav button');
      for(var i = 0; i < navs.length; i++){
        navs[i].onclick = function(){ window.__v100Tab(this.getAttribute('data-tab')); };
      }
    }

    function updateBadge(){
      var b = document.getElementById('v100-badge');
      if(!b) return;
      var n = (state.pending || []).length;
      if(n > 0){ b.textContent = n; b.style.display = ''; } else { b.style.display = 'none'; }
    }

    function render(){
      var cn = document.getElementById('v100-cat-name');
      var un = document.getElementById('v100-user-name');
      if(cn) cn.textContent = '🏷️ ' + (state.cat || 'قسمي');
      if(un) un.textContent = (state.user && state.user.name) || 'مدير القسم';
      var content = document.getElementById('v100-content');
      if(!content) return;
      var tab = state.activeTab || 'home';
      if(tab === 'home') content.innerHTML = renderHome();
      else if(tab === 'pending'){ content.innerHTML = renderPending(); attachPendingHandlers(); }
      else if(tab === 'products') content.innerHTML = renderProducts();
      updateBadge();
    }

    function renderHome(){
      var hour = new Date().getHours();
      var greet = hour < 12 ? 'صباح الخير' : (hour < 18 ? 'مساء النور' : 'مساء الخير');
      var emoji = hour < 12 ? '☀️' : (hour < 18 ? '🌤️' : '🌙');
      var pCount = (state.pending || []).length;
      var prCount = (state.products || []).length;
      var lowStock = (state.products || []).filter(function(p){ return Number(p.stock) > 0 && Number(p.stock) <= 3; }).length;
      var val = 0;
      (state.pending || []).forEach(function(o){ var c = o.categories && o.categories[state.cat]; if(c && c.subtotal) val += Number(c.subtotal) || 0; });
      var h = '';
      h += '<div class="v100-welcome">';
      h +=   '<div class="v100-w-greeting">' + emoji + ' ' + greet + '</div>';
      h +=   '<div class="v100-w-user">' + ((state.user && state.user.name) || 'مدير القسم') + '</div>';
      h +=   '<div class="v100-w-stats">';
      h +=     '<div class="v100-w-stat"><b>' + pCount + '</b><small>طلبات</small></div>';
      h +=     '<div class="v100-w-stat"><b>' + prCount + '</b><small>منتجات</small></div>';
      h +=     '<div class="v100-w-stat"><b>' + val.toFixed(0) + '</b><small>قيمة</small></div>';
      h +=   '</div>';
      h += '</div>';
      h += '<div class="v100-section">';
      h +=   '<div class="v100-sec-title">⚡ إجراءات سريعة</div>';
      h +=   '<div class="v100-actions">';
      h +=     '<button class="v100-act" data-go="pending"><span class="v100-act-icon">📦</span><div class="v100-act-lbl">مراجعة الطلبات</div>' + (pCount > 0 ? '<div class="v100-act-count">' + pCount + '</div>' : '') + '</button>';
      h +=     '<button class="v100-act" data-go="products"><span class="v100-act-icon">🛍️</span><div class="v100-act-lbl">منتجاتي</div><div class="v100-act-count">' + prCount + '</div></button>';
      h +=     '<button class="v100-act" data-go="add"><span class="v100-act-icon">➕</span><div class="v100-act-lbl">إضافة منتج</div></button>';
      h +=     '<button class="v100-act" data-go="logout"><span class="v100-act-icon">🚪</span><div class="v100-act-lbl">خروج</div></button>';
      h +=   '</div>';
      h += '</div>';
      if(lowStock > 0) h += '<div class="v100-alert">⚠️ <b>' + lowStock + '</b> منتج بمخزون منخفض (3 أو أقل)</div>';
      setTimeout(attachHomeHandlers, 0);
      return h;
    }
    
    function attachHomeHandlers(){
      var acts = document.querySelectorAll('.v100-act[data-go]');
      for(var i = 0; i < acts.length; i++){
        acts[i].onclick = function(){
          var g = this.getAttribute('data-go');
          if(g === 'logout') firebase.auth().signOut().then(function(){ location.reload(); });
          else if(g === 'add') {
             if(window.__v102cOpenForm) window.__v102cOpenForm();
             else if(window.__v102OpenForm) window.__v102OpenForm();
             else alert('نموذج الإضافة غير محمل');
          }
          else window.__v100Tab(g);
        };
      }
    }

    function renderPending(){
      if(!state.pending || !state.pending.length){
        return '<div class="v100-empty"><div class="v100-empty-icon">✨</div><div>لا توجد طلبات بانتظار المراجعة</div><div class="v100-empty-sub">ستظهر هنا الطلبات الجديدة تلقائياً</div></div>';
      }
      return state.pending.map(function(o){
        var c = (o.categories && o.categories[state.cat]) || { items: [] };
        var items = c.items || [];
        var total = items.reduce(function(s,i){ return s + (Number(i.price)||0)*(Number(i.qty)||1); }, 0);
        var allChecked = items.every(function(i){ return i._catStatus !== false; });
        var h = '<div class="v100-order" data-oid="' + o.id + '">';
        h +=   '<div class="v100-ord-head">';
        h +=     '<div style="min-width:0"><div class="v100-ord-id">#' + String(o.id).slice(-6) + '</div><div class="v100-ord-cust">' + (o.customerName || 'عميل') + ' · ' + (o.createdAt ? new Date(o.createdAt.toDate()).toLocaleDateString('ar-YE') : '—') + '</div></div>';
        h +=     '<div class="v100-ord-total">' + total.toFixed(0) + ' <small>ر.ي</small></div>';
        h +=   '</div>';
        h +=   '<div class="v100-ord-items">';
        items.forEach(function(it, idx){
          h += '<label class="v100-item">';
          h +=   '<input type="checkbox" data-idx="' + idx + '" ' + (it._catStatus === false ? '' : 'checked') + '>';
          h +=   '<img src="' + (it.img||'') + '" alt="">';
          h +=   '<div class="v100-item-info"><b>' + (it.name||'—') + '</b><span>الكمية: ' + (it.qty||1) + '</span></div>';
          h +=   '<div class="v100-item-price">' + ((Number(it.price)||0)*(Number(it.qty)||1)).toFixed(0) + '</div>';
          h += '</label>';
        });
        h +=   '</div>';
        h +=   '<input class="v100-reason" type="text" id="v100-reason-' + o.id + '" placeholder="سبب الرفض (عند الرفض فقط)">';
        h +=   '<div class="v100-ord-foot">';
        h +=     '<button class="v100-btn-ok" ' + (allChecked ? '' : 'disabled') + '>✓ تأكيد التوفر</button>';
        h +=     '<button class="v100-btn-warn">✗ رفض</button>';
        h +=   '</div>';
        h += '</div>';
        return h;
      }).join('');
    }
    
    function attachPendingHandlers(){
      var wraps = document.querySelectorAll('.v100-order');
      for(var i = 0; i < wraps.length; i++){
        (function(wrap){
          var oid = wrap.getAttribute('data-oid');
          var inputs = wrap.querySelectorAll('input[type=checkbox]');
          for(var j = 0; j < inputs.length; j++){
            (function(inp){
              inp.onchange = function(){ 
                 var o = state.pending.find(x => x.id === oid);
                 if(o) {
                     o.categories[state.cat].items[parseInt(inp.getAttribute('data-idx'),10)]._catStatus = inp.checked;
                     var all = o.categories[state.cat].items.every(x => x._catStatus !== false);
                     var btn = wrap.querySelector('.v100-btn-ok');
                     if(btn) btn.disabled = !all;
                 }
              };
            })(inputs[j]);
          }
          var ok = wrap.querySelector('.v100-btn-ok');
          if(ok) ok.onclick = function(){ if(window.catMgrApp.confirm) window.catMgrApp.confirm(oid); };
          var warn = wrap.querySelector('.v100-btn-warn');
          if(warn) warn.onclick = function(){ if(window.catMgrApp.reject) window.catMgrApp.reject(oid); };
        })(wraps[i]);
      }
    }

    function renderProducts(){
      if(!state.products || !state.products.length){
        return '<div class="v100-empty"><div class="v100-empty-icon">🛍️</div><div>لا توجد منتجات في قسمك</div><div class="v100-empty-sub">ستظهر هنا منتجات قسمك</div></div>';
      }
      return '<div class="v100-products-grid">' + state.products.map(function(p){
        var st = Number(p.stock) || 0;
        var cls = st === 0 ? 'out' : (st <= 3 ? 'low' : 'ok');
        var lbl = st === 0 ? 'نفذ' : (st <= 3 ? 'منخفض' : 'متوفر');
        return '<div class="v100-prod">'
          + '<img src="' + (p.img||'') + '" alt="">'
          + '<div class="v100-prod-info">'
          +   '<b>' + (p.name||'—') + '</b>'
          +   '<span>' + (p.brand||'') + ' · ' + ((Number(p.price)||0)).toFixed(0) + ' ر.ي</span>'
          +   '<span class="v100-stock v100-stock-' + cls + '">' + lbl + ' (' + st + ')</span>'
          + '</div></div>';
      }).join('') + '</div>';
    }

    window.__v100Tab = function(t){
      state.activeTab = t;
      var btns = document.querySelectorAll('.v100-nav button');
      for(var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-tab') === t);
      render();
    };

    window.catMgrApp.init = async function(userDoc){
      if(!userDoc || userDoc.role !== 'cat_manager') return false;
      state.user = userDoc;
      state.cat = userDoc.assignedCategory;
      if(!state.cat){ alert('⚠️ لم يُعيَّن قسم لهذا المستخدم'); return false; }
      
      buildShell();
      document.getElementById('cat-mgr-app').style.display = 'block';
      document.getElementById('am').style.display = 'none'; // إخفاء القديمة

      var db = firebase.firestore();
      try {
        var snap = await db.collection('products').get();
        state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
          .filter(function(p){ return p.category === state.cat || (Array.isArray(p.categories) && p.categories.indexOf(state.cat) !== -1); });
      } catch(e){ state.products = []; }

      if(state.unsub) state.unsub();
      state.unsub = db.collection('orders')
        .where('workflowStatus','==','awaiting_categories')
        .onSnapshot(function(snap){
          var pending = [];
          snap.forEach(function(d){
            var data = d.data();
            var c = data.categories && data.categories[state.cat];
            if(c && c.status === 'pending') pending.push(Object.assign({id:d.id}, data));
          });
          state.pending = pending;
          updateBadge();
          if(state.activeTab === 'home' || state.activeTab === 'pending') render();
        }, function(err){ console.warn(err); });

      state.activeTab = 'home';
      render();
      return true;
    };
    
    console.log('[V201] Beautiful UI restored.');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v100 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن واجهة v100 الجميلة');
