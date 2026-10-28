const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// احتياطياً: حذف النسخ السابقة إن وجدت
h = h.replace(/<script id="v246-form">[\s\S]*?<\/script>/g, '');

const v246 = `
<script id="v246-form">
(function(){
  if(window.__v246Ready) return;
  var tries = 0;
  function check(){
    tries++;
    if(tries > 40) return;
    if(!window.catMgrApp || !firebase || !firebase.firestore) return setTimeout(check, 500);
    install();
  }
  function install(){
    if(window.__v246Ready) return;
    window.__v246Ready = true;
    
    // CSS احتياطي للنموذج
    if(!document.getElementById('v246-css')){
      var st = document.createElement('style');
      st.id = 'v246-css';
      st.textContent = '.v101-modal-overlay{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);display:none;align-items:flex-end;justify-content:center}.v101-modal-overlay.active{display:flex}.v101-modal{width:100%;max-width:560px;background:linear-gradient(180deg,#1e1533,#0a0825);border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;border:1px solid rgba(155,77,255,.3);border-bottom:none;color:#fff}.v101-m-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid rgba(155,77,255,.2);position:sticky;top:0;background:#1e1533;z-index:1}.v101-m-head h3{margin:0;font-size:17px;font-weight:800;color:#fff}.v101-m-close{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;font-family:inherit}.v101-m-body{padding:16px 20px}.v101-m-foot{display:flex;gap:10px;padding:16px 20px;border-top:1px solid rgba(155,77,255,.2);position:sticky;bottom:0;background:#1e1533}.v101-m-foot button{flex:1;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;border:none}.v101-btn-save{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}.v101-btn-cancel{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3)!important}';
      document.head.appendChild(st);
    }
    
    var db = firebase.firestore();
    var brands = [], suppliers = [], loaded = false;
    
    function loadLookups(cb){
      if(loaded) return cb();
      Promise.all([
        db.collection('config').doc('brands').get().catch(function(){return null;}),
        db.collection('config').doc('suppliers').get().catch(function(){return null;})
      ]).then(function(rs){
        function extract(doc){
          if(!doc || !doc.exists) return [];
          var d = doc.data();
          var list = d.list || d.items || d.brands || d.suppliers || d;
          if(Array.isArray(list)){
            return list.map(function(item, i){
              if(typeof item === 'string') return {id:item, name:item};
              return {id:item.id || ('i'+i), name:item.name || String(item)};
            });
          }
          return Object.keys(list).map(function(k){
            var v = list[k];
            return {id:k, name:(typeof v==='string')?v:(v.name||k)};
          });
        }
        brands = extract(rs[0]);
        suppliers = extract(rs[1]);
        loaded = true;
        console.log('[V246] brands:', brands.length, 'suppliers:', suppliers.length);
        cb();
      });
    }
    
    function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    
    function showForm(){
      var state = window.catMgrApp.state;
      var imgs = [], uploading = false;
      
      var brandOpts = '<option value="">— اختر —</option>' + brands.map(function(b){ return '<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>'; }).join('');
      var supplierOpts = '<option value="">— اختر —</option>' + suppliers.map(function(s){ return '<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>'; }).join('');
      
      var iS = 'width:100%;padding:12px 14px;box-sizing:border-box;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px';
      var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin:12px 0 6px';
      
      var html = ''
        + '<div class="v101-m-head"><h3>➕ منتج جديد</h3><button class="v101-m-close" type="button" id="v246-close">✕</button></div>'
        + '<div class="v101-m-body">'
        +   '<label style="'+lS+'">اسم المنتج *</label>'
        +   '<input id="v246-name" type="text" placeholder="مثال: عطر شانيل N°5" style="'+iS+'">'
        +   '<label style="'+lS+'">الوصف</label>'
        +   '<textarea id="v246-desc" rows="2" placeholder="وصف المنتج..." style="'+iS+'"></textarea>'
        +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        +     '<div><label style="'+lS+'">الماركة *</label><select id="v246-brand" style="'+iS+'">'+brandOpts+'</select></div>'
        +     '<div><label style="'+lS+'">المورد *</label><select id="v246-supplier" style="'+iS+'">'+supplierOpts+'</select></div>'
        +   '</div>'
        +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        +     '<div><label style="'+lS+'">سعر الجملة *</label><input id="v246-cost" type="number" min="0" style="'+iS+'"></div>'
        +     '<div><label style="'+lS+'">سعر البيع *</label><input id="v246-price" type="number" min="0" style="'+iS+'"></div>'
        +   '</div>'
        +   '<label style="'+lS+'">المخزون</label>'
        +   '<input id="v246-stock" type="number" min="0" value="0" style="'+iS+'">'
        +   '<label style="'+lS+'">الصور (حد أقصى 5)</label>'
        +   '<div id="v246-imgs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"></div>'
        +   '<input type="file" id="v246-file" accept="image/*" multiple style="display:none">'
        +   '<button type="button" id="v246-upload" style="width:100%;padding:12px;background:rgba(155,77,255,.15);border:1px dashed rgba(155,77,255,.5);border-radius:12px;color:#a78bfa;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">📷 رفع صور</button>'
        +   '<div id="v246-prog" style="display:none;height:26px;background:rgba(10,8,37,.7);border-radius:8px;overflow:hidden;margin-bottom:10px;border:1px solid rgba(155,77,255,.3);position:relative"><div id="v246-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);width:0%;transition:width .2s"></div><span id="v246-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:700;color:#fff">0%</span></div>'
        + '</div>'
        + '<div class="v101-m-foot">'
        +   '<button class="v101-btn-cancel" type="button" id="v246-cancel">إلغاء</button>'
        +   '<button class="v101-btn-save" type="button" id="v246-save">💾 إرسال للمراجعة</button>'
        + '</div>';
      
      var overlay = document.createElement('div');
      overlay.className = 'v101-modal-overlay active';
      overlay.innerHTML = '<div class="v101-modal">' + html + '</div>';
      document.body.appendChild(overlay);
      
      function $(id){ return overlay.querySelector('#'+id); }
      
      function renderImgs(){
        $('v246-imgs').innerHTML = imgs.map(function(url, i){
          return '<div style="position:relative;aspect-ratio:1;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:10px;overflow:hidden"><img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=.3"><button type="button" data-i="'+i+'" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,.9);color:#fff;border:none;width:22px;height:22px;border-radius:50%;font-size:12px;cursor:pointer;padding:0;line-height:1">×</button></div>';
        }).join('');
        overlay.querySelectorAll('#v246-imgs button[data-i]').forEach(function(btn){
          btn.onclick = function(){ imgs.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); };
        });
      }
      
      $('v246-close').onclick = function(){ overlay.remove(); };
      $('v246-cancel').onclick = function(){ overlay.remove(); };
      $('v246-upload').onclick = function(){ $('v246-file').click(); };
      
      $('v246-file').onchange = async function(e){
        var files = Array.prototype.slice.call(e.target.files);
        if(!files.length) return;
        var remaining = 5 - imgs.length;
        if(remaining <= 0){ alert('حد أقصى 5 صور'); return; }
        if(files.length > remaining) files = files.slice(0, remaining);
        if(typeof window.__v102c_uploadBatch !== 'function'){ alert('رافع الصور غير جاهز — أعد تحميل الصفحة'); return; }
        uploading = true;
        var prog = $('v246-prog'); prog.style.display = 'block';
        var bar = $('v246-bar'); var pct = $('v246-pct');
        try {
          await window.__v102c_uploadBatch(files, state.cat, {
            onProgress: function(p){ bar.style.width = p+'%'; pct.textContent = p+'%'; },
            onUrl: function(url){ imgs.push(url); renderImgs(); },
            onError: function(err){ alert('فشل: '+(err.message||'')); }
          });
        } catch(err){ alert('فشل الرفع: '+(err.message||'')); }
        prog.style.display = 'none';
        uploading = false;
        e.target.value = '';
      };
      
      $('v246-save').onclick = async function(){
        if(uploading){ alert('انتظر رفع الصور'); return; }
        var name = $('v246-name').value.trim();
        var brandId = $('v246-brand').value;
        var supplierId = $('v246-supplier').value;
        var costPrice = Number($('v246-cost').value) || 0;
        var price = Number($('v246-price').value) || 0;
        var stock = Number($('v246-stock').value) || 0;
        var desc = $('v246-desc').value.trim();
        
        if(!name){ alert('الاسم مطلوب'); return; }
        if(!brandId){ alert('اختر الماركة'); return; }
        if(!supplierId){ alert('اختر المورد'); return; }
        if(costPrice <= 0){ alert('سعر الجملة مطلوب'); return; }
        if(price <= 0){ alert('سعر البيع مطلوب'); return; }
        if(imgs.length === 0){ alert('صورة واحدة على الأقل'); return; }
        
        var bObj = brands.filter(function(b){return b.id===brandId;})[0] || {name:brandId};
        var sObj = suppliers.filter(function(s){return s.id===supplierId;})[0] || {name:supplierId};
        
        var btn = this; btn.disabled = true; btn.textContent = '⏳...';
        
        try {
          await db.collection('products').add({
            name: name, desc: desc,
            brand: bObj.name, brandId: brandId,
            supplier: sObj.name, supplierName: sObj.name, supplierId: supplierId,
            costPrice: costPrice, price: price, stock: stock,
            img: imgs[0], imgs: imgs.slice(),
            category: state.cat,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: state.user.uid,
            createdByName: state.user.name || ''
          });
          overlay.remove();
          if(window.__chizenToast) window.__chizenToast('تم الإرسال للمراجعة', 'success', 'سيظهر بعد اعتماد السوبر أدمن');
          else alert('✅ تم الإرسال للمراجعة');
        } catch(err){
          btn.disabled = false; btn.textContent = '💾 إرسال للمراجعة';
          alert('فشل الحفظ: '+(err.message||err.code||''));
        }
      };
    }
    
    window.__v102cOpenForm = function(){ loadLookups(showForm); };
    window.__v102OpenForm = window.__v102cOpenForm;
    
    // اعتراض النقر على زر "إضافة منتج" في مرحلة الالتقاط
    document.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('.v100-act[data-go="add"]');
      if(btn){
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        window.__v102cOpenForm();
      }
    }, true);
    
    console.log('[V246] Product form ready — brands:', brands.length, 'suppliers:', suppliers.length);
  }
  setTimeout(check, 1500);
})();
</script>
`;

h = h.replace('</body>', v246 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v246: Product form opener installed');
