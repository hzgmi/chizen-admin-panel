const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف v251 القديم
h = h.replace(/<script id="v251-form">[\s\S]*?<\/script>/g, '');

const v254 = `
<script id="v254-form">
(function(){
  if(window.__v254Ready) return;
  window.__v254Ready = true;
  console.log('[V254] form installer (fixed dropdowns + auto-publish)');
  
  // CSS
  if(!document.getElementById('v254-css')){
    var st = document.createElement('style');
    st.id = 'v254-css';
    st.textContent = '.v254-ov{position:fixed;inset:0;z-index:99999999;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;overflow-y:auto}.v254-m{width:100%;max-width:560px;background:linear-gradient(180deg,#1e1533,#0a0825);border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;border:1px solid rgba(155,77,255,.3);border-bottom:none;color:#fff;font-family:inherit}.v254-h{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid rgba(155,77,255,.2);position:sticky;top:0;background:#1e1533;z-index:1}.v254-h h3{margin:0;font-size:17px;font-weight:800}.v254-x{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;font-family:inherit}.v254-b{padding:16px 20px}.v254-f{display:flex;gap:10px;padding:16px 20px;border-top:1px solid rgba(155,77,255,.2);position:sticky;bottom:0;background:#1e1533}.v254-f button{flex:1;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;border:none}.v254-save{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}.v254-del{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.4)!important;flex:0 0 60px!important}.v254-cancel{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3)!important}';
    document.head.appendChild(st);
  }
  
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  
  // 🔑 استخراج الاسم من أي شكل
  function extractName(v){
    if (v == null) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number') return String(v);
    if (Array.isArray(v)) {
      for (var i = 0; i < v.length; i++) {
        var n = extractName(v[i]);
        if (n) return n;
      }
      return '';
    }
    if (typeof v === 'object') {
      var keys = ['ar', 'name', 'title', 'label', 'text', 'en', 'value'];
      for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        if (v[k] != null && v[k] !== v) {
          var n2 = extractName(v[k]);
          if (n2 && n2 !== '[object Object]') return n2;
        }
      }
      for (var key in v) {
        if (key === 'logo' || key === 'img' || key === 'icon' || key === 'id' || key === 'key') continue;
        if (typeof v[key] === 'string' && v[key].trim()) return v[key].trim();
      }
    }
    return '';
  }
  
  function extractId(v, fallback){
    if (v == null) return fallback || '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') return v.id || v.key || v.slug || v.code || fallback || '';
    return fallback || '';
  }
  
  async function fetchList(docName){
    try {
      var db = firebase.firestore();
      var doc = await db.collection('config').doc(docName).get();
      if(!doc.exists) return [];
      var d = doc.data();
      var list = d.list || d.items || d[docName] || d;
      
      if (Array.isArray(list)) {
        return list.map(function(item, i){
          if (typeof item === 'string') return {id: item, name: item};
          if (typeof item === 'object' && item) {
            var name = extractName(item.name) || extractName(item.title) || extractName(item.label) || extractName(item) || ('عنصر ' + (i+1));
            return {id: extractId(item, 'i'+i), name: name};
          }
          return {id: 'i'+i, name: String(item)};
        });
      }
      return Object.keys(list).map(function(k){
        var v = list[k];
        return {id: k, name: extractName(v) || extractName(v && v.name) || k};
      });
    } catch(e){ console.warn('[V254] fetch '+docName+':', e); return []; }
  }
  
  async function openForm(product){
    if(!window.catMgrApp || !window.catMgrApp.state || !window.catMgrApp.state.user){
      alert('⚠️ أعد تحميل الصفحة'); return;
    }
    
    var state = window.catMgrApp.state;
    var db = firebase.firestore();
    var isEdit = !!(product && product.id);
    var p = product || {};
    
    // الحقول من v251 (بدون تغيير)
    var iS = 'width:100%;padding:12px 14px;box-sizing:border-box;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px';
    var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin:12px 0 6px';
    
    var html = ''
      + '<div class="v254-h"><h3>' + (isEdit ? '✏️ تعديل المنتج' : '➕ منتج جديد') + '</h3><button class="v254-x" id="v254-close">✕</button></div>'
      + '<div class="v254-b">'
      +   '<label style="'+lS+'">اسم المنتج *</label><input id="v254-name" type="text" value="'+esc(p.name||'')+'" style="'+iS+'">'
      +   '<label style="'+lS+'">الوصف</label><textarea id="v254-desc" rows="2" style="'+iS+'">'+esc(p.desc||'')+'</textarea>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +     '<div><label style="'+lS+'">الماركة *</label><select id="v254-brand" style="'+iS+'"><option value="">⏳ تحميل...</option></select></div>'
      +     '<div><label style="'+lS+'">المورد *</label><select id="v254-supplier" style="'+iS+'"><option value="">⏳ تحميل...</option></select></div>'
      +   '</div>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +     '<div><label style="'+lS+'">سعر الجملة *</label><input id="v254-cost" type="number" min="0" value="'+(p.costPrice||'')+'" style="'+iS+'"></div>'
      +     '<div><label style="'+lS+'">سعر البيع *</label><input id="v254-price" type="number" min="0" value="'+(p.price||'')+'" style="'+iS+'"></div>'
      +   '</div>'
      +   '<label style="'+lS+'">المخزون</label><input id="v254-stock" type="number" min="0" value="'+(p.stock||0)+'" style="'+iS+'">'
      +   '<label style="'+lS+'">الصور (حد أقصى 5)</label>'
      +   '<div id="v254-imgs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"></div>'
      +   '<input type="file" id="v254-file" accept="image/*" multiple style="display:none">'
      +   '<button type="button" id="v254-upload" style="width:100%;padding:12px;background:rgba(155,77,255,.15);border:1px dashed rgba(155,77,255,.5);border-radius:12px;color:#a78bfa;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">📷 رفع صور</button>'
      +   '<div id="v254-prog" style="display:none;height:26px;background:rgba(10,8,37,.7);border-radius:8px;overflow:hidden;margin-bottom:10px;border:1px solid rgba(155,77,255,.3);position:relative"><div id="v254-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);width:0%"></div><span id="v254-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:700;color:#fff">0%</span></div>'
      + '</div>'
      + '<div class="v254-f">'
      +   (isEdit ? '<button class="v254-del" id="v254-del">🗑️</button>' : '')
      +   '<button class="v254-cancel" id="v254-cancel">إلغاء</button>'
      +   '<button class="v254-save" id="v254-save">' + (isEdit ? '💾 حفظ' : '🚀 نشر') + '</button>'
      + '</div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'v254-ov';
    overlay.innerHTML = '<div class="v254-m">' + html + '</div>';
    document.body.appendChild(overlay);
    
    function $(id){ return overlay.querySelector('#'+id); }
    var imgs = (Array.isArray(p.imgs) && p.imgs.length) ? p.imgs.slice() : (p.img ? [p.img] : []);
    var uploading = false;
    var brands = [], suppliers = [];
    
    function renderImgs(){
      $('v254-imgs').innerHTML = imgs.map(function(url, i){
        return '<div style="position:relative;aspect-ratio:1;background:#111;border:1px solid rgba(155,77,255,.3);border-radius:10px;overflow:hidden"><img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover"><button type="button" data-i="'+i+'" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,.9);color:#fff;border:none;width:22px;height:22px;border-radius:50%;font-size:12px;cursor:pointer;line-height:1">×</button></div>';
      }).join('');
      overlay.querySelectorAll('#v254-imgs button[data-i]').forEach(function(b){
        b.onclick = function(){ imgs.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); };
      });
    }
    renderImgs();
    
    $('v254-close').onclick = $('v254-cancel').onclick = function(){ overlay.remove(); };
    
    // تحميل القوائم
    fetchList('brands').then(function(list){
      brands = list;
      var sel = $('v254-brand'); if(!sel) return;
      var curId = extractId(p.brandId) || extractId(p.brand);
      sel.innerHTML = '<option value="">— اختر —</option>' + list.map(function(b){
        return '<option value="'+esc(b.id)+'" data-name="'+esc(b.name)+'" '+(curId===b.id?'selected':'')+'>'+esc(b.name)+'</option>';
      }).join('');
      console.log('[V254] brands loaded:', list.length);
    });
    fetchList('suppliers').then(function(list){
      suppliers = list;
      var sel = $('v254-supplier'); if(!sel) return;
      var curId = extractId(p.supplierId) || extractId(p.supplier);
      sel.innerHTML = '<option value="">— اختر —</option>' + list.map(function(s){
        return '<option value="'+esc(s.id)+'" data-name="'+esc(s.name)+'" '+(curId===s.id?'selected':'')+'>'+esc(s.name)+'</option>';
      }).join('');
      console.log('[V254] suppliers loaded:', list.length);
    });
    
    $('v254-upload').onclick = function(){ $('v254-file').click(); };
    $('v254-file').onchange = async function(e){
      var files = Array.prototype.slice.call(e.target.files);
      if(!files.length) return;
      var rem = 5 - imgs.length;
      if(rem <= 0){ alert('حد أقصى 5'); return; }
      if(files.length > rem) files = files.slice(0, rem);
      if(typeof window.__v102c_uploadBatch !== 'function'){ alert('رافع الصور غير جاهز'); return; }
      uploading = true;
      $('v254-prog').style.display = 'block';
      try {
        await window.__v102c_uploadBatch(files, state.cat, {
          onProgress: function(pct){ $('v254-bar').style.width = pct+'%'; $('v254-pct').textContent = pct+'%'; },
          onUrl: function(url){ imgs.push(url); renderImgs(); },
          onError: function(err){ alert('فشل: '+(err.message||'')); }
        });
      } catch(err){ alert('فشل الرفع: '+(err.message||'')); }
      $('v254-prog').style.display = 'none';
      uploading = false;
      e.target.value = '';
    };
    
    $('v254-save').onclick = async function(){
      if(uploading){ alert('انتظر رفع الصور'); return; }
      var name = $('v254-name').value.trim();
      var brandSel = $('v254-brand'), supSel = $('v254-supplier');
      var brandId = brandSel.value, supplierId = supSel.value;
      var brandName = brandId ? brandSel.options[brandSel.selectedIndex].getAttribute('data-name') : '';
      var supplierName = supplierId ? supSel.options[supSel.selectedIndex].getAttribute('data-name') : '';
      var costPrice = Number($('v254-cost').value) || 0;
      var price = Number($('v254-price').value) || 0;
      var stock = Number($('v254-stock').value) || 0;
      var desc = $('v254-desc').value.trim();
      
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
          status: 'live',
          active: true,
          publishType: 'auto',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: state.user.uid
        };
        
        var productId = p.id;
        if(isEdit){
          await db.collection('products').doc(productId).update(data);
          overlay.remove();
          if(window.__chizenToast) window.__chizenToast('تم التحديث', 'success', 'المنتج منشور للعملاء');
          else alert('✅ تم التحديث');
        } else {
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          data.createdBy = state.user.uid;
          data.createdByName = state.user.name || '';
          var ref = await db.collection('products').add(data);
          productId = ref.id;
          overlay.remove();
          if(window.__chizenToast) window.__chizenToast('تم النشر', 'success', 'المنتج ظهر للعملاء فوراً');
          else alert('✅ تم النشر');
        }
        
        // إشعار للأدمن بالتفاصيل الكاملة
        var profit = price - costPrice;
        var margin = price > 0 ? Math.round((profit / price) * 100) : 0;
        var notifBody = name + ' — ' +
          'قسم: ' + state.cat + ' — ' +
          'بيع: ' + price.toFixed(0) + ' — ' +
          'جملة: ' + costPrice.toFixed(0) + ' — ' +
          'ربح: ' + profit.toFixed(0) + ' (' + margin + '%) — ' +
          'مورد: ' + supplierName + ' — ' +
          'مدير: ' + (state.user.name || '');
        
        try {
          var admins = await db.collection('users').where('role','==','super_admin').get();
          admins.forEach(function(a){
            db.collection('notifications').add({
              userId: a.id,
              title: '📦 منتج جديد من ' + (state.user.name || 'مدير قسم'),
              body: notifBody,
              type: 'product',
              event: 'product_published',
              icon: '📦',
              productId: productId,
              category: state.cat,
              productName: name,
              productPrice: price,
              productCost: costPrice,
              supplierName: supplierName,
              managerName: state.user.name || '',
              managerUid: state.user.uid,
              read: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(){});
          });
        } catch(e){}
        
        // تحديث الشاشة
        try {
          var snap = await db.collection('products').get();
          state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
            .filter(function(pp){ return pp.category===state.cat || (Array.isArray(pp.categories) && pp.categories.indexOf(state.cat)!==-1); });
          if(window.__v100Tab) window.__v100Tab('products');
        } catch(e){}
        
      } catch(err){
        console.error('[V254] save:', err);
        btn.disabled = false; btn.textContent = isEdit ? '💾 حفظ' : '🚀 نشر';
        alert('فشل: '+(err.message||err.code||''));
      }
    };
    
    var delBtn = $('v254-del');
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
  
  window.__v102cOpenForm = openForm;
  window.__v102OpenForm = openForm;
  
  function bind(){
    if(!window.catMgrApp || !window.catMgrApp.state) return;
    var b1 = document.querySelector('.v101-add-btn');
    if(b1 && !b1.__v254){ b1.__v254 = true; b1.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openForm(null); }; }
    var b2 = document.querySelector('.v100-act[data-go="add"]');
    if(b2 && !b2.__v254){ b2.__v254 = true; b2.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openForm(null); }; }
    var b3 = document.querySelector('.v252-add');
    if(b3 && !b3.__v254){ b3.__v254 = true; b3.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openForm(null); }; }
    var cards = document.querySelectorAll('.v100-prod');
    var st = window.catMgrApp.state;
    cards.forEach(function(card, i){
      if(card.__v254) return;
      card.__v254 = true;
      card.onclick = function(e){
        e.preventDefault();
        if(st.products && st.products[i]) openForm(st.products[i]);
      };
    });
  }
  
  var mo = new MutationObserver(function(){ setTimeout(bind, 30); });
  mo.observe(document.body, { childList: true, subtree: true });
  setInterval(bind, 800);
  setTimeout(bind, 500);
  
  console.log('[V254] ready');
})();
</script>
`;

h = h.replace('</body>', v254 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v254: dropdowns fixed + auto-publish + admin notification');
