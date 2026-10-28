const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف كل النسخ السابقة
h = h.replace(/<script id="v249-form">[\s\S]*?<\/script>/g, '');
h = h.replace(/<script id="v250-bind">[\s\S]*?<\/script>/g, '');
h = h.replace(/<script id="v251-form">[\s\S]*?<\/script>/g, '');

const v251 = `
<script id="v251-form">
(function(){
  console.log('[V251] unified form installer');
  
  // CSS
  if(!document.getElementById('v251-css')){
    var st = document.createElement('style');
    st.id = 'v251-css';
    st.textContent = '.v251-ov{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;overflow-y:auto}.v251-m{width:100%;max-width:560px;background:linear-gradient(180deg,#1e1533,#0a0825);border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;border:1px solid rgba(155,77,255,.3);border-bottom:none;color:#fff;font-family:inherit}.v251-h{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid rgba(155,77,255,.2);position:sticky;top:0;background:#1e1533;z-index:1}.v251-h h3{margin:0;font-size:17px;font-weight:800}.v251-x{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;font-family:inherit}.v251-b{padding:16px 20px}.v251-f{display:flex;gap:10px;padding:16px 20px;border-top:1px solid rgba(155,77,255,.2);position:sticky;bottom:0;background:#1e1533}.v251-f button{flex:1;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;border:none}.v251-save{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}.v251-del{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.4)!important;flex:0 0 60px!important}.v251-cancel{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3)!important}';
    document.head.appendChild(st);
  }
  
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  
  async function fetchList(docName){
    try {
      var db = firebase.firestore();
      var doc = await db.collection('config').doc(docName).get();
      if(!doc.exists) return [];
      var d = doc.data();
      var list = d.list || d.items || d[docName] || d;
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
    } catch(e){ return []; }
  }
  
  async function openForm(product){
    console.log('[V251] openForm, mode:', product ? 'edit:'+product.id : 'new');
    
    if(!window.catMgrApp || !window.catMgrApp.state || !window.catMgrApp.state.user){
      alert('⚠️ أعد تحميل الصفحة'); return;
    }
    
    var state = window.catMgrApp.state;
    var db = firebase.firestore();
    var isEdit = !!(product && product.id);
    var p = product || {};
    
    var iS = 'width:100%;padding:12px 14px;box-sizing:border-box;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px';
    var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin:12px 0 6px';
    
    var html = ''
      + '<div class="v251-h"><h3>' + (isEdit ? '✏️ تعديل المنتج' : '➕ منتج جديد') + '</h3><button class="v251-x" id="v251-close">✕</button></div>'
      + '<div class="v251-b">'
      +   '<label style="'+lS+'">اسم المنتج *</label><input id="v251-name" type="text" value="'+esc(p.name||'')+'" style="'+iS+'">'
      +   '<label style="'+lS+'">الوصف</label><textarea id="v251-desc" rows="2" style="'+iS+'">'+esc(p.desc||'')+'</textarea>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +     '<div><label style="'+lS+'">الماركة *</label><select id="v251-brand" style="'+iS+'"><option value="'+esc(p.brandId||'')+'" data-name="'+esc(p.brand||'')+'">'+esc(p.brand||'⏳ تحميل...')+'</option></select></div>'
      +     '<div><label style="'+lS+'">المورد *</label><select id="v251-supplier" style="'+iS+'"><option value="'+esc(p.supplierId||'')+'" data-name="'+esc(p.supplier||'')+'">'+esc(p.supplier||'⏳ تحميل...')+'</option></select></div>'
      +   '</div>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +     '<div><label style="'+lS+'">سعر الجملة *</label><input id="v251-cost" type="number" min="0" value="'+(p.costPrice||'')+'" style="'+iS+'"></div>'
      +     '<div><label style="'+lS+'">سعر البيع *</label><input id="v251-price" type="number" min="0" value="'+(p.price||'')+'" style="'+iS+'"></div>'
      +   '</div>'
      +   '<label style="'+lS+'">المخزون</label><input id="v251-stock" type="number" min="0" value="'+(p.stock||0)+'" style="'+iS+'">'
      +   '<label style="'+lS+'">الصور (حد أقصى 5)</label>'
      +   '<div id="v251-imgs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"></div>'
      +   '<input type="file" id="v251-file" accept="image/*" multiple style="display:none">'
      +   '<button type="button" id="v251-upload" style="width:100%;padding:12px;background:rgba(155,77,255,.15);border:1px dashed rgba(155,77,255,.5);border-radius:12px;color:#a78bfa;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">📷 رفع صور</button>'
      +   '<div id="v251-prog" style="display:none;height:26px;background:rgba(10,8,37,.7);border-radius:8px;overflow:hidden;margin-bottom:10px;border:1px solid rgba(155,77,255,.3);position:relative"><div id="v251-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);width:0%"></div><span id="v251-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:700;color:#fff">0%</span></div>'
      + '</div>'
      + '<div class="v251-f">'
      +   (isEdit ? '<button class="v251-del" id="v251-del">🗑️</button>' : '')
      +   '<button class="v251-cancel" id="v251-cancel">إلغاء</button>'
      +   '<button class="v251-save" id="v251-save">' + (isEdit ? '💾 حفظ التعديلات' : '💾 إرسال للمراجعة') + '</button>'
      + '</div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'v251-ov';
    overlay.innerHTML = '<div class="v251-m">' + html + '</div>';
    document.body.appendChild(overlay);
    
    function $(id){ return overlay.querySelector('#'+id); }
    var imgs = (Array.isArray(p.imgs) && p.imgs.length) ? p.imgs.slice() : (p.img ? [p.img] : []);
    var uploading = false;
    
    function renderImgs(){
      $('v251-imgs').innerHTML = imgs.map(function(url, i){
        return '<div style="position:relative;aspect-ratio:1;background:#111;border:1px solid rgba(155,77,255,.3);border-radius:10px;overflow:hidden"><img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover"><button type="button" data-i="'+i+'" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,.9);color:#fff;border:none;width:22px;height:22px;border-radius:50%;font-size:12px;cursor:pointer;line-height:1">×</button></div>';
      }).join('');
      overlay.querySelectorAll('#v251-imgs button[data-i]').forEach(function(b){
        b.onclick = function(){ imgs.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); };
      });
    }
    renderImgs();
    
    $('v251-close').onclick = $('v251-cancel').onclick = function(){ overlay.remove(); };
    
    // تحميل القوائم (لا تعطل النموذج)
    fetchList('brands').then(function(brands){
      var sel = $('v251-brand'); if(!sel) return;
      var cur = sel.value || '';
      sel.innerHTML = '<option value="">— اختر —</option>' + brands.map(function(b){
        return '<option value="'+esc(b.id)+'" data-name="'+esc(b.name)+'" '+(cur===b.id?'selected':'')+'>'+esc(b.name)+'</option>';
      }).join('');
    });
    fetchList('suppliers').then(function(suppliers){
      var sel = $('v251-supplier'); if(!sel) return;
      var cur = sel.value || '';
      sel.innerHTML = '<option value="">— اختر —</option>' + suppliers.map(function(s){
        return '<option value="'+esc(s.id)+'" data-name="'+esc(s.name)+'" '+(cur===s.id?'selected':'')+'>'+esc(s.name)+'</option>';
      }).join('');
    });
    
    $('v251-upload').onclick = function(){ $('v251-file').click(); };
    $('v251-file').onchange = async function(e){
      var files = Array.prototype.slice.call(e.target.files);
      if(!files.length) return;
      var rem = 5 - imgs.length;
      if(rem <= 0){ alert('حد أقصى 5'); return; }
      if(files.length > rem) files = files.slice(0, rem);
      if(typeof window.__v102c_uploadBatch !== 'function'){ alert('رافع الصور غير جاهز'); return; }
      uploading = true;
      $('v251-prog').style.display = 'block';
      try {
        await window.__v102c_uploadBatch(files, state.cat, {
          onProgress: function(pct){ $('v251-bar').style.width = pct+'%'; $('v251-pct').textContent = pct+'%'; },
          onUrl: function(url){ imgs.push(url); renderImgs(); },
          onError: function(err){ alert('فشل: '+(err.message||'')); }
        });
      } catch(err){ alert('فشل الرفع: '+(err.message||'')); }
      $('v251-prog').style.display = 'none';
      uploading = false;
      e.target.value = '';
    };
    
    $('v251-save').onclick = async function(){
      if(uploading){ alert('انتظر رفع الصور'); return; }
      var name = $('v251-name').value.trim();
      var brandSel = $('v251-brand'), supSel = $('v251-supplier');
      var brandId = brandSel.value, supplierId = supSel.value;
      var brandName = brandId ? brandSel.options[brandSel.selectedIndex].getAttribute('data-name') : '';
      var supplierName = supplierId ? supSel.options[supSel.selectedIndex].getAttribute('data-name') : '';
      var costPrice = Number($('v251-cost').value) || 0;
      var price = Number($('v251-price').value) || 0;
      var stock = Number($('v251-stock').value) || 0;
      var desc = $('v251-desc').value.trim();
      
      if(!name){ alert('الاسم مطلوب'); return; }
      if(!brandId){ alert('اختر الماركة'); return; }
      if(!supplierId){ alert('اختر المورد'); return; }
      if(costPrice <= 0){ alert('سعر الجملة مطلوب'); return; }
      if(price <= 0){ alert('سعر البيع مطلوب'); return; }
      if(imgs.length === 0){ alert('صورة واحدة على الأقل'); return; }
      
      var btn = this; btn.disabled = true; btn.textContent = '⏳...';
      
      try {
        var data = {
          name: name, desc: desc,
          brand: brandName, brandId: brandId,
          supplier: supplierName, supplierName: supplierName, supplierId: supplierId,
          costPrice: costPrice, price: price, stock: stock,
          img: imgs[0], imgs: imgs.slice(),
          category: state.cat,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: state.user.uid
        };
        
        if(isEdit){
          data.status = 'pending_review';
          data.active = false;
          await db.collection('products').doc(p.id).update(data);
          overlay.remove();
          if(window.__chizenToast) window.__chizenToast('تم حفظ التعديلات', 'success', 'المنتج بانتظار إعادة المراجعة');
          else alert('✅ تم التحديث');
        } else {
          data.status = 'pending_review';
          data.active = false;
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          data.createdBy = state.user.uid;
          data.createdByName = state.user.name || '';
          data.submittedBy = { uid: state.user.uid, name: state.user.name || '', at: firebase.firestore.FieldValue.serverTimestamp() };
          await db.collection('products').add(data);
          overlay.remove();
          if(window.__chizenToast) window.__chizenToast('تم الإرسال للمراجعة', 'success', 'سيظهر بعد الاعتماد');
          else alert('✅ تم الإرسال');
          
          try {
            var admins = await db.collection('users').where('role','==','super_admin').get();
            admins.forEach(function(a){
              db.collection('notifications').add({
                userId: a.id, title: '📦 منتج جديد بانتظار المراجعة',
                body: name + ' — ' + state.cat, type: 'product', icon: '📦',
                read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
              }).catch(function(){});
            });
          } catch(e){}
        }
        
        // تحديث قائمة المنتجات
        try {
          var snap = await db.collection('products').get();
          state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
            .filter(function(pp){ return pp.category===state.cat || (Array.isArray(pp.categories) && pp.categories.indexOf(state.cat)!==-1); });
          if(window.__v100Tab) window.__v100Tab('products');
        } catch(e){}
        
      } catch(err){
        console.error('[V251] save:', err);
        btn.disabled = false; btn.textContent = isEdit ? '💾 حفظ التعديلات' : '💾 إرسال للمراجعة';
        alert('فشل: '+(err.message||err.code||''));
      }
    };
    
    var delBtn = $('v251-del');
    if(delBtn){
      delBtn.onclick = async function(){
        if(!confirm('حذف "'+p.name+'" نهائياً؟')) return;
        try {
          await db.collection('products').doc(p.id).delete();
          overlay.remove();
          if(window.__chizenToast) window.__chizenToast('تم الحذف', 'success');
          var snap = await db.collection('products').get();
          state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
            .filter(function(pp){ return pp.category===state.cat || (Array.isArray(pp.categories) && pp.categories.indexOf(state.cat)!==-1); });
          if(window.__v100Tab) window.__v100Tab('products');
        } catch(err){ alert('فشل: '+(err.message||'')); }
      };
    }
  }
  
  // معرّض عالمي
  window.__v102cOpenForm = openForm;
  window.__v102OpenForm = openForm;
  window.__v251Ready = true;
  
  // ربط الأزرار والبطاقات
  var state = null;
  function bind(){
    if (!window.catMgrApp || !window.catMgrApp.state) return;
    state = window.catMgrApp.state;
    
    // 1. زر + في الشريط
    var b1 = document.querySelector('.v101-add-btn');
    if (b1 && !b1.__v251) {
      b1.__v251 = true;
      b1.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openForm(null); };
      console.log('[V251] bound toolbar +');
    }
    
    // 2. زر الرئيسية
    var b2 = document.querySelector('.v100-act[data-go="add"]');
    if (b2 && !b2.__v251) {
      b2.__v251 = true;
      b2.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openForm(null); };
      console.log('[V251] bound home +');
    }
    
    // 3. بطاقات المنتجات
    if (state.products && state.products.length) {
      var cards = document.querySelectorAll('.v100-prod');
      if (cards.length) {
        cards.forEach(function(card, idx){
          if (card.__v251) return;
          card.__v251 = true;
          card.style.cursor = 'pointer';
          card.onclick = function(e){
            e.preventDefault(); e.stopPropagation();
            if (state.products[idx]) openForm(state.products[idx]);
          };
        });
        console.log('[V251] bound', cards.length, 'product cards');
      }
    }
  }
  
  var mo = new MutationObserver(bind);
  mo.observe(document.body, { childList: true, subtree: true });
  setInterval(bind, 800);
  setTimeout(bind, 500);
  setTimeout(bind, 1500);
  
  console.log('[V251] ready');
})();
</script>
`;

h = h.replace('</body>', v251 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v251: نموذج موحّد (إضافة + تعديل + حذف) + ربط كامل');
