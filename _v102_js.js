(function(){
  'use strict';
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 250) return setTimeout(hook, 100);
    if(!window.__v101Ready) return setTimeout(hook, 100);
    if(window.__v102Ready) return;
    window.__v102Ready = true;
    try { install(); } catch(e){ console.error('[V102] install:', e); }
  }

  function install(){
    var state = window.catMgrApp.state;
    var db = firebase.firestore();
    var storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;
    if(!storage) console.warn('[V102] firebase.storage غير محمّل — الرفع معطّل');

    var brands = [], suppliers = [], lookupsLoaded = false;

    function extractList(doc){
      if(!doc || !doc.exists) return [];
      var d = doc.data();
      var list = d.list || d.items || d.brands || d.suppliers || d;
      if(Array.isArray(list)){
        return list.map(function(item, i){
          if(typeof item === 'string') return {id:item, name:item};
          return {id:item.id || item.key || ('item_'+i), name:item.name || item.title || item.label || String(item)};
        });
      }
      return Object.keys(list).map(function(k){
        var v = list[k];
        return {id:k, name:(typeof v === 'string') ? v : (v.name || v.title || k)};
      });
    }

    function loadLookups(){
      if(lookupsLoaded) return Promise.resolve();
      return Promise.all([
        db.collection('config').doc('brands').get().catch(function(){return null;}),
        db.collection('config').doc('suppliers').get().catch(function(){return null;})
      ]).then(function(res){
        brands = extractList(res[0]);
        suppliers = extractList(res[1]);
        lookupsLoaded = true;
        console.log('[V102] brands:', brands.length, '| suppliers:', suppliers.length);
      });
    }

    function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function toast(m){ var t=document.createElement('div'); t.className='v101-toast'; t.textContent=m; document.body.appendChild(t); setTimeout(function(){t.style.opacity='0';},2200); setTimeout(function(){if(t.parentNode)t.remove();},2600); }
    function closeModal(o){ o.classList.remove('active'); setTimeout(function(){ if(o.parentNode) o.remove(); }, 280); }

    function openProductFormV2(product){
      loadLookups().then(function(){ showForm(product); }).catch(function(e){ toast('❌ تحميل قوائم: '+e.message); });
    }

    function showForm(product){
      var isEdit = !!(product && product.id);
      var p = product || {};
      var existingImgs = Array.isArray(p.imgs) && p.imgs.length ? p.imgs.slice() : (p.img ? [p.img] : []);
      var uploadState = { uploading:false, urls: existingImgs };
      var features = Array.isArray(p.features) ? p.features.slice() : [];

      var brandOpts = brands.map(function(b){ return '<option value="'+esc(b.id)+'" '+(p.brandId===b.id || p.brand===b.name?'selected':'')+'>'+esc(b.name)+'</option>'; }).join('');
      var supplierOpts = suppliers.map(function(s){ return '<option value="'+esc(s.id)+'" '+(p.supplierId===s.id || p.supplier===s.name?'selected':'')+'>'+esc(s.name)+'</option>'; }).join('');

      var html = ''
        + '<div class="v101-m-head"><h3>'+(isEdit?'✏️ تعديل منتج':'➕ منتج جديد')+'</h3><button class="v101-m-close" type="button">✕</button></div>'
        + '<div class="v101-m-body">'
        +   '<label>اسم المنتج *</label><input id="v102-name" type="text" placeholder="مثال: عطر شانيل N°5" value="'+esc(p.name||'')+'">'
        +   '<label>الوصف</label><textarea id="v102-desc" rows="3" placeholder="وصف المنتج...">'+esc(p.desc||'')+'</textarea>'
        +   '<div class="v101-row">'
        +     '<div><label>الماركة *</label><select id="v102-brand"><option value="">— اختر —</option>'+brandOpts+'</select></div>'
        +     '<div><label>المورد *</label><select id="v102-supplier"><option value="">— اختر —</option>'+supplierOpts+'</select></div>'
        +   '</div>'
        +   '<label>المميزات <small style="color:#a78bfa;font-weight:400">(اضغط + أو Enter)</small></label>'
        +   '<div class="v102-features" id="v102-features"></div>'
        +   '<div class="v102-feature-add"><input id="v102-feature-input" type="text" placeholder="مثال: 100ml"><button type="button" id="v102-feature-btn">+</button></div>'
        +   '<div class="v101-row">'
        +     '<div><label>سعر الجملة *</label><input id="v102-cost" type="number" min="0" step="1" value="'+(p.costPrice||'')+'"></div>'
        +     '<div><label>سعر البيع *</label><input id="v102-price" type="number" min="0" step="1" value="'+(p.price||'')+'"></div>'
        +   '</div>'
        +   '<label>المخزون</label><input id="v102-stock" type="number" min="0" step="1" value="'+(p.stock||0)+'">'
        +   '<label>الصور <small style="color:#a78bfa;font-weight:400">(الأولى رئيسية · حد أقصى 5)</small></label>'
        +   '<div class="v102-imgs" id="v102-imgs"></div>'
        +   '<input type="file" id="v102-file" accept="image/*" multiple style="display:none">'
        +   '<button type="button" class="v102-upload-btn" id="v102-upload-btn">📷 رفع صور من الجهاز</button>'
        +   '<div class="v102-progress" id="v102-progress" style="display:none"><div class="v102-progress-bar"></div><span>0%</span></div>'
        +   '<label class="v101-toggle-lbl"><input id="v102-active" type="checkbox" '+(p.active!==false?'checked':'')+'> إظهار في تطبيق العميل</label>'
        + '</div>'
        + '<div class="v101-m-foot">'
        +   (isEdit ? '<button class="v101-btn-del" type="button" id="v102-del">🗑️</button>' : '')
        +   '<button class="v101-btn-cancel" type="button" id="v102-cancel">إلغاء</button>'
        +   '<button class="v101-btn-save" type="button" id="v102-save">💾 '+(isEdit?'تحديث':'نشر')+'</button>'
        + '</div>';

      var overlay = document.createElement('div');
      overlay.className='v101-modal-overlay active';
      overlay.innerHTML='<div class="v101-modal">'+html+'</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click',function(e){ if(e.target===overlay) closeModal(overlay); });
      var $ = function(id){ return overlay.querySelector('#'+id); };

      function renderFeatures(){
        var w = $('v102-features');
        w.innerHTML = features.map(function(f,i){ return '<span class="v102-chip">'+esc(f)+'<button type="button" data-i="'+i+'">×</button></span>'; }).join('');
        w.querySelectorAll('button[data-i]').forEach(function(btn){
          btn.onclick = function(){ features.splice(parseInt(this.getAttribute('data-i'),10),1); renderFeatures(); };
        });
      }
      renderFeatures();
      function addFeature(){
        var inp = $('v102-feature-input'); var v = inp.value.trim();
        if(!v) return;
        if(features.indexOf(v) !== -1){ toast('موجودة'); return; }
        features.push(v); inp.value=''; renderFeatures();
      }
      $('v102-feature-btn').onclick = addFeature;
      $('v102-feature-input').onkeydown = function(e){ if(e.key==='Enter'){ e.preventDefault(); addFeature(); } };

      function renderImgs(){
        var w = $('v102-imgs');
        w.innerHTML = uploadState.urls.map(function(url,i){
          return '<div class="v102-img-thumb"><img src="'+esc(url)+'">'+(i===0?'<span class="v102-badge-primary">رئيسية</span>':'')+'<button type="button" data-i="'+i+'">×</button></div>';
        }).join('');
        w.querySelectorAll('button[data-i]').forEach(function(btn){
          btn.onclick = function(){ uploadState.urls.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); };
        });
      }
      renderImgs();

      $('v102-upload-btn').onclick = function(){ $('v102-file').click(); };
      $('v102-file').onchange = async function(e){
        var files = Array.prototype.slice.call(e.target.files);
        if(!files.length) return;
        var remaining = 5 - uploadState.urls.length;
        if(remaining <= 0){ toast('⚠️ حد أقصى 5 صور'); return; }
        if(files.length > remaining) files = files.slice(0, remaining);
        if(!storage){ toast('❌ Storage غير محمّل'); return; }
        uploadState.uploading = true;
        var progress = $('v102-progress'); progress.style.display='block';
        var bar = progress.querySelector('.v102-progress-bar');
        var lbl = progress.querySelector('span');
        for(var i=0; i<files.length; i++){
          var f = files[i];
          if(f.size > 5*1024*1024){ toast('⚠️ '+f.name+' > 5MB'); continue; }
          try {
            var path = 'products/' + state.cat + '/' + Date.now() + '_' + i + '_' + f.name.replace(/[^a-zA-Z0-9.]/g,'_');
            var ref = storage.ref(path);
            var task = ref.put(f);
            await new Promise(function(resolve, reject){
              task.on('state_changed',
                function(snap){ var pct = Math.round((snap.bytesTransferred/snap.totalBytes)*100); bar.style.width = pct+'%'; lbl.textContent = pct+'%'; },
                function(err){ reject(err); },
                function(){ resolve(); }
              );
            });
            var url = await task.snapshot.ref.getDownloadURL();
            uploadState.urls.push(url);
            renderImgs();
          } catch(err){
            console.error('[V102] upload:', err);
            toast('❌ فشل: '+(err.code||err.message||''));
          }
        }
        progress.style.display='none';
        uploadState.uploading = false;
        $('v102-file').value = '';
      };

      overlay.querySelector('.v101-m-close').onclick = function(){ closeModal(overlay); };
      $('v102-cancel').onclick = function(){ closeModal(overlay); };

      $('v102-save').onclick = async function(){
        if(uploadState.uploading){ toast('⏳ انتظر رفع الصور'); return; }
        var name = $('v102-name').value.trim();
        var desc = $('v102-desc').value.trim();
        var brandId = $('v102-brand').value;
        var supplierId = $('v102-supplier').value;
        var costPrice = Number($('v102-cost').value) || 0;
        var price = Number($('v102-price').value) || 0;
        var stock = Number($('v102-stock').value) || 0;
        var active = $('v102-active').checked;
        var imgs = uploadState.urls.slice();
        if(!name){ toast('⚠️ الاسم مطلوب'); return; }
        if(!brandId){ toast('⚠️ اختر الماركة'); return; }
        if(!supplierId){ toast('⚠️ اختر المورد'); return; }
        if(costPrice <= 0){ toast('⚠️ سعر الجملة مطلوب'); return; }
        if(price <= 0){ toast('⚠️ سعر البيع مطلوب'); return; }
        if(!imgs.length){ toast('⚠️ صورة واحدة على الأقل'); return; }
        var brandObj = brands.filter(function(b){ return b.id===brandId; })[0];
        var supplierObj = suppliers.filter(function(s){ return s.id===supplierId; })[0];
        var data = {
          name: name, desc: desc,
          brand: brandObj ? brandObj.name : '', brandId: brandId,
          supplier: supplierObj ? supplierObj.name : '', supplierName: supplierObj ? supplierObj.name : '', supplierId: supplierId,
          costPrice: costPrice, price: price,
          stock: stock,
          img: imgs[0] || '', imgs: imgs,
          features: features,
          active: active,
          category: state.cat
        };
        var btn = this; btn.disabled = true; btn.textContent = '⏳...';
        try {
          if(isEdit){
            data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            data.updatedBy = state.user.uid;
            await db.collection('products').doc(product.id).update(data);
            toast('✅ تم التحديث');
          } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            data.createdBy = state.user.uid;
            await db.collection('products').add(data);
            toast('✅ تم النشر');
          }
          closeModal(overlay);
          try {
            var snap = await db.collection('products').get();
            state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
              .filter(function(pp){ return pp.category===state.cat || (Array.isArray(pp.categories) && pp.categories.indexOf(state.cat)!==-1); });
          } catch(e){}
          if(typeof window.__v100Tab === 'function') window.__v100Tab(state.activeTab || 'products');
        } catch(e){
          console.error('[V102] save:', e);
          btn.disabled = false; btn.textContent = '💾 '+(isEdit?'تحديث':'نشر');
          toast('❌ '+(e.message||e.code||'خطأ'));
        }
      };

      var delBtn = $('v102-del');
      if(delBtn){
        delBtn.onclick = async function(){
          if(!confirm('حذف "'+p.name+'" نهائياً؟')) return;
          try {
            await db.collection('products').doc(product.id).delete();
            closeModal(overlay); toast('🗑️ تم الحذف');
            var snap = await db.collection('products').get();
            state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
              .filter(function(pp){ return pp.category===state.cat || (Array.isArray(pp.categories) && pp.categories.indexOf(state.cat)!==-1); });
            if(typeof window.__v100Tab === 'function') window.__v100Tab(state.activeTab || 'products');
          } catch(e){ toast('❌ '+(e.message||e.code||'')); }
        };
      }
    }

    // Capture clicks BEFORE v101 sees them
    document.addEventListener('click', function(e){
      if(!e.target || !e.target.closest) return;
      var addBtn = e.target.closest('.v100-act[data-go="add"], .v101-add-btn');
      if(addBtn){
        e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
        openProductFormV2(null);
        return;
      }
      var prodCard = e.target.closest('.v100-prod');
      if(prodCard){
        var content = document.getElementById('v100-content');
        if(!content) return;
        var cards = Array.prototype.slice.call(content.querySelectorAll('.v100-prod'));
        var idx = cards.indexOf(prodCard);
        if(idx >= 0 && state.products && state.products[idx]){
          e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
          openProductFormV2(state.products[idx]);
        }
      }
    }, true);

    loadLookups();
    console.log('[V102] ready | storage:', !!storage);
  }
  hook();
})();
