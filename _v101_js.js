(function(){
  'use strict';
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 200) return setTimeout(hook, 100);
    if(!window.__v100Ready) return setTimeout(hook, 100);
    if(window.__v101Ready) return;
    window.__v101Ready = true;
    try { install(); } catch(e){ console.error('[V101] install:', e); }
  }

  function install(){
    var state = window.catMgrApp.state;
    var db = firebase.firestore();
    function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function fmtDate(ts){ try{ var d = ts && ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('ar-YE',{month:'short',day:'numeric'}); }catch(e){ return '—'; } }
    function toast(m){ var t=document.createElement('div'); t.className='v101-toast'; t.textContent=m; document.body.appendChild(t); setTimeout(function(){t.style.opacity='0';},2200); setTimeout(function(){if(t.parentNode)t.remove();},2600); }

    function openModal(html){ var o=document.createElement('div'); o.className='v101-modal-overlay active'; o.innerHTML='<div class="v101-modal">'+html+'</div>'; document.body.appendChild(o); o.addEventListener('click',function(e){ if(e.target===o) closeModal(o); }); return o; }
    function closeModal(o){ o.classList.remove('active'); setTimeout(function(){ if(o.parentNode) o.remove(); },280); }

    function openProductForm(product){
      var isEdit = !!(product && product.id);
      var p = product || {};
      var html = ''
        + '<div class="v101-m-head"><h3>'+(isEdit?'✏️ تعديل منتج':'➕ منتج جديد')+'</h3><button class="v101-m-close" type="button">✕</button></div>'
        + '<div class="v101-m-body">'
        +   '<label>اسم المنتج *</label><input id="v101-f-name" type="text" placeholder="مثال: عطر شانيل" value="'+esc(p.name||'')+'">'
        +   '<label>الماركة</label><input id="v101-f-brand" type="text" placeholder="شانيل" value="'+esc(p.brand||'')+'">'
        +   '<div class="v101-row">'
        +     '<div><label>السعر (ر.ي) *</label><input id="v101-f-price" type="number" min="0" step="1" value="'+(p.price||'')+'"></div>'
        +     '<div><label>سعر التكلفة</label><input id="v101-f-cost" type="number" min="0" step="1" value="'+(p.costPrice||'')+'"></div>'
        +   '</div>'
        +   '<label>المخزون</label><input id="v101-f-stock" type="number" min="0" step="1" value="'+(p.stock||0)+'">'
        +   '<label>رابط الصورة</label><input id="v101-f-img" type="url" placeholder="https://..." value="'+esc(p.img||'')+'">'
        +   '<div id="v101-f-preview" class="v101-preview"></div>'
        +   '<label>الوصف</label><textarea id="v101-f-desc" rows="2" placeholder="وصف قصير...">'+esc(p.desc||'')+'</textarea>'
        +   '<label class="v101-toggle-lbl"><input id="v101-f-active" type="checkbox" '+(p.active!==false?'checked':'')+'> إظهار في تطبيق العميل</label>'
        + '</div>'
        + '<div class="v101-m-foot">'
        +   (isEdit ? '<button class="v101-btn-del" type="button">🗑️</button>' : '')
        +   '<button class="v101-btn-cancel" type="button">إلغاء</button>'
        +   '<button class="v101-btn-save" type="button">💾 حفظ</button>'
        + '</div>';
      var overlay = openModal(html);
      var imgInp = overlay.querySelector('#v101-f-img');
      var imgPrev = overlay.querySelector('#v101-f-preview');
      function updatePreview(){ if(imgInp.value.trim()){ imgPrev.innerHTML='<img src="'+esc(imgInp.value.trim())+'" onerror="this.style.opacity=0.3">'; } else { imgPrev.innerHTML=''; } }
      imgInp.addEventListener('input', updatePreview); updatePreview();
      overlay.querySelector('.v101-m-close').onclick = function(){ closeModal(overlay); };
      overlay.querySelector('.v101-btn-cancel').onclick = function(){ closeModal(overlay); };

      overlay.querySelector('.v101-btn-save').onclick = async function(){
        var name = overlay.querySelector('#v101-f-name').value.trim();
        var brand = overlay.querySelector('#v101-f-brand').value.trim();
        var price = Number(overlay.querySelector('#v101-f-price').value) || 0;
        var costPrice = Number(overlay.querySelector('#v101-f-cost').value) || 0;
        var stock = Number(overlay.querySelector('#v101-f-stock').value) || 0;
        var img = imgInp.value.trim();
        var desc = overlay.querySelector('#v101-f-desc').value.trim();
        var active = overlay.querySelector('#v101-f-active').checked;
        if(!name){ toast('⚠️ الاسم مطلوب'); return; }
        if(price <= 0){ toast('⚠️ السعر مطلوب'); return; }
        var data = { name:name, brand:brand, category:state.cat, price:price, costPrice:costPrice, stock:stock, img:img, desc:desc, active:active, profit:price-costPrice, profitMargin: price>0 ? Math.round((price-costPrice)/price*1000)/10 : 0 };
        var saveBtn = this; saveBtn.disabled = true; saveBtn.textContent = '⏳...';
        try {
          if(isEdit){ data.updatedAt = firebase.firestore.FieldValue.serverTimestamp(); data.updatedBy = state.user.uid; await db.collection('products').doc(product.id).update(data); }
          else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); data.createdBy = state.user.uid; data.supplierId = state.user.uid; data.supplierName = state.user.name||''; await db.collection('products').add(data); }
          closeModal(overlay); toast(isEdit?'✅ تم التحديث':'✅ تمت الإضافة'); await reloadProducts();
        } catch(e){ console.error('[V101] save:',e); saveBtn.disabled=false; saveBtn.textContent='💾 حفظ'; toast('❌ '+(e.message||e.code||'خطأ')); }
      };
      var delBtn = overlay.querySelector('.v101-btn-del');
      if(delBtn){
        delBtn.onclick = async function(){
          if(!confirm('حذف "'+p.name+'" نهائياً؟\n\nلا يمكن التراجع.')) return;
          try { await db.collection('products').doc(product.id).delete(); closeModal(overlay); toast('🗑️ تم الحذف'); await reloadProducts(); }
          catch(e){ toast('❌ '+(e.message||e.code||'خطأ')); }
        };
      }
    }

    async function reloadProducts(){
      try {
        var snap = await db.collection('products').get();
        state.products = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); })
          .filter(function(p){ return p.category===state.cat || (Array.isArray(p.categories) && p.categories.indexOf(state.cat)!==-1); });
      } catch(e){ console.warn('[V101] reload:', e); }
      window.__v100Tab(state.activeTab || 'home');
    }

    var historyState = {loaded:false, orders:[], unsub:null};
    var currentFilter = 'pending';
    function ensureHistoryLoaded(){
      if(historyState.loaded) return;
      historyState.loaded = true;
      try {
        historyState.unsub = db.collection('orders').orderBy('createdAt','desc').limit(100).onSnapshot(function(snap){
          var orders = [];
          snap.forEach(function(d){ var data=d.data(); if(data.categories && data.categories[state.cat]) orders.push(Object.assign({id:d.id},data)); });
          historyState.orders = orders;
          if(state.activeTab === 'pending') runEnhancements();
        }, function(err){
          console.warn('[V101] history onSnapshot:', err);
          db.collection('orders').limit(100).get().then(function(snap){
            var orders = [];
            snap.forEach(function(d){ var data=d.data(); if(data.categories && data.categories[state.cat]) orders.push(Object.assign({id:d.id},data)); });
            historyState.orders = orders;
            if(state.activeTab === 'pending') runEnhancements();
          }).catch(function(){});
        });
      } catch(e){ console.warn('[V101] ensureHistory:', e); }
    }

    function enhanceHome(){
      var addBtn = document.querySelector('.v100-act[data-go="add"]');
      if(addBtn && !addBtn.getAttribute('data-v101')){
        addBtn.setAttribute('data-v101','1');
        addBtn.onclick = function(e){ if(e){e.preventDefault();e.stopPropagation();} openProductForm(null); };
      }
    }

    function enhanceProducts(){
      var content = document.getElementById('v100-content');
      if(!content) return;
      if(content.querySelector('.v101-prod-toolbar')) return;
      var products = state.products || [];
      var toolbar = document.createElement('div');
      toolbar.className = 'v101-prod-toolbar';
      toolbar.innerHTML = '<input class="v101-search" type="text" placeholder="🔍 ابحث بالاسم أو الماركة"><button class="v101-add-btn" type="button" title="إضافة منتج">+</button>';
      toolbar.querySelector('.v101-add-btn').onclick = function(){ openProductForm(null); };
      toolbar.querySelector('.v101-search').oninput = function(){
        var q = this.value.toLowerCase().trim();
        content.querySelectorAll('.v100-prod').forEach(function(card, idx){
          var p = products[idx]; if(!p) return;
          var match = !q || (p.name||'').toLowerCase().indexOf(q)!==-1 || (p.brand||'').toLowerCase().indexOf(q)!==-1;
          card.style.display = match ? '' : 'none';
        });
      };
      content.insertBefore(toolbar, content.firstChild);
      content.querySelectorAll('.v100-prod').forEach(function(card, idx){
        card.style.cursor = 'pointer';
        card.onclick = function(){ var p = products[idx]; if(p) openProductForm(p); };
      });
    }

    function enhancePending(){
      var content = document.getElementById('v100-content');
      if(!content) return;
      ensureHistoryLoaded();
      var chips = content.querySelector('.v101-filter-chips');
      if(!chips){ chips = document.createElement('div'); chips.className='v101-filter-chips'; content.insertBefore(chips, content.firstChild); }
      updateChips(content); applyFilter(content);
    }

    function updateChips(content){
      var chips = content.querySelector('.v101-filter-chips');
      if(!chips) return;
      var counts = {all:0, pending:0, confirmed:0, rejected:0};
      historyState.orders.forEach(function(o){
        var c = o.categories && o.categories[state.cat]; if(!c) return;
        counts.all++; if(counts[c.status] !== undefined) counts[c.status]++;
      });
      if(!historyState.orders.length && state.pending && state.pending.length){
        counts.pending = state.pending.length; counts.all = state.pending.length;
      }
      var defs = [{key:'pending',label:'معلق'},{key:'confirmed',label:'مؤكد'},{key:'rejected',label:'مرفوض'},{key:'all',label:'الكل'}];
      chips.innerHTML = defs.map(function(c){
        var cnt = counts[c.key] || 0;
        return '<button class="v101-chip'+(currentFilter===c.key?' active':'')+'" data-filter="'+c.key+'" type="button">'+c.label+(cnt>0?' ('+cnt+')':'')+'</button>';
      }).join('');
      chips.querySelectorAll('[data-filter]').forEach(function(btn){
        btn.onclick = function(){ currentFilter = this.getAttribute('data-filter'); updateChips(content); applyFilter(content); };
      });
    }

    function applyFilter(content){
      var showPending = currentFilter === 'pending' || currentFilter === 'all';
      content.querySelectorAll('.v100-order').forEach(function(el){ el.style.display = showPending ? '' : 'none'; });
      var old = content.querySelector('.v101-history-section'); if(old) old.remove();
      var oldMsg = content.querySelector('.v101-empty-msg'); if(oldMsg) oldMsg.remove();
      if(currentFilter === 'pending') return;
      var filtered = historyState.orders.filter(function(o){
        var c = o.categories && o.categories[state.cat]; if(!c) return false;
        if(currentFilter === 'all') return c.status==='confirmed' || c.status==='rejected';
        return c.status === currentFilter;
      });
      if(!filtered.length){
        if(currentFilter === 'confirmed' || currentFilter === 'rejected'){
          var msg = document.createElement('div'); msg.className='v101-empty-msg';
          msg.textContent = currentFilter === 'confirmed' ? '✨ لم تؤكد أي طلب بعد' : '✨ لم ترفض أي طلب بعد';
          content.appendChild(msg);
        }
        return;
      }
      var section = document.createElement('div'); section.className='v101-history-section';
      section.innerHTML = filtered.map(function(o){
        var c = o.categories[state.cat]; var items = c.items || [];
        var total = items.reduce(function(s,i){ return s+(Number(i.price)||0)*(Number(i.qty)||1); },0);
        var lbl = c.status==='confirmed' ? '✅ مؤكد' : '❌ مرفوض';
        var cls = c.status==='confirmed' ? 'ok' : 'bad';
        var reason = c.rejectReason ? '<div class="v101-hist-reason">📝 '+esc(c.rejectReason)+'</div>' : '';
        return '<div class="v101-hist-order"><div class="v101-hist-head"><div class="v101-hist-id">#'+esc(String(o.id).slice(-6))+'</div><div class="v101-hist-badge v101-hist-'+cls+'">'+lbl+'</div></div><div class="v101-hist-meta">'+esc(o.customerName||'عميل')+' · '+fmtDate(o.createdAt)+' · '+total.toFixed(0)+' ر.ي</div>'+reason+'</div>';
      }).join('');
      content.appendChild(section);
    }

    function runEnhancements(){
      var tab = state.activeTab;
      if(tab === 'products') enhanceProducts();
      else if(tab === 'pending') enhancePending();
      else if(tab === 'home') enhanceHome();
    }

    var origTab = window.__v100Tab;
    if(typeof origTab === 'function'){
      window.__v100Tab = function(t){
        if(t !== 'pending') currentFilter = 'pending';
        origTab(t);
        setTimeout(runEnhancements, 60);
      };
      window.catMgrApp.switchTab = window.__v100Tab;
    }

    function trySetupObserver(){
      var contentEl = document.getElementById('v100-content');
      if(!contentEl){ setTimeout(trySetupObserver, 200); return; }
      var mo = new MutationObserver(function(){ clearTimeout(window.__v101Debounce); window.__v101Debounce = setTimeout(runEnhancements, 50); });
      mo.observe(contentEl, { childList:true });
      setTimeout(runEnhancements, 100);
      console.log('[V101] observer installed');
    }
    setTimeout(trySetupObserver, 150);
    console.log('[V101] ready');
  }
  hook();
})();
