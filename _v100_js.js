(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 200) return;
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v100Ready) return;
    window.__v100Ready = true;
    try { setup(); } catch(e){ console.error('[V100] setup:', e); }
  }
  function setup(){
    var db = firebase.firestore();
    var state = window.catMgrApp.state;
    var CATS = {electronics:'إلكترونيات',fashion:'أزياء',clothing:'ملابس',sports:'أدوات رياضية',beauty:'جمال وعطور',kids:'مستلزمات أطفال',tools:'أدوات منزلية',home:'منزل وأثاث'};
    function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function fmtDate(ts){ try{ var d = ts && ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('ar-YE'); } catch(e){ return '—'; } }
    function catLabel(c){ return CATS[c] || c || '—'; }

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
      document.getElementById('v100-logout').onclick = function(){ window.__v100Logout(); };
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
      if(cn) cn.textContent = '🏷️ ' + catLabel(state.cat);
      if(un) un.textContent = (state.user && state.user.name) || 'مدير القسم';
      var content = document.getElementById('v100-content');
      if(!content) return;
      var tab = state.activeTab || 'home';
      if(tab === 'home') content.innerHTML = renderHome();
      else if(tab === 'pending'){ content.innerHTML = renderPending(); attachPendingHandlers(); }
      else if(tab === 'products') content.innerHTML = renderProducts();
      else content.innerHTML = renderHome();
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
      h +=   '<div class="v100-w-user">' + esc((state.user && state.user.name) || 'مدير القسم') + '</div>';
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
          if(g === 'logout') window.__v100Logout();
          else if(g === 'add') alert('سيتم تفعيل الإضافة قريباً');
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
        var h = '<div class="v100-order" data-oid="' + esc(o.id) + '">';
        h +=   '<div class="v100-ord-head">';
        h +=     '<div style="min-width:0"><div class="v100-ord-id">#' + esc(String(o.id).slice(-6)) + '</div><div class="v100-ord-cust">' + esc(o.customerName || 'عميل') + ' · ' + fmtDate(o.createdAt) + '</div></div>';
        h +=     '<div class="v100-ord-total">' + total.toFixed(0) + ' <small>ر.ي</small></div>';
        h +=   '</div>';
        h +=   '<div class="v100-ord-items">';
        items.forEach(function(it, idx){
          h += '<label class="v100-item">';
          h +=   '<input type="checkbox" data-idx="' + idx + '" ' + (it._catStatus === false ? '' : 'checked') + '>';
          h +=   '<img src="' + esc(it.img||'') + '" alt="">';
          h +=   '<div class="v100-item-info"><b>' + esc(it.name||'—') + '</b><span>الكمية: ' + (it.qty||1) + '</span></div>';
          h +=   '<div class="v100-item-price">' + ((Number(it.price)||0)*(Number(it.qty)||1)).toFixed(0) + '</div>';
          h += '</label>';
        });
        h +=   '</div>';
        h +=   '<input class="v100-reason" type="text" id="v100-reason-' + esc(o.id) + '" placeholder="سبب الرفض (عند الرفض فقط)">';
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
              inp.onchange = function(){ window.__v100Toggle(oid, parseInt(inp.getAttribute('data-idx'),10), inp.checked); };
            })(inputs[j]);
          }
          var ok = wrap.querySelector('.v100-btn-ok');
          if(ok) ok.onclick = function(){ window.__v100Confirm(oid); };
          var warn = wrap.querySelector('.v100-btn-warn');
          if(warn) warn.onclick = function(){ window.__v100Reject(oid); };
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
          + '<img src="' + esc(p.img||'') + '" alt="">'
          + '<div class="v100-prod-info">'
          +   '<b>' + esc(p.name||'—') + '</b>'
          +   '<span>' + esc(p.brand||'') + ' · ' + ((Number(p.price)||0)).toFixed(0) + ' ر.ي</span>'
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

    window.__v100Toggle = function(oid, idx, checked){
      var o = state.pending.find(function(x){ return x.id === oid; });
      if(!o || !o.categories || !o.categories[state.cat] || !o.categories[state.cat].items) return;
      var items = o.categories[state.cat].items;
      if(items[idx]) items[idx]._catStatus = checked;
      var all = items.every(function(i){ return i._catStatus !== false; });
      var wrap = document.querySelector('.v100-order[data-oid="' + oid + '"]');
      if(wrap){ var btn = wrap.querySelector('.v100-btn-ok'); if(btn) btn.disabled = !all; }
    };

    window.__v100Confirm = function(oid){
      if(window.catMgrApp && typeof window.catMgrApp.confirm === 'function'){
        try { window.catMgrApp.confirm(oid); } catch(e){ console.error('[V100] confirm:', e); alert('❌ ' + (e.message||e)); }
      }
    };

    window.__v100Reject = function(oid){
      var o = state.pending.find(function(x){ return x.id === oid; });
      if(!o) return;
      var el = document.getElementById('v100-reason-' + oid);
      var reason = el ? el.value.trim() : '';
      if(!reason){ alert('⚠️ أدخل سبب الرفض أولاً'); if(el) el.focus(); return; }
      db.runTransaction(async function(tx){
        var ref = db.collection('orders').doc(oid);
        var doc = await tx.get(ref);
        if(!doc.exists) throw new Error('اختفى');
        var data = doc.data();
        var catObj = Object.assign({}, (data.categories||{})[state.cat]||{});
        catObj.status = 'rejected';
        catObj.rejectReason = reason;
        catObj.rejectedBy = state.user.uid;
        catObj.rejectedByName = state.user.name||'';
        catObj.rejectedAt = firebase.firestore.FieldValue.serverTimestamp();
        var upd = {};
        upd['categories.' + state.cat] = catObj;
        upd.workflowStatus = 'payment_rejected';
        tx.update(ref, upd);
      }).then(function(){
        var payload = { userId: o.customerId, title: '⚠️ تحديث بخصوص طلبك', body: 'قسم ' + catLabel(state.cat) + ': ' + reason, type: 'warning', event: 'cat_rejected', icon: '⚠️', important: true, read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        if(o.customerId) db.collection('notifications').add(payload).catch(function(){});
        alert('تم الرفض');
      }).catch(function(e){ console.error('[V100] reject:', e); alert('❌ ' + (e.message||e.code||'خطأ')); });
    };

    window.__v100Logout = function(){
      if(confirm('تسجيل الخروج؟')) firebase.auth().signOut().then(function(){ location.reload(); });
    };

    window.catMgrApp.init = async function(userDoc){
      if(!userDoc || userDoc.role !== 'cat_manager') return false;
      state.user = userDoc;
      state.cat = userDoc.assignedCategory;
      if(!state.cat){ alert('⚠️ لم يُعيَّن قسم لهذا المستخدم'); return false; }
      buildShell();
      document.getElementById('cat-mgr-app').style.display = 'block';
      try {
        var snap = await db.collection('products').get();
        state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
          .filter(function(p){ return p.category === state.cat || (Array.isArray(p.categories) && p.categories.indexOf(state.cat) !== -1); });
      } catch(e){ console.warn('[V100] products:', e); state.products = []; }

      if(state.unsub) state.unsub();
      state.unsub = db.collection('orders')
        .where('workflowStatus','==','awaiting_categories')
        .onSnapshot(function(snap){
          var oldMap = {};
          (state.pending || []).forEach(function(o){ oldMap[o.id] = o; });
          var pending = [];
          snap.forEach(function(d){
            var data = d.data();
            var c = data.categories && data.categories[state.cat];
            if(c && c.status === 'pending'){
              var fresh = Object.assign({id:d.id}, data);
              var old = oldMap[d.id];
              if(old && old.categories && old.categories[state.cat] && old.categories[state.cat].items){
                var oldItems = old.categories[state.cat].items;
                var newItems = fresh.categories[state.cat].items || [];
                newItems.forEach(function(ni, idx){
                  if(oldItems[idx] && typeof oldItems[idx]._catStatus === 'boolean') ni._catStatus = oldItems[idx]._catStatus;
                });
              }
              pending.push(fresh);
            }
          });
          state.pending = pending;
          updateBadge();
          if(state.activeTab === 'home' || state.activeTab === 'pending') render();
        }, function(err){ console.warn('[V100] orders:', err); });

      state.activeTab = 'home';
      var nb = document.querySelectorAll('.v100-nav button');
      for(var i = 0; i < nb.length; i++) nb[i].classList.toggle('active', nb[i].getAttribute('data-tab') === 'home');
      render();
      console.log('[V100] ready for:', state.cat);
      return true;
    };

    window.catMgrApp.switchTab = function(t){ window.__v100Tab(t); };
    console.log('[V100] installed');
  }

  if(document.readyState === 'complete') hook();
  else window.addEventListener('load', hook);
  setTimeout(hook, 0);
})();
